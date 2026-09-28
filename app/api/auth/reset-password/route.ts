import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const validation = schema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ ok: false, message: 'Please provide a valid email.' }, { status: 400 })
    }

    const { email } = validation.data
    const supabase = await createClient()

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }

    await logAuditEvent({
      action: 'LOGIN_FAILED', // Record event
      entityType: 'AUTH',
      success: true,
      metadata: { action: 'PASSWORD_RESET_REQUESTED', email },
    })

    return NextResponse.json({ ok: true, message: 'Password reset link sent if account exists.' })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ ok: false, message: 'Internal server error.' }, { status: 500 })
  }
}
