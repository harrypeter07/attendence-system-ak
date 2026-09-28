import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

const enrollmentSchema = z.object({
  studentId: z.string().uuid('Student ID required'),
  classId: z.string().uuid('Class ID required'),
})

export async function GET() {
  try {
    const auth = await requireAuth(['admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const { data: enrollments, error } = await admin
      .from('enrollments')
      .select(`
        id,
        status,
        enrolled_at,
        student:profiles (id, full_name, email, student_id),
        class:classes (
          id,
          name,
          room,
          course:courses (id, code, name)
        )
      `)
      .order('enrolled_at', { ascending: false })

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    const formatted = (enrollments || []).map((e: any) => ({
      id: e.id,
      studentId: e.student?.id,
      studentName: e.student?.full_name || 'Student',
      studentEmail: e.student?.email || '',
      studentCode: e.student?.student_id || '—',
      classId: e.class?.id,
      className: e.class?.name || 'Section',
      courseCode: e.class?.course?.code || '',
      courseName: e.class?.course?.name || '',
      status: e.status,
      enrolledAt: e.enrolled_at,
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Enrollments error:', err)
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
    const validation = enrollmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { studentId, classId } = validation.data
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('enrollments')
      .insert({ student_id: studentId, class_id: classId, status: 'active' })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: false, message: 'Student is already enrolled in this class.' }, { status: 409 })
      }
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: 'ENROLLMENT_CREATED',
      entityType: 'ENROLLMENT',
      entityId: data.id,
      metadata: { studentId, classId },
    })

    return NextResponse.json({ ok: true, message: 'Student enrolled successfully', data })
  } catch (err) {
    console.error('Enrollment error:', err)
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
    if (!id) return NextResponse.json({ ok: false, message: 'Enrollment ID required' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('enrollments').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Enrollment removed' })
  } catch (err) {
    console.error('Delete enrollment error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
