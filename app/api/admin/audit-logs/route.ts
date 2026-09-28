import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(['admin'])
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const action = searchParams.get('action')

    const admin = createAdminClient()
    let query = admin
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        success,
        metadata,
        created_at,
        actor:profiles (
          id,
          full_name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (action) {
      query = query.eq('action', action)
    }

    const { data: logs, error } = await query

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    const formatted = (logs || []).map((l: any) => ({
      id: l.id,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      success: l.success,
      metadata: l.metadata,
      createdAt: l.created_at,
      actorName: l.actor?.full_name || 'System / Anonymous',
      actorEmail: l.actor?.email || '',
      actorRole: l.actor?.role || 'system',
    }))

    return NextResponse.json({ ok: true, data: formatted })
  } catch (err) {
    console.error('Audit logs error:', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
