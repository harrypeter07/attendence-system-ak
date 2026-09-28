'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  School,
  Settings2,
  ShieldCheck,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  label: string
  href: string
  icon: any
  badge?: string
}

const adminNav: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Teachers', href: '/admin/teachers', icon: Users },
  { label: 'Courses & Classes', href: '/admin/courses', icon: BookOpen },
  { label: 'Enrollments', href: '/admin/enrollments', icon: School },
  { label: 'Reports & Analytics', href: '/admin/reports', icon: Activity },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
  { label: 'Settings', href: '/admin/settings', icon: Settings2 },
]

const teacherNav: NavItem[] = [
  { label: 'Overview', href: '/teacher', icon: LayoutDashboard },
  { label: 'My Classes', href: '/teacher/classes', icon: BookOpen },
  { label: 'Start Attendance', href: '/teacher/attendance/new', icon: QrCode, badge: 'Live QR' },
  { label: 'Session History', href: '/teacher/sessions', icon: CalendarCheck },
  { label: 'Class Reports', href: '/teacher/reports', icon: Activity },
  { label: 'My Profile', href: '/teacher/profile', icon: User },
]

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { label: 'Scan QR Attendance', href: '/student/scan', icon: QrCode, badge: 'Scan' },
  { label: 'My Enrolled Courses', href: '/student/courses', icon: BookOpen },
  { label: 'Attendance History', href: '/student/attendance', icon: CalendarCheck },
  { label: 'Student Profile', href: '/student/profile', icon: User },
]

export function DashboardLayout({
  children,
  role = 'admin',
}: {
  children: React.ReactNode
  role?: 'admin' | 'teacher' | 'student'
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{
    email: string
    fullName: string
    role: string
    studentId?: string
    employeeId?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        if (data.authenticated && data.user) {
          setUser(data.user)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSession()
  }, [])

  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      router.push('/login')
    }
  }

  const roleLabel = role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Faculty Instructor' : 'Student'
  const roleBadgeColor =
    role === 'admin'
      ? 'bg-rose-500/20 text-rose-200 border-rose-500/30'
      : role === 'teacher'
      ? 'bg-violet-500/20 text-violet-200 border-violet-500/30'
      : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'

  return (
    <div className="flex min-h-screen bg-[#f3f7f9] text-[#24345f]">
      {/* Sidebar Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1e2746] text-slate-200 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link href={`/${role}`} className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#6558ee] text-white shadow-md shadow-[#6558ee]/30">
              <Zap className="size-5 fill-current" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">Attendly</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Smart Attendance</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* User Badge Info */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="truncate text-xs font-semibold text-white">
              {user?.fullName || (role === 'admin' ? 'Arthur Vance' : role === 'teacher' ? 'Sarah Wilson' : 'Ava Martinez')}
            </p>
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${roleBadgeColor}`}>
              {role}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">{user?.email || `${role}@attendly.edu`}</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#6558ee] text-white shadow-md shadow-[#6558ee]/25'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge className="bg-emerald-500/20 text-[10px] font-semibold text-emerald-300 border-emerald-500/30">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* System Status / Logout */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              <p className="text-[11px] font-medium text-emerald-400">Connected to Supabase</p>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">15s dynamic QR rotation active</p>
          </div>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="border-slate-200 text-slate-600 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </Button>
            <div>
              <p className="text-xs font-medium text-slate-500">{roleLabel} Workspace</p>
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">Attendly Smart Portal</h1>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {role === 'teacher' && (
              <Link href="/teacher/attendance/new">
                <Button className="hidden h-9 gap-1.5 rounded-xl bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8] sm:inline-flex">
                  <QrCode className="size-3.5" /> Start Attendance
                </Button>
              </Link>
            )}
            {role === 'student' && (
              <Link href="/student/scan">
                <Button className="h-9 gap-1.5 rounded-xl bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
                  <QrCode className="size-3.5" /> Scan QR Now
                </Button>
              </Link>
            )}

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#6558ee]/10 font-bold text-[#6558ee]">
                {(user?.fullName || role)[0].toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden text-xs text-slate-500 hover:text-rose-600 sm:inline-flex"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  )
}
