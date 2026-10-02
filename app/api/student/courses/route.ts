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

    const { data: enrollments, error } = await admin
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        class:classes (
          id,
          name,
          room,
          semester,
          academic_year,
          course:courses (
            id,
            code,
            name,
            credits,
            department:departments (name, code)
          )
        )
      `)
      .eq('student_id', studentId)

    if (error) {
      return NextResponse.json({ ok: false, message: 'Failed to fetch courses' }, { status: 500 })
    }

    // Get teacher assignments for these classes
    const classIds = (enrollments || []).map((e: any) => e.class?.id).filter(Boolean)
    const { data: assignments } = await admin
      .from('teacher_assignments')
      .select(`
        class_id,
        teacher:profiles (full_name, email)
      `)
      .in('class_id', classIds)

    const teacherMap: Record<string, string> = {}
    for (const a of assignments || []) {
      if (a.teacher) {
        teacherMap[a.class_id] = (a.teacher as any).full_name
      }
    }

    // Calculate attendance for each enrolled class
    const { data: sessions } = await admin
      .from('attendance_sessions')
      .select('id, class_id')
      .in('class_id', classIds)
      .in('status', ['active', 'ended'])

    const { data: records } = await admin
      .from('attendance_records')
      .select('session_id')
      .eq('student_id', studentId)
      .eq('status', 'present')

    const attendedSessionIds = new Set((records || []).map((r) => r.session_id))

    const result = (enrollments || []).map((e: any) => {
      const cls = e.class
      const classSessions = (sessions || []).filter((s) => s.class_id === cls.id)
      const attended = classSessions.filter((s) => attendedSessionIds.has(s.id)).length
      const total = classSessions.length
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 100

      return {
        enrollmentId: e.id,
        classId: cls.id,
        className: cls.name,
        room: cls.room || 'TBD',
        semester: cls.semester,
        academicYear: cls.academic_year,
        courseCode: cls.course?.code,
        courseName: cls.course?.name,
        credits: cls.course?.credits,
        department: cls.course?.department?.name,
        teacherName: teacherMap[cls.id] || 'Faculty Member',
        totalSessions: total,
        attendedSessions: attended,
        percentage,
      }
    })

    return NextResponse.json({ ok: true, data: result })
  } catch (err) {
    console.error('Student courses error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(['student', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const { classId } = await request.json().catch(() => ({}))
    if (!classId) {
      return NextResponse.json({ ok: false, message: 'Class ID is required.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const studentId = auth.profile?.id

    // Check class exists
    const { data: cls, error: clsErr } = await admin
      .from('classes')
      .select('id, name, course:courses(name, code)')
      .eq('id', classId)
      .maybeSingle()

    if (clsErr || !cls) {
      return NextResponse.json({ ok: false, message: 'Class section not found.' }, { status: 404 })
    }

    // Check or create enrollment
    const { data: existing } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        ok: true,
        message: `You are already enrolled in ${(cls.course as any)?.name || 'this course'} (${cls.name})!`,
        data: existing,
      })
    }

    const { data: newEnrollment, error: enrollErr } = await admin
      .from('enrollments')
      .insert({
        class_id: classId,
        student_id: studentId,
        status: 'active',
      })
      .select('id, status')
      .single()

    if (enrollErr) {
      return NextResponse.json({ ok: false, message: 'Failed to join class: ' + enrollErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully enrolled in ${(cls.course as any)?.name || 'Course'} (${cls.name})!`,
      data: newEnrollment,
    })
  } catch (err: any) {
    console.error('Direct enrollment error:', err)
    return NextResponse.json({ ok: false, message: err?.message || 'Server error' }, { status: 500 })
  }
}
