'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MapPin,
  QrCode,
  Search,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface AttendanceRecord {
  id: string
  courseCode: string
  courseName: string
  className: string
  room: string
  teacherName: string
  status: string
  markedAt: string
  distanceMeters: number | null
  source: string
}

function AttendanceHistoryContent() {
  const searchParams = useSearchParams()
  const initialCourse = searchParams.get('course') || searchParams.get('class') || ''

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(initialCourse)

  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await fetch('/api/student/attendance')
        const json = await res.json()
        if (json.ok && json.data) {
          setRecords(json.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAttendance()
  }, [])

  const filtered = records.filter(
    (r) =>
      r.courseName.toLowerCase().includes(query.toLowerCase()) ||
      r.courseCode.toLowerCase().includes(query.toLowerCase()) ||
      r.className.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/student"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
            >
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Attendance History
            </h1>
            <p className="text-sm text-slate-500">
              Verified record of your attendance across all academic courses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/student/courses">
              <Button variant="outline" className="text-xs font-semibold border-slate-300">
                View All Courses
              </Button>
            </Link>
            <Link href="/student/scan">
              <Button className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
                <QrCode className="size-4" /> Scan QR Now
              </Button>
            </Link>
          </div>
        </div>

        {query && (
          <div className="flex items-center gap-2 text-xs bg-[#6558ee]/10 text-[#6558ee] px-3.5 py-2 rounded-xl border border-[#6558ee]/20 font-medium">
            <span>Showing attendance for: <strong>{query}</strong></span>
            <button
              onClick={() => setQuery('')}
              className="ml-auto inline-flex items-center gap-1 hover:text-slate-900 text-slate-500"
            >
              <X className="size-3.5" /> Clear Filter
            </button>
          </div>
        )}

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-slate-100">
            <div>
              <CardTitle className="text-base">Verified Records</CardTitle>
              <CardDescription className="text-xs">
                Total {filtered.length} attendances recorded {query ? `for ${query}` : ''}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Search courses or class..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-[#6558ee]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No attendance records match your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Course / Class</th>
                      <th className="px-5 py-3.5">Instructor</th>
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">Location Verified</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-900">{record.courseName}</span>
                          <span className="mt-0.5 block font-mono text-xs text-slate-400">
                            {record.courseCode} · {record.className} · {record.room}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                          {record.teacherName}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-700">
                          {new Date(record.markedAt).toLocaleDateString()} at{' '}
                          {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {record.distanceMeters !== null ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <MapPin className="size-3" /> ±{record.distanceMeters}m
                            </span>
                          ) : (
                            <span className="text-slate-400">Classroom GPS</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" /> Present
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
    </DashboardLayout>
  )
}

export default function StudentAttendanceHistoryPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout role="student">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#6558ee]" />
          </div>
        </DashboardLayout>
      }
    >
      <AttendanceHistoryContent />
    </Suspense>
  )
}
