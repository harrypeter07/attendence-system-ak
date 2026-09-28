import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

export async function GET() {
  try {
    const auth = await requireAuth(['admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    return NextResponse.json({
      ok: true,
      data: {
        institutionName: 'Attendly Institute of Technology',
        defaultRadiusMeters: 100,
        tokenRotationSeconds: 15,
        defaultLatitude: 12.9716,
        defaultLongitude: 77.5946,
        enforceGeofence: true,
        allowLateMarking: true,
        attendanceGraceMinutes: 15,
      },
    })
  } catch (err) {
    console.error('Settings error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(['admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const body = await request.json().catch(() => ({}))

    await logAuditEvent({
      actorId: auth.profile?.id,
      action: 'USER_UPDATED',
      entityType: 'SETTINGS',
      metadata: body,
    })

    return NextResponse.json({ ok: true, message: 'Settings saved successfully' })
  } catch (err) {
    console.error('Save settings error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
