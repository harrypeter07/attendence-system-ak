import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

const deptSchema = z.object({
  name: z.string().min(2, 'Department name required'),
  code: z.string().min(2, 'Department code required').max(10),
  description: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const auth = await requireAuth(['admin', 'teacher', 'student'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const { data: departments, error } = await admin
      .from('departments')
      .select('*')
      .order('name')

    if (error) {
      return NextResponse.json({ ok: false, message: 'Failed to fetch departments' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: departments })
  } catch (err) {
    console.error('Departments error:', err)
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
    const validation = deptSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { name, code, description } = validation.data
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('departments')
      .insert({ name: name.trim(), code: code.trim().toUpperCase(), description: description?.trim() })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: 'DEPARTMENT_CREATED',
      entityType: 'DEPARTMENT',
      entityId: data.id,
      metadata: { name, code },
    })

    return NextResponse.json({ ok: true, message: 'Department created', data })
  } catch (err) {
    console.error('Create department error:', err)
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
    const { error } = await admin.from('departments').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Department deleted' })
  } catch (err) {
    console.error('Delete department error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
