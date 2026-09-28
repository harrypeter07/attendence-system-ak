import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const { id: sessionId } = await params
    const admin = createAdminClient()

    const { data: session, error } = await admin
      .from('attendance_sessions')
      .select(`
        id,
        teacher_id,
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
          semester,
          academic_year,
          course:courses (id, code, name)
        ),
        records:attendance_records (
          id,
          status,
          marked_at,
          distance_meters,
          source,
          student:profiles (
            id,
            full_name,
            email,
            student_id
          )
        )
      `)
      .eq('id', sessionId)
      .maybeSingle()

    if (error || !session) {
      return NextResponse.json({ ok: false, message: 'Session not found' }, { status: 404 })
    }

    // Verify ownership if teacher
    if (auth.profile?.role === 'teacher' && session.teacher_id !== auth.profile?.id) {
      return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }

    // Fetch total enrolled students for this class
    const { count: enrolledCount } = await admin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', session.class?.id)

    // Sort records newest first
    const attendees = (session.records || []).map((r: any) => ({
      id: r.id,
      studentName: r.student?.full_name || 'Unknown',
      studentEmail: r.student?.email || '',
      studentId: r.student?.student_id || 'N/A',
      markedAt: r.marked_at,
      distanceMeters: r.distance_meters,
      status: r.status,
    })).sort((a: any, b: any) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime())

    return NextResponse.json({
      ok: true,
      data: {
        id: session.id,
        status: session.status,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        latitude: Number(session.latitude),
        longitude: Number(session.longitude),
        radiusMeters: session.radius_meters,
        className: session.class?.name || '',
        room: session.class?.room || '',
        courseCode: session.class?.course?.code || '',
        courseName: session.class?.course?.name || '',
        totalEnrolled: enrolledCount || 0,
        presentCount: attendees.length,
        attendees,
      },
    })
  } catch (err) {
    console.error('Session details error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const { id: sessionId } = await params
    const body = await request.json().catch(() => ({}))
    const admin = createAdminClient()

    // Verify session
    const { data: session } = await admin
      .from('attendance_sessions')
      .select('id, teacher_id, status')
      .eq('id', sessionId)
      .maybeSingle()

    if (!session) {
      return NextResponse.json({ ok: false, message: 'Session not found' }, { status: 404 })
    }

    if (auth.profile?.role === 'teacher' && session.teacher_id !== auth.profile?.id) {
      return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }

    if (body.action === 'end' || body.status === 'ended') {
      await admin
        .from('attendance_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      await logAuditEvent({
        actorId: auth.profile?.id,
        action: 'SESSION_ENDED',
        entityType: 'ATTENDANCE_SESSION',
        entityId: sessionId,
      })

      return NextResponse.json({ ok: true, message: 'Session ended successfully' })
    }

    return NextResponse.json({ ok: false, message: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Update session error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
