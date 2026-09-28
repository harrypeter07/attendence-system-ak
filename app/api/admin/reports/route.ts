import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(['admin', 'teacher'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const format = searchParams.get('format')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const admin = createAdminClient()

    let query = admin
      .from('attendance_records')
      .select(`
        id,
        status,
        marked_at,
        distance_meters,
        source,
        student:profiles (
          id,
          full_name,
          email,
          student_id,
          department:departments (name, code)
        ),
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
      .order('marked_at', { ascending: false })

    if (startDate) query = query.gte('marked_at', startDate)
    if (endDate) query = query.lte('marked_at', endDate)

    const { data: records, error } = await query

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    // Filter by classId in memory if specified
    const filteredRecords = classId
      ? (records || []).filter((r: any) => r.session?.class?.id === classId)
      : (records || [])

    // If teacher, only allow classes assigned to teacher
    let finalRecords = filteredRecords
    if (auth.profile?.role === 'teacher') {
      const { data: assignments } = await admin
        .from('teacher_assignments')
        .select('class_id')
        .eq('teacher_id', auth.profile.id)

      const allowedClassIds = new Set((assignments || []).map((a) => a.class_id))
      finalRecords = filteredRecords.filter((r: any) => allowedClassIds.has(r.session?.class?.id))
    }

    // CSV Export
    if (format === 'csv') {
      await logAuditEvent({
        actorId: auth.profile?.id,
        action: 'REPORT_EXPORTED',
        entityType: 'ATTENDANCE_REPORT',
        metadata: { format: 'csv', count: finalRecords.length },
      })

      const csvHeader = 'Student Name,Student ID,Email,Course,Class,Date,Time,Status,Distance (m),Verified Method\n'
      const csvRows = finalRecords.map((r: any) => {
        const studentName = `"${(r.student?.full_name || '').replace(/"/g, '""')}"`
        const studentId = `"${r.student?.student_id || ''}"`
        const email = `"${r.student?.email || ''}"`
        const course = `"${r.session?.class?.course?.name || ''} (${r.session?.class?.course?.code || ''})"`
        const cls = `"${r.session?.class?.name || ''}"`
        const dateObj = new Date(r.marked_at)
        const date = dateObj.toLocaleDateString()
        const time = dateObj.toLocaleTimeString()
        const status = r.status
        const dist = r.distance_meters !== null ? r.distance_meters : '—'
        const method = r.source

        return `${studentName},${studentId},${email},${course},${cls},${date},${time},${status},${dist},${method}`
      }).join('\n')

      return new NextResponse(csvHeader + csvRows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance-report-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    // JSON summary statistics
    const totalRecords = finalRecords.length
    const presentCount = finalRecords.filter((r: any) => r.status === 'present').length
    const lateCount = finalRecords.filter((r: any) => r.status === 'late').length
    const absentCount = finalRecords.filter((r: any) => r.status === 'absent').length

    return NextResponse.json({
      ok: true,
      data: {
        summary: {
          total: totalRecords,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          attendanceRate: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100,
        },
        records: finalRecords.slice(0, 200).map((r: any) => ({
          id: r.id,
          studentName: r.student?.full_name || 'Student',
          studentId: r.student?.student_id || '—',
          studentEmail: r.student?.email || '',
          courseName: r.session?.class?.course?.name || '',
          courseCode: r.session?.class?.course?.code || '',
          className: r.session?.class?.name || '',
          teacherName: r.session?.teacher?.full_name || '',
          date: r.marked_at,
          status: r.status,
          distanceMeters: r.distance_meters,
        })),
      },
    })
  } catch (err) {
    console.error('Reports error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
