import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSessionToken } from '@/lib/qr/token'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(['teacher', 'admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const { id: sessionId } = await params
    const admin = createAdminClient()

    // Verify session exists and is active
    const { data: session } = await admin
      .from('attendance_sessions')
      .select('id, teacher_id, status')
      .eq('id', sessionId)
      .maybeSingle()

    if (!session) {
      return NextResponse.json({ ok: false, message: 'Session not found' }, { status: 404 })
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { ok: false, message: `Session is ${session.status}. Tokens cannot be generated.` },
        { status: 400 }
      )
    }

    if (auth.profile?.role === 'teacher' && session.teacher_id !== auth.profile?.id) {
      return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }

    // Generate new 15-second token
    const tokenData = await createSessionToken(sessionId)

    return NextResponse.json({
      ok: true,
      data: {
        sessionId,
        token: tokenData.token,
        validFrom: tokenData.validFrom,
        validUntil: tokenData.validUntil,
        intervalSeconds: tokenData.intervalSeconds,
      },
    })
  } catch (err) {
    console.error('Token generation error:', err)
    return NextResponse.json({ ok: false, message: 'Failed to generate token' }, { status: 500 })
  }
}
