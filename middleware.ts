import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public paths that do not require authentication
  const isAuthPage = pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password'
  const isApiAuth = pathname.startsWith('/api/auth')
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.includes('.')

  if (isStatic || isApiAuth) {
    return supabaseResponse
  }

  // If user is not authenticated and trying to access protected paths
  if (!user) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/teacher') || pathname.startsWith('/student') || pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // User is authenticated
  if (isAuthPage || pathname === '/') {
    // Determine user role to route them to their workspace
    // We check user_metadata or query profiles
    const role = user.user_metadata?.role || 'student'
    const targetUrl = request.nextUrl.clone()
    if (role === 'admin') targetUrl.pathname = '/admin'
    else if (role === 'teacher') targetUrl.pathname = '/teacher'
    else targetUrl.pathname = '/student'
    return NextResponse.redirect(targetUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
