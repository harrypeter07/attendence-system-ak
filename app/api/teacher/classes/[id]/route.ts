import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const { id: classId } = await params
    const admin = createAdminClient()

    // 1. Fetch Class with Course info
    const { data: cls, error: clsErr } = await admin
      .from('classes')
      .select(`
        id,
        name,
        room,
        semester,
        academic_year,
        capacity,
        course:courses (
          id,
          code,
          name,
          credits,
          department:departments (id, name, code)
        ),
        location_settings (
          latitude,
          longitude,
          radius_meters
        )
      `)
      .eq('id', classId)
      .maybeSingle()

    if (clsErr || !cls) {
      return NextResponse.json({ ok: false, message: 'Class not found' }, { status: 404 })
    }

    // 2. Fetch all enrolled students for this class
    const { data: enrollments, error: enrollErr } = await admin
      .from('enrollments')
      .select(`
        id,
        status,
        enrolled_at,
        student:profiles (
          id,
          full_name,
          email,
          student_id,
          avatar_url
        )
      `)
      .eq('class_id', classId)
      .order('enrolled_at', { ascending: false })

    if (enrollErr) {
      console.error('Error fetching enrollments:', enrollErr)
    }

    // 3. Fetch all attendance sessions held for this class
    const { data: sessions } = await admin
      .from('attendance_sessions')
      .select('id, started_at, ended_at, status')
      .eq('class_id', classId)
      .order('started_at', { ascending: false })

    const totalSessions = sessions?.length || 0

    // 4. Fetch all attendance records marked for these sessions
    const sessionIds = (sessions || []).map((s) => s.id)
    let records: any[] = []
    if (sessionIds.length > 0) {
      const { data: recs } = await admin
        .from('attendance_records')
        .select('id, session_id, student_id, status, marked_at')
        .in('session_id', sessionIds)
      records = recs || []
    }

    // 5. Aggregate metrics per enrolled student
    const studentList = (enrollments || []).map((e: any) => {
      const student = e.student || {}
      const studentRecords = records.filter(
        (r) => r.student_id === student.id && r.status === 'present'
      )
      const attended = studentRecords.length
      const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 100

      // Most recent session attended
      const latestRecord = [...studentRecords].sort(
        (a, b) => new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime()
      )[0]

      return {
        enrollmentId: e.id,
        enrollmentStatus: e.status,
        enrolledAt: e.enrolled_at,
        studentId: student.id,
        fullStudentId: student.student_id || 'N/A',
        name: student.full_name || 'Student',
        email: student.email || '',
        avatarUrl: student.avatar_url || null,
        totalSessions,
        attendedSessions: attended,
        percentage,
        lastAttendedAt: latestRecord?.marked_at || null,
        isAtRisk: totalSessions >= 3 && percentage < 75,
      }
    })

    // Calculate class-wide average attendance rate
    const totalPossiblePresences = (studentList.length || 0) * (totalSessions || 0)
    const totalActualPresences = records.filter((r) => r.status === 'present').length
    const classAverageRate =
      totalPossiblePresences > 0
        ? Math.round((totalActualPresences / totalPossiblePresences) * 100)
        : 100

    return NextResponse.json({
      ok: true,
      data: {
        class: {
          id: cls.id,
          name: cls.name,
          room: cls.room,
          semester: cls.semester,
          academicYear: cls.academic_year,
          course: cls.course,
          location: Array.isArray(cls.location_settings)
            ? cls.location_settings[0]
            : cls.location_settings,
        },
        stats: {
          totalEnrolled: studentList.length,
          totalSessions,
          classAverageRate,
          atRiskCount: studentList.filter((s) => s.isAtRisk).length,
        },
        students: studentList,
        sessions: (sessions || []).slice(0, 10), // latest 10 sessions
      },
    })
  } catch (err: any) {
    console.error('Class detail error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
