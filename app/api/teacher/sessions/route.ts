import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSessionToken } from '@/lib/qr/token'
import { logAuditEvent } from '@/lib/audit'

const startSessionSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  latitude: z.number().min(-90).max(90).default(0),
  longitude: z.number().min(-180).max(180).default(0),
  radiusMeters: z.number().min(5).max(5000).default(100),
})

export async function GET() {
  try {
    const auth = await requireAuth(['teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const teacherId = auth.profile?.id

    let query = admin
      .from('attendance_sessions')
      .select(`
        id,
        status,
        started_at,
        ended_at,
        latitude,
        longitude,
        radius_meters,
        class:classes (
          id,
          name,
          room,
          course:courses (id, code, name)
        ),
        records:attendance_records (id, student_id, status)
      `)
      .order('started_at', { ascending: false })

    if (auth.profile?.role === 'teacher') {
      query = query.eq('teacher_id', teacherId)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ ok: false, message: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Get enrollment counts for classes
    const classIds = Array.from(new Set((sessions || []).map((s) => s.class?.id).filter(Boolean)))
    const { data: enrollments } = await admin
      .from('enrollments')
      .select('class_id')
      .in('class_id', classIds)

    const enrollmentCounts: Record<string, number> = {}
    for (const e of enrollments || []) {
      enrollmentCounts[e.class_id] = (enrollmentCounts[e.class_id] || 0) + 1
    }

    const formatted = (sessions || []).map((s) => ({
      id: s.id,
      status: s.status,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      radiusMeters: s.radius_meters,
      className: s.class?.name || 'Class',
      courseCode: s.class?.course?.code || '',
      courseName: s.class?.course?.name || '',
      room: s.class?.room || '',
      presentCount: (s.records || []).filter((r: { status: string }) => r.status === 'present').length,
      totalEnrolled: enrollmentCounts[s.class?.id] || 0,
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Sessions list error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}

import { getValidationErrorMessage } from '@/lib/format-error'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(['teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => null)
    const validation = startSessionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: getValidationErrorMessage(validation.error) },
        { status: 400 }
      )
    }

    const { classId, latitude, longitude, radiusMeters } = validation.data
    const admin = createAdminClient()
    const teacherId = auth.profile?.id

    // Verify teacher assignment unless admin
    if (auth.profile?.role === 'teacher') {
      const { data: assigned } = await admin
        .from('teacher_assignments')
        .select('id')
        .eq('class_id', classId)
        .eq('teacher_id', teacherId)
        .maybeSingle()

      if (!assigned) {
        return NextResponse.json(
          { ok: false, message: 'You are not assigned to teach this class.' },
          { status: 403 }
        )
      }
    }

    // Verify there isn't already an active session for this class
    const { data: activeSession } = await admin
      .from('attendance_sessions')
      .select('id')
      .eq('class_id', classId)
      .eq('status', 'active')
      .maybeSingle()

    let sessionId: string

    if (activeSession) {
      sessionId = activeSession.id
      // Update coordinates if updated
      await admin
        .from('attendance_sessions')
        .update({ latitude, longitude, radius_meters: radiusMeters })
        .eq('id', sessionId)
    } else {
      const { data: newSession, error: createError } = await admin
        .from('attendance_sessions')
        .insert({
          class_id: classId,
          teacher_id: teacherId,
          status: 'active',
          latitude,
          longitude,
          radius_meters: radiusMeters,
        })
        .select('id')
        .single()

      if (createError || !newSession) {
        console.error('Session creation error:', createError)
        return NextResponse.json({ ok: false, message: 'Failed to start session.' }, { status: 500 })
      }
      sessionId = newSession.id

      await logAuditEvent({
        actorId: teacherId,
        action: 'SESSION_STARTED',
        entityType: 'ATTENDANCE_SESSION',
        entityId: sessionId,
        metadata: { classId, latitude, longitude, radiusMeters },
      })
    }

    // Generate the initial 15-second dynamic token
    const tokenData = await createSessionToken(sessionId)

    return NextResponse.json({
      ok: true,
      data: {
        id: sessionId,
        sessionId,
        token: tokenData.token,
        validFrom: tokenData.validFrom,
        validUntil: tokenData.validUntil,
        intervalSeconds: tokenData.intervalSeconds,
      },
    })
  } catch (err) {
    console.error('Start session error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
