import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateSessionToken } from '@/lib/qr/token'
import { calculateDistance } from '@/lib/geo'
import { logAuditEvent } from '@/lib/audit'
import { getValidationErrorMessage } from '@/lib/format-error'

const verifyAttendanceSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  token: z.string().min(1, 'QR token is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(['student', 'admin', 'teacher'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const studentId = auth.profile?.id
    if (!studentId) {
      return NextResponse.json({ ok: false, message: 'Student profile not resolved' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const validation = verifyAttendanceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: getValidationErrorMessage(validation.error, 'Invalid request payload') },
        { status: 400 }
      )
    }

    const { sessionId, token, latitude, longitude } = validation.data
    const admin = createAdminClient()

    // 1. Concurrently fetch session details, validate dynamic QR token, and check duplicate scans
    const [
      { data: session, error: sessionErr },
      tokenResult,
      { data: existingRecord },
    ] = await Promise.all([
      admin
        .from('attendance_sessions')
        .select(`
          id,
          class_id,
          status,
          latitude,
          longitude,
          radius_meters,
          class:classes (
            id,
            name,
            course:courses (id, code, name)
          )
        `)
        .eq('id', sessionId)
        .maybeSingle(),
      validateSessionToken(sessionId, token),
      admin
        .from('attendance_records')
        .select('id, marked_at')
        .eq('session_id', sessionId)
        .eq('student_id', studentId)
        .maybeSingle(),
    ])

    if (sessionErr || !session) {
      return NextResponse.json({ ok: false, message: 'Attendance session not found' }, { status: 404 })
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { ok: false, message: 'This attendance session has ended or is no longer active.' },
        { status: 400 }
      )
    }

    // 2. Validate Dynamic QR Token
    if (!tokenResult.valid) {
      void admin.from('attendance_attempts').insert({
        session_id: sessionId,
        student_id: studentId,
        token_id: tokenResult.tokenId || null,
        success: false,
        reason: tokenResult.reason || 'Token invalid or expired',
      })

      void logAuditEvent({
        actorId: studentId,
        action: 'ATTENDANCE_FAILED_EXPIRED',
        entityType: 'ATTENDANCE_SESSION',
        entityId: sessionId,
        success: false,
        metadata: { reason: tokenResult.reason },
      })

      return NextResponse.json(
        {
          ok: false,
          errorType: 'expired_qr',
          message: tokenResult.reason || 'QR code expired or invalid. Please wait for the next 15-second rotation and scan again.',
        },
        { status: 400 }
      )
    }

    // 3. Database-level Duplicate Protection Check
    if (existingRecord) {
      void admin.from('attendance_attempts').insert({
        session_id: sessionId,
        student_id: studentId,
        token_id: tokenResult.tokenId,
        success: false,
        reason: 'Duplicate scan attempt',
      })

      return NextResponse.json(
        {
          ok: false,
          message: 'Your attendance has already been recorded for this session.',
          markedAt: existingRecord.marked_at,
        },
        { status: 409 }
      )
    }

    // 4. Verify Location / Geofence
    const sessionLat = Number(session.latitude)
    const sessionLng = Number(session.longitude)
    const radiusMeters = session.radius_meters || 100

    let distanceMeters: number | null = null

    // Check location if session has classroom coordinates specified
    if (sessionLat !== 0 || sessionLng !== 0) {
      if (latitude === 0 && longitude === 0) {
        return NextResponse.json(
          {
            ok: false,
            errorType: 'gps_required',
            message: 'Classroom GPS verification is required. Your device location was not detected. Please enable GPS/Location in your browser and device settings.',
          },
          { status: 400 }
        )
      }

      distanceMeters = calculateDistance(sessionLat, sessionLng, latitude, longitude)

      if (distanceMeters > radiusMeters) {
        void admin.from('attendance_attempts').insert({
          session_id: sessionId,
          student_id: studentId,
          token_id: tokenResult.tokenId,
          success: false,
          reason: `Location out of bounds: ${Math.round(distanceMeters)}m > ${radiusMeters}m`,
          distance_meters: distanceMeters,
        })

        void logAuditEvent({
          actorId: studentId,
          action: 'ATTENDANCE_FAILED_LOCATION',
          entityType: 'ATTENDANCE_SESSION',
          entityId: sessionId,
          success: false,
          metadata: {
            distanceMeters,
            radiusMeters,
            studentCoords: { latitude, longitude },
            sessionCoords: { latitude: sessionLat, longitude: sessionLng },
          },
        })

        return NextResponse.json(
          {
            ok: false,
            errorType: 'geofence_violation',
            message: `You are too far from the classroom (${Math.round(distanceMeters)}m away). Attendance is only allowed within ${radiusMeters} meters of the classroom.`,
            distance: Math.round(distanceMeters),
            allowedRadius: radiusMeters,
          },
          { status: 400 }
        )
      }
    }

    // 5. Verify Student is Enrolled in this class (Auto-Enrolls on First Scan!)
    let { data: enrollment } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('class_id', session.class_id)
      .eq('student_id', studentId)
      .maybeSingle()

    if (!enrollment) {
      const { data: newEnrollment, error: enrollErr } = await admin
        .from('enrollments')
        .insert({
          class_id: session.class_id,
          student_id: studentId,
          status: 'active',
        })
        .select('id, status')
        .single()

      if (!enrollErr && newEnrollment) {
        enrollment = newEnrollment
      }
    } else if (enrollment.status !== 'active') {
      void admin.from('attendance_attempts').insert({
        session_id: sessionId,
        student_id: studentId,
        success: false,
        reason: 'Student enrollment is inactive or suspended',
      })

      return NextResponse.json(
        { ok: false, message: 'Your enrollment in this class is suspended.' },
        { status: 403 }
      )
    }

    // 6. Record Attendance
    const markedAt = new Date().toISOString()
    const { error: insertError } = await admin.from('attendance_records').insert({
      session_id: sessionId,
      student_id: studentId,
      status: 'present',
      distance_meters: distanceMeters,
      student_latitude: latitude,
      student_longitude: longitude,
      source: 'qr',
      marked_at: markedAt,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { ok: false, message: 'Your attendance was already recorded for this session.' },
          { status: 409 }
        )
      }
      console.error('Failed to insert attendance record:', insertError)
      return NextResponse.json({ ok: false, message: 'Failed to record attendance' }, { status: 500 })
    }

    // 7. Non-blocking async audit & attempt logging
    void admin.from('attendance_attempts').insert({
      session_id: sessionId,
      student_id: studentId,
      token_id: tokenResult.tokenId,
      success: true,
      distance_meters: distanceMeters,
    })

    void logAuditEvent({
      actorId: studentId,
      action: 'ATTENDANCE_SUCCESS',
      entityType: 'ATTENDANCE_SESSION',
      entityId: sessionId,
      success: true,
      metadata: { distanceMeters, markedAt },
    })

    const courseName = (session.class as any)?.course?.name || 'Class'
    const courseCode = (session.class as any)?.course?.code || ''

    return NextResponse.json({
      ok: true,
      message: 'Attendance successfully verified and recorded!',
      data: {
        courseName,
        courseCode,
        markedAt,
        distanceMeters: distanceMeters !== null ? Math.round(distanceMeters) : null,
      },
    })
  } catch (err) {
    console.error('Attendance verification error:', err)
    return NextResponse.json({ ok: false, message: 'Internal verification error' }, { status: 500 })
  }
}
