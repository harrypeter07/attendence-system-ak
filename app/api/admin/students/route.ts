import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

const createStudentSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  studentId: z.string().min(2, 'Student ID required'),
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

    const { data: students, error } = await admin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        student_id,
        status,
        phone,
        created_at,
        department:departments (id, name, code)
      `)
      .eq('role', 'student')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ ok: false, message: 'Failed to fetch students' }, { status: 500 })
    }

    // Fetch attendance stats for each student
    const studentIds = (students || []).map((s) => s.id)
    let records: any[] = []
    if (studentIds.length > 0) {
      const { data } = await admin
        .from('attendance_records')
        .select('student_id, status')
        .in('student_id', studentIds)
      records = data || []
    }

    const presentMap: Record<string, number> = {}
    for (const r of records || []) {
      if (r.status === 'present') {
        presentMap[r.student_id] = (presentMap[r.student_id] || 0) + 1
      }
    }

    const formatted = (students || []).map((s: any) => ({
      id: s.id,
      fullName: s.full_name,
      email: s.email,
      studentId: s.student_id || '—',
      department: s.department?.name || 'General',
      departmentCode: s.department?.code || '',
      departmentId: s.department?.id || null,
      status: s.status,
      phone: s.phone || '',
      presentSessions: presentMap[s.id] || 0,
      createdAt: s.created_at,
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Students fetch error:', err)
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
    const validation = createStudentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      )
    }

    const { fullName, email, password, studentId, departmentId, phone } = validation.data
    const admin = createAdminClient()

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'student' },
    })

    if (authError || !authUser.user) {
      return NextResponse.json(
        { ok: false, message: authError?.message || 'Failed to create student auth user' },
        { status: 400 }
      )
    }

    // Insert or update profile
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        full_name: fullName,
        email,
        role: 'student',
        student_id: studentId,
        department_id: departmentId || null,
        phone: phone || null,
        status: 'active',
      })

    if (profileError) {
      console.error('Profile create error:', profileError)
      return NextResponse.json({ ok: false, message: profileError.message }, { status: 500 })
    }

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: 'USER_CREATED',
      entityType: 'STUDENT',
      entityId: authUser.user.id,
      metadata: { fullName, email, studentId },
    })

    return NextResponse.json({
      ok: true,
      message: 'Student account created successfully',
      data: { id: authUser.user.id, fullName, email, studentId },
    })
  } catch (err) {
    console.error('Create student error:', err)
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
      return NextResponse.json({ ok: false, message: 'Student ID is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }

    if (body.fullName) updateData.full_name = body.fullName.trim()
    if (body.studentId) updateData.student_id = body.studentId.trim()
    if (body.status) updateData.status = body.status
    if (body.departmentId !== undefined) updateData.department_id = body.departmentId || null
    if (body.phone !== undefined) updateData.phone = body.phone

    const { error } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', body.id)
      .eq('role', 'student')

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: body.status === 'inactive' ? 'USER_DEACTIVATED' : 'USER_UPDATED',
      entityType: 'STUDENT',
      entityId: body.id,
      metadata: updateData,
    })

    return NextResponse.json({ ok: true, message: 'Student updated successfully' })
  } catch (err) {
    console.error('Update student error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
