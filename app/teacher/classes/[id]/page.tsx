'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  QrCode,
  Search,
  Share2,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react'
import QRCode from 'qrcode'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default function TeacherClassDetailPage() {
  const params = useParams()
  const classId = params.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'at-risk' | 'good'>('all')

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [copied, setCopied] = useState(false)

  async function loadClassData() {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}`)
      const json = await res.json()
      if (json.ok && json.data) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to load class details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (classId) loadClassData()
  }, [classId])

  async function openEnrollmentQr() {
    if (!data?.class) return
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://attendion.vercel.app'
    const joinUrl = `${origin}/student/courses?join=${data.class.id}`
    const qrPayload = JSON.stringify({
      type: 'enrollment',
      classId: data.class.id,
      courseCode: data.class.course?.code,
      courseName: data.class.course?.name,
      joinUrl,
    })

    try {
      const url = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
      setQrUrl(url)
      setShowQrModal(true)
    } catch (err) {
      console.error(err)
    }
  }

  function copyJoinLink() {
    if (!data?.class) return
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://attendion.vercel.app'
    const joinUrl = `${origin}/student/courses?join=${data.class.id}`
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <DashboardLayout role="teacher">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#6558ee]" />
        </div>
      </DashboardLayout>
    )
  }

  if (!data?.class) {
    return (
      <DashboardLayout role="teacher">
        <div className="space-y-4 text-center py-16">
          <h2 className="text-xl font-bold text-slate-800">Class Not Found</h2>
          <p className="text-sm text-slate-500">The requested class section does not exist or you do not have permission.</p>
          <Link href="/teacher/classes">
            <Button className="bg-[#6558ee] text-white">Back to My Classes</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const { class: cls, stats, students } = data

  const filteredStudents = (students || []).filter((s: any) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.fullStudentId.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterMode === 'at-risk') return matchesSearch && s.isAtRisk
    if (filterMode === 'good') return matchesSearch && !s.isAtRisk
    return matchesSearch
  })

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/teacher/classes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#6558ee] transition"
          >
            <ArrowLeft className="size-4" /> Back to My Classes
          </Link>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#6558ee]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#6558ee]">
                  {cls.course?.code}
                </span>
                <span className="text-xs text-slate-400 font-medium">·</span>
                <span className="text-xs font-semibold text-slate-600">{cls.name}</span>
                <span className="text-xs text-slate-400 font-medium">·</span>
                <span className="text-xs text-slate-500">{cls.semester}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {cls.course?.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Room {cls.room || 'TBD'} · Department of {cls.course?.department?.name || 'Academic Studies'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                onClick={openEnrollmentQr}
                className="gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Share2 className="size-3.5 text-[#6558ee]" /> Enrollment QR
              </Button>
              <Link href={`/teacher/attendance/new?classId=${cls.id}`}>
                <Button className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
                  <QrCode className="size-4" /> Start Dynamic Attendance
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">{stats.totalEnrolled}</span>
                <Badge variant="outline" className="text-xs bg-slate-50">
                  Active Roster
                </Badge>
              </div>
              <p className="mt-3 text-xs text-slate-400">Students registered in this class</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Attendance Rate</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-3xl font-extrabold ${stats.classAverageRate >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {stats.classAverageRate}%
                </span>
                <Badge variant="outline" className={stats.classAverageRate >= 75 ? 'text-emerald-700 border-emerald-300' : 'text-amber-700 border-amber-300'}>
                  {stats.classAverageRate >= 75 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
              <Progress value={stats.classAverageRate} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sessions Held</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#6558ee]">{stats.totalSessions}</span>
                <span className="text-xs text-slate-400 font-medium">Lectures</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">Verified dynamic QR sessions</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students At Risk</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-3xl font-extrabold ${stats.atRiskCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {stats.atRiskCount}
                </span>
                <Badge variant="outline" className={stats.atRiskCount > 0 ? 'text-rose-700 border-rose-300 bg-rose-50' : 'text-slate-600'}>
                  &lt; 75% Cutoff
                </Badge>
              </div>
              <p className="mt-3 text-xs text-slate-400">Below attendance requirements</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Roster Table & Breakdown */}
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          <CardHeader className="border-b border-slate-100 p-5 pb-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Enrolled Students & Attendance Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time record of all students registered in this section
                </CardDescription>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
                  <Input
                    placeholder="Search by name, ID or email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-8 text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${
                      filterMode === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({students?.length || 0})
                  </button>
                  <button
                    onClick={() => setFilterMode('at-risk')}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${
                      filterMode === 'at-risk' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    At Risk ({stats.atRiskCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('good')}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${
                      filterMode === 'good' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    &ge; 75%
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto size-10 text-slate-300" />
                <h4 className="mt-3 text-sm font-semibold text-slate-800">
                  {students.length === 0 ? 'No students enrolled yet' : 'No matching students found'}
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  {students.length === 0
                    ? 'Students will appear here as soon as they scan your enrollment QR code or attend their first lecture.'
                    : 'Try clearing your search filters to view the full student roster.'}
                </p>
                {students.length === 0 && (
                  <Button
                    onClick={openEnrollmentQr}
                    className="mt-4 gap-1.5 bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
                  >
                    <Share2 className="size-3.5" /> Show Enrollment QR
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-5">Student</th>
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Enrolled On</th>
                      <th className="py-3 px-4">Attendance Rate</th>
                      <th className="py-3 px-4">Sessions Attended</th>
                      <th className="py-3 px-4">Last Attended</th>
                      <th className="py-3 px-5 text-right">Standing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStudents.map((s: any) => (
                      <tr key={s.enrollmentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-full bg-[#6558ee]/10 text-xs font-bold text-[#6558ee]">
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{s.name}</p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Mail className="size-3 text-slate-400" /> {s.email || 'No email registered'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                          {s.fullStudentId}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : 'Active Term'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between font-bold text-xs">
                              <span className={s.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}>
                                {s.percentage}%
                              </span>
                            </div>
                            <Progress
                              value={s.percentage}
                              className={`h-1.5 ${s.percentage < 75 ? '[&>div]:bg-rose-500' : ''}`}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {s.attendedSessions} of {s.totalSessions}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500">
                          {s.lastAttendedAt ? (
                            <span className="flex items-center gap-1 text-slate-700">
                              <Clock className="size-3 text-slate-400" />
                              {new Date(s.lastAttendedAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Never attended</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {s.isAtRisk ? (
                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 text-[11px] gap-1">
                              <AlertTriangle className="size-3" /> At Risk (&lt;75%)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] gap-1">
                              <CheckCircle2 className="size-3" /> In Good Standing
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Class Enrollment QR */}
        {showQrModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowQrModal(false)
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#6558ee]/10 text-[#6558ee]">
                    <QrCode className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Enrollment QR Code</h3>
                    <p className="text-xs text-slate-500">
                      {cls.course?.code} · {cls.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <ArrowLeft className="size-4" />
                </button>
              </div>

              <div className="my-5 flex flex-col items-center justify-center">
                <div className="rounded-2xl border-2 border-slate-900/10 bg-white p-4 shadow-md">
                  {qrUrl ? (
                    <img src={qrUrl} alt="Class Enrollment QR" className="size-64 object-contain" />
                  ) : (
                    <div className="flex size-64 items-center justify-center">
                      <Loader2 className="size-8 animate-spin text-[#6558ee]" />
                    </div>
                  )}
                </div>
                <p className="mt-3 text-center text-xs font-medium text-slate-600">
                  Scan to register into {cls.course?.name}
                </p>
                <p className="mt-0.5 text-center text-[11px] text-slate-400">
                  Course Code: <span className="font-mono font-bold text-slate-700">{cls.course?.code}</span>
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={copyJoinLink}
                  className="flex-1 text-xs border-slate-300"
                >
                  {copied ? 'Copied!' : 'Copy Direct Link'}
                </Button>
                <Button
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
