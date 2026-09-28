'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface DashboardData {
  studentName: string
  studentId: string
  enrolledCount: number
  totalSessions: number
  attendedCount: number
  overallPercentage: number
  isAtRisk: boolean
  courseStats: Array<{
    classId: string
    className: string
    courseCode: string
    courseName: string
    room: string
    totalSessions: number
    attendedSessions: number
    percentage: number
    status: string
  }>
  recentRecords: Array<{
    id: string
    courseName: string
    courseCode: string
    date: string
    status: string
    distance: string
  }>
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setData(res.data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#6558ee]" />
        </div>
      </DashboardLayout>
    )
  }

  const overall = data?.overallPercentage ?? 100
  const isAtRisk = data?.isAtRisk ?? false

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden flex flex-col justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#1e2746] to-[#354064] p-6 text-white shadow-xl sm:flex-row sm:items-center sm:p-8">
          <img
            src="/images/scanner-mockup.jpg"
            alt="Scanner Preview"
            className="pointer-events-none absolute right-0 top-0 h-full w-full sm:w-1/2 object-cover opacity-20 sm:opacity-30"
            style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}
          />
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
              <ShieldCheck className="size-3.5" /> Student Portal Active
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {data?.studentName || 'Student'}
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Student ID: <span className="font-mono font-semibold text-white">{data?.studentId || 'N/A'}</span> · Verified Attendance Record
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Link href="/student/scan">
              <Button className="h-12 gap-2 rounded-2xl bg-[#6558ee] px-6 text-sm font-bold text-white shadow-lg shadow-[#6558ee]/40 transition hover:bg-[#5549d8]">
                <QrCode className="size-5" /> Scan Attendance Now
              </Button>
            </Link>
          </div>
        </div>

        {/* At-Risk Warning if attendance < 75% */}
        {isAtRisk && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-xs">
            <AlertTriangle className="size-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Attendance Warning: Below 75% Requirement</p>
              <p className="text-xs text-amber-700">
                Your cumulative attendance is currently {overall}%. Ensure you attend upcoming sessions to remain eligible for exams.
              </p>
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-3xl font-extrabold ${overall >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {overall}%
                </span>
                <Badge variant="outline" className={overall >= 75 ? 'text-emerald-700 border-emerald-300' : 'text-amber-700 border-amber-300'}>
                  {overall >= 75 ? 'Good Standing' : 'At Risk'}
                </Badge>
              </div>
              <Progress value={overall} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes Attended</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#6558ee]">{data?.attendedCount || 0}</span>
                <span className="text-xs text-slate-500 font-medium">of {data?.totalSessions || 0} Sessions</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Verified via Dynamic QR</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Courses</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">{data?.enrolledCount || 0}</span>
                <span className="text-xs text-slate-500 font-medium">Current Term</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Active enrollments</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Geofence Compliance</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-600">100%</span>
                <span className="text-xs text-emerald-600 font-semibold">Location Verified</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Classroom GPS validated</p>
            </CardContent>
          </Card>
        </div>

        {/* Course-wise Breakdown & Recent History */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Enrolled Courses Progress */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Course-wise Attendance</CardTitle>
                  <CardDescription className="text-xs">Your attendance record per enrolled course</CardDescription>
                </div>
                <Link href="/student/courses" className="text-xs font-semibold text-[#6558ee] hover:underline flex items-center gap-1">
                  View all <ArrowRight className="size-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.courseStats && data.courseStats.length > 0 ? (
                  data.courseStats.map((c) => (
                    <div key={c.classId} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#6558ee] shadow-2xs">
                            {c.courseCode}
                          </span>
                          <h4 className="mt-1 font-semibold text-slate-900">{c.courseName}</h4>
                          <p className="text-xs text-slate-500">
                            {c.className} · Room {c.room || 'TBD'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${c.percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {c.percentage}%
                          </span>
                          <p className="text-[11px] text-slate-500">
                            {c.attendedSessions}/{c.totalSessions} Sessions
                          </p>
                        </div>
                      </div>
                      <Progress value={c.percentage} className="mt-3 h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">No enrolled courses found.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Attendance Scans */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Recent Attendance History</CardTitle>
                  <CardDescription className="text-xs">Your latest verified classroom scans</CardDescription>
                </div>
                <Link href="/student/attendance" className="text-xs font-semibold text-[#6558ee] hover:underline flex items-center gap-1">
                  History <ArrowRight className="size-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {data?.recentRecords && data.recentRecords.length > 0 ? (
                    data.recentRecords.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{r.courseName}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {new Date(r.date).toLocaleDateString()} at {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" /> Present
                          </span>
                          <p className="mt-0.5 text-[11px] text-slate-400 font-mono">{r.distance}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-400">
                      No attendance scans recorded yet.
                    </div>
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
