import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await logAuditEvent({
        actorId: user.id,
        action: 'LOGOUT',
        entityType: 'AUTH',
        entityId: user.id,
        success: true,
      })
    }

    await supabase.auth.signOut()

    const response = NextResponse.json({ ok: true, message: 'Logged out successfully' })
    // Ensure any residual cookies are cleared
    response.cookies.delete('attendly-session')

    return response
  } catch (err) {
    console.error('Logout error:', err)
    return NextResponse.json({ ok: false, message: 'Failed to log out' }, { status: 500 })
  }
}
