import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

const courseSchema = z.object({
  departmentId: z.string().uuid('Department required'),
  code: z.string().min(2, 'Course code required'),
  name: z.string().min(2, 'Course name required'),
  credits: z.number().int().min(1).max(10).default(3),
  description: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const auth = await requireAuth(['admin', 'teacher', 'student'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const { data: courses, error } = await admin
      .from('courses')
      .select(`
        id,
        code,
        name,
        credits,
        description,
        created_at,
        department:departments (id, name, code),
        classes (
          id,
          name,
          room,
          semester,
          academic_year
        )
      `)
      .order('code')

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    const formatted = (courses || []).map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      credits: c.credits,
      description: c.description,
      department: c.department?.name || 'General',
      departmentCode: c.department?.code || '',
      departmentId: c.department?.id || null,
      classesCount: (c.classes || []).length,
      classes: c.classes || [],
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Courses fetch error:', err)
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
    const validation = courseSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { departmentId, code, name, credits, description } = validation.data
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('courses')
      .insert({
        department_id: departmentId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        credits,
        description: description?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: 'COURSE_CREATED',
      entityType: 'COURSE',
      entityId: data.id,
      metadata: { code, name },
    })

    return NextResponse.json({ ok: true, message: 'Course created', data })
  } catch (err) {
    console.error('Create course error:', err)
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
    const { error } = await admin.from('courses').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Course deleted' })
  } catch (err) {
    console.error('Delete course error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
