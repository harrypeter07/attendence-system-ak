import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

const classSchema = z.object({
  courseId: z.string().uuid('Course required'),
  name: z.string().min(1, 'Section name required'),
  room: z.string().optional().nullable(),
  semester: z.string().min(1, 'Semester required'),
  academicYear: z.string().min(1, 'Academic year required'),
  capacity: z.number().int().min(1).optional().nullable(),
  latitude: z.number().optional().default(12.9716),
  longitude: z.number().optional().default(77.5946),
  radiusMeters: z.number().int().min(5).max(5000).optional().default(100),
})

export async function GET() {
  try {
    const auth = await requireAuth(['admin', 'teacher'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const { data: classes, error } = await admin
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
          department:departments (name)
        ),
        location_settings (
          latitude,
          longitude,
          radius_meters
        ),
        teacher_assignments (
          teacher:profiles (id, full_name, email)
        ),
        enrollments (id)
      `)
      .order('name')

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    const formatted = (classes || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      room: c.room || 'TBD',
      semester: c.semester,
      academicYear: c.academic_year,
      capacity: c.capacity,
      courseId: c.course?.id,
      courseCode: c.course?.code,
      courseName: c.course?.name,
      department: c.course?.department?.name,
      enrolledCount: (c.enrollments || []).length,
      teachers: (c.teacher_assignments || []).map((ta: any) => ta.teacher?.full_name).filter(Boolean),
      location: Array.isArray(c.location_settings) ? c.location_settings[0] : c.location_settings,
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Classes fetch error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(['admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => null)
    const validation = classSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { courseId, name, room, semester, academicYear, capacity, latitude, longitude, radiusMeters } = validation.data
    const admin = createAdminClient()

    const { data: newClass, error: classError } = await admin
      .from('classes')
      .insert({
        course_id: courseId,
        name: name.trim(),
        room: room?.trim() || null,
        semester: semester.trim(),
        academic_year: academicYear.trim(),
        capacity: capacity || null,
      })
      .select()
      .single()

    if (classError || !newClass) {
      return NextResponse.json({ ok: false, message: classError?.message || 'Failed to create class' }, { status: 400 })
    }

    // Set default location settings for this class
    await admin
      .from('location_settings')
      .upsert({
        class_id: newClass.id,
        latitude,
        longitude,
        radius_meters: radiusMeters,
      })

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: 'CLASS_CREATED',
      entityType: 'CLASS',
      entityId: newClass.id,
      metadata: { name, room, semester },
    })

    return NextResponse.json({ ok: true, message: 'Class created', data: newClass })
  } catch (err) {
    console.error('Create class error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(['admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, message: 'ID required' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('classes').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Class deleted' })
  } catch (err) {
    console.error('Delete class error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
