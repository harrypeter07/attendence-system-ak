'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  Loader2,
  Plus,
  QrCode,
  School,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DashboardData {
  summary: {
    totalStudents: number
    totalTeachers: number
    totalCourses: number
    totalClasses: number
    activeSessions: number
    attendanceToday: string
    atRiskStudents: number
  }
  recentSessions: Array<{
    id: string
    course: string
    code: string
    teacher: string
    time: string
    present: number
    total: number
    status: string
  }>
  activities: Array<{
    id: string
    name: string
    initials: string
    action: string
    time: string
  }>
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard')
        const json = await res.json()
        if (json.ok && json.data) {
          setData(json.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Banner */}
        <div className="relative overflow-hidden flex flex-col justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#1e2746] to-[#2b3558] p-6 text-white shadow-xl sm:flex-row sm:items-center sm:p-8">
          <img
            src="/images/login-hero.jpg"
            alt="Campus Terminal"
            className="pointer-events-none absolute right-0 top-0 h-full w-full sm:w-1/2 object-cover opacity-15 sm:opacity-25"
            style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}
          />
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-rose-300 backdrop-blur-sm">
              <ShieldCheck className="size-3.5" /> Institution Control Center
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Campus Attendance Overview
            </h1>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Live database monitoring across departments, courses, teachers, and student scans.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 shrink-0">
            <Link href="/admin/students">
              <Button className="h-10 gap-1.5 rounded-xl bg-white text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100">
                <Plus className="size-3.5" /> Add Student
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button className="h-10 gap-1.5 rounded-xl bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
                <Download className="size-3.5" /> Reports & Export
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <GraduationCap className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">{data?.summary.totalStudents ?? 0}</p>
              <p className="mt-2 text-xs text-emerald-600 font-medium">Database enrolled profiles</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty Teachers</p>
                <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                  <Users className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">{data?.summary.totalTeachers ?? 0}</p>
              <p className="mt-2 text-xs text-violet-600 font-medium">Assigned instructors</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Today</p>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <Activity className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-emerald-600">{data?.summary.attendanceToday ?? '94%'}</p>
              <p className="mt-2 text-xs text-emerald-600 font-medium">Institution average rate</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Sessions</p>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <QrCode className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold text-slate-900">{data?.summary.activeSessions ?? 0}</p>
                <Badge variant="outline" className={data?.summary.activeSessions ? 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse' : 'text-slate-400'}>
                  {data?.summary.activeSessions ? 'Rotating Live' : 'None'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">15-sec dynamic token rotation</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions Table & Live Audit Feed */}
        <div className="grid gap-6 xl:grid-cols-12">
          {/* Recent Sessions Table */}
          <div className="xl:col-span-8 space-y-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 border-b border-slate-100">
                <div>
                  <CardTitle className="text-base">Recent Sessions & Live Roster</CardTitle>
                  <CardDescription className="text-xs">Live and completed attendance sessions across campus</CardDescription>
                </div>
                <Link href="/teacher/sessions" className="text-xs font-semibold text-[#6558ee] hover:underline flex items-center gap-1">
                  View all <ArrowRight className="size-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-[#6558ee]" />
                  </div>
                ) : data?.recentSessions.length === 0 ? (
                  <p className="p-12 text-center text-xs text-slate-400">No sessions recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3.5">Course</th>
                          <th className="px-5 py-3.5">Teacher</th>
                          <th className="px-5 py-3.5">Time</th>
                          <th className="px-5 py-3.5">Present / Enrolled</th>
                          <th className="px-5 py-3.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data?.recentSessions.map((session) => (
                          <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-semibold text-slate-900">{session.course}</span>
                              <span className="mt-0.5 block font-mono text-xs text-slate-400">{session.code}</span>
                            </td>
                            <td className="px-5 py-4 text-xs font-medium text-slate-600">{session.teacher}</td>
                            <td className="px-5 py-4 text-xs font-mono text-slate-500">{session.time}</td>
                            <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                              {session.present} / {session.total}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${session.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                                {session.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Real Audit Activities */}
          <div className="xl:col-span-4 space-y-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 border-b border-slate-100">
                <div>
                  <CardTitle className="text-base">System Audit Activity</CardTitle>
                  <CardDescription className="text-xs">Security and administrative actions</CardDescription>
                </div>
                <Link href="/admin/audit-logs" className="text-xs font-semibold text-[#6558ee] hover:underline flex items-center gap-1">
                  All logs <ArrowRight className="size-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {data?.activities && data.activities.length > 0 ? (
                    data.activities.map((act) => (
                      <div key={act.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700 text-xs shrink-0">
                          {act.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-900">{act.name}</p>
                          <p className="truncate text-[11px] text-slate-500 capitalize">{act.action}</p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">{act.time}</span>
                      </div>
                    ))
                  ) : (
                    <p className="p-8 text-center text-xs text-slate-400">No recent activity recorded.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
