import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await requireAuth(['student', 'teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const { data: profile, error } = await admin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        student_id,
        employee_id,
        phone,
        avatar_url,
        status,
        created_at,
        department:departments (id, name, code)
      `)
      .eq('id', auth.profile?.id)
      .single()

    if (error) {
      return NextResponse.json({ ok: false, message: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: profile })
  } catch (err) {
    console.error('Profile fetch error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth(['student', 'teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => ({}))
    const admin = createAdminClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.fullName !== undefined) updateData.full_name = body.fullName.trim()
    if (body.phone !== undefined) updateData.phone = body.phone.trim()
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl

    const { data: updated, error } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', auth.profile?.id)
      .select(`
        id,
        full_name,
        email,
        role,
        student_id,
        employee_id,
        phone,
        avatar_url,
        status,
        department:departments (id, name, code)
      `)
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Profile updated successfully',
      data: updated,
    })
  } catch (err: any) {
    console.error('Profile PATCH error:', err)
    return NextResponse.json({ ok: false, message: err?.message || 'Server error' }, { status: 500 })
  }
}
