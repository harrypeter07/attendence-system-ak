import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  student_id: string | null
  employee_id: string | null
  department_id: string | null
  status: 'active' | 'inactive' | 'suspended'
  phone: string | null
  avatar_url: string | null
}

/**
 * Retrieves the currently authenticated user session and database profile.
 * Verifies profile and role directly against the database.
 */
export async function getSessionProfile(): Promise<{
  user: { id: string; email?: string } | null
  profile: UserProfile | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { user: null, profile: null }
    }

    // Fetch profile using admin client to ensure clean, reliable read
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return { user: { id: user.id, email: user.email }, profile: null }
    }

    return {
      user: { id: user.id, email: user.email },
      profile: profile as UserProfile,
    }
  } catch (err) {
    console.error('Error fetching session profile:', err)
    return { user: null, profile: null }
  }
}

/**
 * Strict role verification. Throws or returns null if not authenticated or not authorized.
 */
export async function requireAuth(allowedRoles?: ('admin' | 'teacher' | 'student')[]) {
  const { user, profile } = await getSessionProfile()

  if (!user || !profile) {
    return { error: 'Authentication required', status: 401, profile: null, user: null }
  }

  if (profile.status !== 'active') {
    return { error: 'Your account is inactive or suspended', status: 403, profile: null, user: null }
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return { error: 'Access forbidden: insufficient permissions', status: 403, profile: null, user: null }
  }

  return { error: null, status: 200, profile, user }
}
