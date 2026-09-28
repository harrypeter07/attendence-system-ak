import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

const assignmentSchema = z.object({
  teacherId: z.string().uuid('Teacher ID required'),
  classId: z.string().uuid('Class ID required'),
})

export async function GET() {
  try {
    const auth = await requireAuth(['admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const { data: assignments, error } = await admin
      .from('teacher_assignments')
      .select(`
        id,
        assigned_at,
        teacher:profiles (id, full_name, email, employee_id),
        class:classes (
          id,
          name,
          course:courses (id, code, name)
        )
      `)
      .order('assigned_at', { ascending: false })

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: assignments })
  } catch (err) {
    console.error('Teacher assignments error:', err)
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
    const validation = assignmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { teacherId, classId } = validation.data
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('teacher_assignments')
      .insert({ teacher_id: teacherId, class_id: classId })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: false, message: 'Teacher is already assigned to this class.' }, { status: 409 })
      }
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: 'TEACHER_ASSIGNED',
      entityType: 'TEACHER_ASSIGNMENT',
      entityId: data.id,
      metadata: { teacherId, classId },
    })

    return NextResponse.json({ ok: true, message: 'Teacher assigned successfully', data })
  } catch (err) {
    console.error('Teacher assignment error:', err)
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
    if (!id) return NextResponse.json({ ok: false, message: 'Assignment ID required' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('teacher_assignments').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Assignment removed' })
  } catch (err) {
    console.error('Delete assignment error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
