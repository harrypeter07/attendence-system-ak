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
    const { data: profile, error } = await admin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        employee_id,
        phone,
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
    console.error('Teacher profile fetch error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth(['teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => ({}))
    const admin = createAdminClient()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (body.fullName) updateData.full_name = body.fullName.trim()
    if (body.phone !== undefined) updateData.phone = body.phone.trim()

    const { error } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', auth.profile?.id)

    if (error) {
      return NextResponse.json({ ok: false, message: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Profile updated successfully' })
  } catch (err) {
    console.error('Teacher profile update error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
