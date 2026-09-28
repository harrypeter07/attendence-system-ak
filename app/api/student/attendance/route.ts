import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await requireAuth(['student', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const studentId = auth.profile?.id
    const admin = createAdminClient()

    const { data: records, error } = await admin
      .from('attendance_records')
      .select(`
        id,
        status,
        marked_at,
        distance_meters,
        source,
        session:attendance_sessions (
          id,
          started_at,
          ended_at,
          teacher:profiles (full_name),
          class:classes (
            id,
            name,
            room,
            course:courses (id, code, name)
          )
        )
      `)
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false })

    if (error) {
      return NextResponse.json({ ok: false, message: 'Failed to fetch attendance history' }, { status: 500 })
    }

    const formatted = (records || []).map((r: any) => ({
      id: r.id,
      courseCode: r.session?.class?.course?.code || '—',
      courseName: r.session?.class?.course?.name || 'Class',
      className: r.session?.class?.name || '—',
      room: r.session?.class?.room || '—',
      teacherName: r.session?.teacher?.full_name || 'Faculty',
      status: r.status,
      markedAt: r.marked_at,
      distanceMeters: r.distance_meters,
      source: r.source,
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Student attendance error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
