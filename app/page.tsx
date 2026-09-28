import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { user, profile } = await getSessionProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  if (profile.role === 'admin') {
    redirect('/admin')
  } else if (profile.role === 'teacher') {
    redirect('/teacher')
  } else {
    redirect('/student')
  }
}
