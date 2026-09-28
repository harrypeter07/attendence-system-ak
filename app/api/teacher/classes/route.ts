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

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(['teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const teacherId = auth.profile?.id
    const body = await request.json()
    const {
      courseName,
      courseCode,
      className,
      room,
      semester = 'Spring 2026',
      academicYear = '2025-2026',
      credits = 3,
      departmentId,
      latitude = 0,
      longitude = 0,
      radiusMeters = 100,
    } = body

    if (!body.courseId && (!courseName || courseName.trim().length < 2)) {
      return NextResponse.json(
        { ok: false, message: 'Course name must be at least 2 characters.' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // 1. Resolve department: use provided, teacher's profile department, pick existing, or create default
    let targetDeptId = departmentId || auth.profile?.department_id
    if (!targetDeptId) {
      const { data: depts } = await admin.from('departments').select('id').limit(1)
      if (depts && depts.length > 0) {
        targetDeptId = depts[0].id
      } else {
        const { data: newDept, error: deptErr } = await admin
          .from('departments')
          .insert({
            name: 'Academic Affairs',
            code: 'ACAD',
            description: 'Standard institutional academic department',
          })
          .select('id')
          .single()

        if (deptErr) {
          console.error('Failed to create department:', deptErr)
          return NextResponse.json({ ok: false, message: 'Department error: ' + deptErr.message }, { status: 500 })
        }
        targetDeptId = newDept.id
      }
    }

    // 2. Resolve course: use provided courseId, or search by code/name, or insert new
    let courseId = body.courseId

    if (!courseId) {
      const cleanName = courseName.trim()
      const requestedCode = courseCode && courseCode.trim().length > 0
        ? courseCode.trim().toUpperCase()
        : null

      // Check if course already exists by code or by name
      let existingCourse: any = null

      if (requestedCode) {
        const { data } = await admin
          .from('courses')
          .select('id, code, name')
          .eq('code', requestedCode)
          .maybeSingle()
        existingCourse = data
      }

      if (!existingCourse) {
        const { data } = await admin
          .from('courses')
          .select('id, code, name')
          .ilike('name', cleanName)
          .maybeSingle()
        existingCourse = data
      }

      if (existingCourse) {
        courseId = existingCourse.id
      } else {
        let codeToUse = requestedCode || ((cleanName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CRS') + Math.floor(100 + Math.random() * 900))

        const { data: newCourse, error: courseErr } = await admin
          .from('courses')
          .insert({
            department_id: targetDeptId,
            code: codeToUse,
            name: cleanName,
            credits: Number(credits) || 3,
            description: `Course instructed by faculty`,
          })
          .select('id')
          .single()

        if (courseErr) {
          // If code collision, try with unique suffix
          if (courseErr.code === '23505') {
            const fallbackCode = `${codeToUse}-${Math.floor(100 + Math.random() * 900)}`
            const { data: fallbackCourse, error: fallbackErr } = await admin
              .from('courses')
              .insert({
                department_id: targetDeptId,
                code: fallbackCode,
                name: cleanName,
                credits: Number(credits) || 3,
                description: `Course instructed by faculty`,
              })
              .select('id')
              .single()

            if (fallbackErr) {
              console.error('Failed to create course with fallback code:', fallbackErr)
              return NextResponse.json({ ok: false, message: 'Could not create course: ' + fallbackErr.message }, { status: 500 })
            }
            courseId = fallbackCourse.id
          } else {
            console.error('Failed to create course:', courseErr)
            return NextResponse.json({ ok: false, message: 'Course creation failed: ' + courseErr.message }, { status: 500 })
          }
        } else {
          courseId = newCourse.id
        }
      }
    }

    // 3. Resolve class section (check if class already exists to prevent duplicate key 500)
    const sectionName = (className || 'Section A').trim()
    const roomNumber = (room || 'Room 101').trim()
    const sem = (semester || 'Spring 2026').trim()
    const year = (academicYear || '2025-2026').trim()

    let targetClass: any = null

    // Check for existing class with matching (course_id, name, semester, academic_year)
    const { data: existingClass } = await admin
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
        )
      `)
      .eq('course_id', courseId)
      .eq('name', sectionName)
      .eq('semester', sem)
      .eq('academic_year', year)
      .maybeSingle()

    if (existingClass) {
      targetClass = existingClass
      // Update room if provided and changed
      if (roomNumber && roomNumber !== existingClass.room) {
        await admin.from('classes').update({ room: roomNumber }).eq('id', existingClass.id)
        targetClass.room = roomNumber
      }
    } else {
      const { data: newClass, error: classErr } = await admin
        .from('classes')
        .insert({
          course_id: courseId,
          name: sectionName,
          room: roomNumber,
          semester: sem,
          academic_year: year,
          capacity: 60,
        })
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
          )
        `)
        .single()

      if (classErr) {
        // If race condition duplicate, fetch it
        if (classErr.code === '23505') {
          const { data: fallbackFetched } = await admin
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
              )
            `)
            .eq('course_id', courseId)
            .eq('name', sectionName)
            .eq('semester', sem)
            .eq('academic_year', year)
            .single()

          targetClass = fallbackFetched
        } else {
          console.error('Failed to create class:', classErr)
          return NextResponse.json({ ok: false, message: 'Class creation failed: ' + classErr.message }, { status: 500 })
        }
      } else {
        targetClass = newClass
      }
    }

    if (!targetClass) {
      return NextResponse.json({ ok: false, message: 'Failed to initialize class record' }, { status: 500 })
    }

    // 4. Assign class to current teacher (safely handle duplicates)
    const { data: existingAssignment } = await admin
      .from('teacher_assignments')
      .select('id')
      .eq('class_id', targetClass.id)
      .eq('teacher_id', teacherId)
      .maybeSingle()

    if (!existingAssignment) {
      const { error: assignErr } = await admin.from('teacher_assignments').insert({
        class_id: targetClass.id,
        teacher_id: teacherId,
      })
      if (assignErr && assignErr.code !== '23505') {
        console.warn('Teacher assignment notice:', assignErr)
      }
    }

    // 5. Save location settings if provided
    if (latitude && longitude) {
      await admin.from('location_settings').upsert({
        class_id: targetClass.id,
        latitude,
        longitude,
        radius_meters: Number(radiusMeters) || 100,
      }, { onConflict: 'class_id' })
    }

    // 6. Get enrolled count
    const { count: enrolledCount } = await admin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', targetClass.id)

    return NextResponse.json({
      ok: true,
      message: existingClass
        ? `Class section "${targetClass.course?.name || 'Course'} (${targetClass.name})" is now attached to your schedule!`
        : `Course & class "${targetClass.course?.name || 'Course'} (${targetClass.name})" created successfully!`,
      data: {
        id: targetClass.id,
        name: targetClass.name,
        room: targetClass.room,
        semester: targetClass.semester,
        academicYear: targetClass.academic_year,
        capacity: targetClass.capacity,
        course: targetClass.course,
        enrolledCount: enrolledCount || 0,
        location: latitude && longitude ? { latitude, longitude, radius_meters: radiusMeters || 100 } : null,
      },
    })
  } catch (err: any) {
    console.error('Teacher create class error:', err)
    return NextResponse.json({ ok: false, message: err?.message || 'Server error' }, { status: 500 })
  }
}

