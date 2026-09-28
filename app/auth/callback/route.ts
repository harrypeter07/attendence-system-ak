import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure user has profile & check role
      const admin = createAdminClient()
      const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      const role = profile?.role || data.user.user_metadata?.role || 'student'
      const redirectUrl = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student'

      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  // Return user to login with error if auth failed
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
