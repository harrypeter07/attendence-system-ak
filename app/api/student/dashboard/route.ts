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

    // 1. Fetch student's enrollments
    const { data: enrollments } = await admin
      .from('enrollments')
      .select(`
        class_id,
        class:classes (
          id,
          name,
          room,
          course:courses (
            id,
            code,
            name
          )
        )
      `)
      .eq('student_id', studentId)

    const classIds = (enrollments || []).map((e) => e.class_id)

    // 2. Fetch total sessions held for these classes
    let totalSessionsCount = 0
    let sessions: any[] = []
    if (classIds.length > 0) {
      const { data: sessData } = await admin
        .from('attendance_sessions')
        .select('id, class_id, status')
        .in('class_id', classIds)
        .in('status', ['ended', 'active'])

      sessions = sessData || []
      totalSessionsCount = sessions.length
    }

    // 3. Fetch student's attendance records
    const { data: records } = await admin
      .from('attendance_records')
      .select(`
        id,
        session_id,
        status,
        marked_at,
        distance_meters,
        session:attendance_sessions (
          id,
          started_at,
          class:classes (
            id,
            name,
            course:courses (id, code, name)
          )
        )
      `)
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false })

    const attendedCount = (records || []).filter((r) => r.status === 'present').length
    const overallPercentage = totalSessionsCount > 0
      ? Math.round((attendedCount / totalSessionsCount) * 100)
      : 100

    const recentRecords = (records || []).slice(0, 5).map((r: any) => ({
      id: r.id,
      courseName: r.session?.class?.course?.name || 'Class',
      courseCode: r.session?.class?.course?.code || '',
      date: r.marked_at,
      status: r.status,
      distance: r.distance_meters ? `${r.distance_meters}m` : 'Verified',
    }))

    // Course breakdown
    const courseStats = (enrollments || []).map((e: any) => {
      const classId = e.class_id
      const classSessions = sessions.filter((s) => s.class_id === classId)
      const classRecords = (records || []).filter((r: any) => r.session?.class?.id === classId && r.status === 'present')
      const total = classSessions.length
      const attended = classRecords.length
      const percent = total > 0 ? Math.round((attended / total) * 100) : 100

      return {
        classId,
        className: e.class?.name,
        courseCode: e.class?.course?.code,
        courseName: e.class?.course?.name,
        room: e.class?.room,
        totalSessions: total,
        attendedSessions: attended,
        percentage: percent,
        status: percent >= 75 ? 'Good' : 'At risk',
      }
    })

    return NextResponse.json({
      ok: true,
      data: {
        studentName: auth.profile?.full_name,
        studentId: auth.profile?.student_id,
        enrolledCount: enrollments?.length || 0,
        totalSessions: totalSessionsCount,
        attendedCount,
        overallPercentage,
        isAtRisk: overallPercentage < 75,
        courseStats,
        recentRecords,
      },
    })
  } catch (err) {
    console.error('Student dashboard error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
