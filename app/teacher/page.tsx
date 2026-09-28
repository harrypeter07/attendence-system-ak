'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Plus,
  QrCode,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TeacherDashboardPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [clsRes, sessRes] = await Promise.all([
          fetch('/api/teacher/classes'),
          fetch('/api/teacher/sessions'),
        ])
        const clsData = await clsRes.json()
        const sessData = await sessRes.json()

        if (clsData.ok) setClasses(clsData.data || [])
        if (sessData.ok) setSessions(sessData.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const activeSessions = sessions.filter((s) => s.status === 'active')
  const totalStudentsEnrolled = classes.reduce((acc, c) => acc + (c.enrolledCount || 0), 0)

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Banner with Quick Action */}
        <div className="relative overflow-hidden flex flex-col justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#1e2746] to-[#2c3866] p-6 text-white shadow-xl sm:flex-row sm:items-center sm:p-8">
          <img
            src="/images/teacher-hero.jpg"
            alt="Classroom Broadcast"
            className="pointer-events-none absolute right-0 top-0 h-full w-full sm:w-1/2 object-cover opacity-20 sm:opacity-30"
            style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}
          />
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">
              <ShieldCheck className="size-3.5 text-violet-300" /> Faculty Instructor Portal
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Class Attendance Control
            </h1>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              Launch dynamic QR codes with 15-second rotation and automated geofence checks.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Link href="/teacher/attendance/new">
              <Button className="h-12 gap-2 rounded-2xl bg-[#6558ee] px-6 text-sm font-bold text-white shadow-lg shadow-[#6558ee]/40 transition hover:bg-[#5549d8]">
                <QrCode className="size-5" /> Start Attendance Session
              </Button>
            </Link>
          </div>
        </div>

        {/* Active Session Alert Banner if active */}
        {activeSessions.length > 0 && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  Active Attendance Session in Progress: {activeSessions[0].courseName} ({activeSessions[0].className})
                </p>
                <p className="text-xs text-emerald-700">
                  {activeSessions[0].presentCount} students currently verified · Dynamic QR rotating
                </p>
              </div>
            </div>
            <Link href={`/teacher/attendance/${activeSessions[0].id}`}>
              <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold gap-1.5">
                Open Live Room <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Classes</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">{classes.length}</span>
                <span className="text-xs text-[#6558ee] font-semibold">Active Term</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Sections under instruction</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#6558ee]">{totalStudentsEnrolled}</span>
                <span className="text-xs text-slate-500 font-medium">Enrolled</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Across all assigned sections</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sessions Conducted</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">{sessions.length}</span>
                <span className="text-xs text-emerald-600 font-semibold">Logged</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Historical sessions recorded</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Sessions</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-600">{activeSessions.length}</span>
                <Badge variant="outline" className={activeSessions.length > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'text-slate-400'}>
                  {activeSessions.length > 0 ? 'Live Now' : 'Idle'}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-slate-500">Generating 15s rotating tokens</p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Classes and Recent Sessions */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Assigned Classes */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Assigned Classes</CardTitle>
                  <CardDescription className="text-xs">Your course sections and enrolled counts</CardDescription>
                </div>
                <Link href="/teacher/classes" className="text-xs font-semibold text-[#6558ee] hover:underline flex items-center gap-1">
                  View classes <ArrowRight className="size-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-[#6558ee]" />
                  </div>
                ) : classes.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400">No classes assigned.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {classes.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#6558ee] bg-[#6558ee]/10 px-2 py-0.5 rounded-md">
                              {c.course?.code}
                            </span>
                            <span className="font-semibold text-slate-900 text-sm">{c.course?.name}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {c.name} · Room: {c.room || 'TBD'} · {c.semester}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            {c.enrolledCount} Students
                          </span>
                          <Link href={`/teacher/attendance/new?classId=${c.id}`}>
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs border-slate-200">
                              <QrCode className="size-3.5" /> Start
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Recent Sessions</CardTitle>
                  <CardDescription className="text-xs">Past attendance outcomes</CardDescription>
                </div>
                <Link href="/teacher/sessions" className="text-xs font-semibold text-[#6558ee] hover:underline flex items-center gap-1">
                  All sessions <ArrowRight className="size-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {sessions.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400">No sessions recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {sessions.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{s.courseName}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {new Date(s.startedAt).toLocaleDateString()} · {s.className}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                            {s.status === 'active' ? 'Live Now' : `${s.presentCount}/${s.totalEnrolled}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
