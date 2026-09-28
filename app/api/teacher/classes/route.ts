import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await requireAuth(['teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const teacherId = auth.profile?.id

    // Fetch classes assigned to this teacher (or all classes if admin)
    let query = admin
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

    if (auth.profile?.role === 'teacher') {
      const { data: assignments } = await admin
        .from('teacher_assignments')
        .select('class_id')
        .eq('teacher_id', teacherId)

      const classIds = (assignments || []).map((a) => a.class_id)
      if (classIds.length === 0) {
        return NextResponse.json({ ok: true, data: [] })
      }
      query = query.in('id', classIds)
    }

    const { data: classes, error } = await query

    if (error) {
      console.error('Error fetching teacher classes:', error)
      return NextResponse.json({ ok: false, message: 'Failed to fetch assigned classes' }, { status: 500 })
    }

    // Get enrollment counts for each class
    const classIds = (classes || []).map((c) => c.id)
    const { data: enrollments } = await admin
      .from('enrollments')
      .select('class_id')
      .in('class_id', classIds)

    const enrollmentCounts: Record<string, number> = {}
    for (const e of enrollments || []) {
      enrollmentCounts[e.class_id] = (enrollmentCounts[e.class_id] || 0) + 1
    }

    const formatted = (classes || []).map((c) => ({
      id: c.id,
      name: c.name,
      room: c.room,
      semester: c.semester,
      academicYear: c.academic_year,
      capacity: c.capacity,
      course: c.course,
      enrolledCount: enrollmentCounts[c.id] || 0,
      location: Array.isArray(c.location_settings) ? c.location_settings[0] : c.location_settings,
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Teacher classes error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
