import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const { data: sessions, error } = await admin
      .from('attendance_sessions')
      .select(`
        id,
        status,
        started_at,
        ended_at,
        teacher:profiles (full_name),
        class:classes (
          id,
          name,
          course:courses (id, code, name)
        ),
        records:attendance_records (id, status)
      `)
      .order('started_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    const formatted = (sessions || []).map((s: any) => ({
      id: s.id,
      course: s.class?.course?.name || 'Class',
      code: s.class?.course?.code || '',
      teacher: s.teacher?.full_name || 'Faculty',
      date: s.started_at ? new Date(s.started_at).toISOString().slice(0, 10) : '',
      present: (s.records || []).filter((r: any) => r.status === 'present').length,
      status: s.status,
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Attendance route error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
