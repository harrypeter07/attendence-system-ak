import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

const createTeacherSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  employeeId: z.string().min(2, 'Employee ID required'),
  departmentId: z.string().uuid().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const auth = await requireAuth(['admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()

    const { data: teachers, error } = await admin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        employee_id,
        status,
        phone,
        created_at,
        department:departments (id, name, code)
      `)
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ ok: false, message: 'Failed to fetch teachers' }, { status: 500 })
    }

    // Fetch class assignments for each teacher
    const teacherIds = (teachers || []).map((t) => t.id)
    let assignments: any[] = []
    if (teacherIds.length > 0) {
      const { data } = await admin
        .from('teacher_assignments')
        .select(`
          teacher_id,
          class:classes (
            id,
            name,
            course:courses (code, name)
          )
        `)
        .in('teacher_id', teacherIds)
      assignments = data || []
    }

    const assignmentMap: Record<string, any[]> = {}
    for (const a of assignments || []) {
      if (!assignmentMap[a.teacher_id]) assignmentMap[a.teacher_id] = []
      assignmentMap[a.teacher_id].push(a.class)
    }

    const formatted = (teachers || []).map((t: any) => ({
      id: t.id,
      fullName: t.full_name,
      email: t.email,
      employeeId: t.employee_id || '—',
      department: t.department?.name || 'General',
      departmentId: t.department?.id || null,
      status: t.status,
      phone: t.phone || '',
      classes: assignmentMap[t.id] || [],
      assignedCount: (assignmentMap[t.id] || []).length,
      createdAt: t.created_at,
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Teachers fetch error:', err)
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
    const validation = createTeacherSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { fullName, email, password, employeeId, departmentId, phone } = validation.data
    const admin = createAdminClient()

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'teacher' },
    })

    if (authError || !authUser.user) {
      return NextResponse.json(
        { ok: false, message: authError?.message || 'Failed to create teacher user' },
        { status: 400 }
      )
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        full_name: fullName,
        email,
        role: 'teacher',
        employee_id: employeeId,
        department_id: departmentId || null,
        phone: phone || null,
        status: 'active',
      })

    if (profileError) {
      return NextResponse.json({ ok: false, message: profileError.message }, { status: 500 })
    }

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: 'USER_CREATED',
      entityType: 'TEACHER',
      entityId: authUser.user.id,
      metadata: { fullName, email, employeeId },
    })

    return NextResponse.json({
      ok: true,
      message: 'Teacher account created successfully',
      data: { id: authUser.user.id, fullName, email, employeeId },
    })
  } catch (err) {
    console.error('Create teacher error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth(['admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => null)
    if (!body?.id) {
      return NextResponse.json({ ok: false, message: 'Teacher ID required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }

    if (body.fullName) updateData.full_name = body.fullName.trim()
    if (body.employeeId) updateData.employee_id = body.employeeId.trim()
    if (body.status) updateData.status = body.status
    if (body.departmentId !== undefined) updateData.department_id = body.departmentId || null
    if (body.phone !== undefined) updateData.phone = body.phone

    const { error } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', body.id)
      .eq('role', 'teacher')

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: body.status === 'inactive' ? 'USER_DEACTIVATED' : 'USER_UPDATED',
      entityType: 'TEACHER',
      entityId: body.id,
      metadata: updateData,
    })

    return NextResponse.json({ ok: true, message: 'Teacher updated successfully' })
  } catch (err) {
    console.error('Update teacher error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
