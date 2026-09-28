import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbConnected = false
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    dbConnected = !error && count !== null
  } catch {
    dbConnected = false
  }

  return NextResponse.json({
    ok: true,
    service: 'attendly-api',
    status: dbConnected ? 'healthy' : 'degraded',
    database: { connected: dbConnected },
    timestamp: new Date().toISOString(),
  })
}
