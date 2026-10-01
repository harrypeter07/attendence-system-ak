import { NextResponse } from 'next/server'
import { getSessionProfile } from '@/lib/auth/session'

export async function GET() {
  try {
    const { user, profile } = await getSessionProfile()

    if (!user || !profile) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile.role,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        departmentId: profile.department_id,
        studentId: profile.student_id,
        employeeId: profile.employee_id,
        status: profile.status,
      },
    })
  } catch (err) {
    console.error('Session check error:', err)
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 })
  }
}
