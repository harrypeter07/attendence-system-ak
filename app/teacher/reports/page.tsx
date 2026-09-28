'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Download,
  FileBarChart,
  Filter,
  Loader2,
  Search,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TeacherReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch('/api/admin/reports')
        const json = await res.json()
        if (json.ok) setData(json.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadReports()
  }, [])

  function downloadCsv() {
    window.location.href = '/api/admin/reports?format=csv'
  }

  const records = data?.records || []
  const summary = data?.summary || { total: 0, present: 0, attendanceRate: 100 }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
            >
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Class Attendance Reports
            </h1>
            <p className="text-sm text-slate-500">
              Review attendance records and export authorized CSV reports for grading.
            </p>
          </div>

          <Button onClick={downloadCsv} className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
            <Download className="size-4" /> Export CSV Report
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Scans</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{summary.total}</p>
              <p className="mt-1 text-xs text-slate-400">Total attendances recorded</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Verified</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">{summary.present}</p>
              <p className="mt-1 text-xs text-slate-400">Geofence and token validated</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Rate</p>
              <p className="mt-2 text-3xl font-extrabold text-[#6558ee]">{summary.attendanceRate}%</p>
              <p className="mt-1 text-xs text-slate-400">Class engagement rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Records Table */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Detailed Records</CardTitle>
              <CardDescription className="text-xs">Real database attendance log</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-[#6558ee]" />
              </div>
            ) : records.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No attendance reports found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Student Name</th>
                      <th className="px-5 py-3.5">Student ID</th>
                      <th className="px-5 py-3.5">Course / Class</th>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">GPS Distance</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">{r.studentName}</td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-500">{r.studentId}</td>
                        <td className="px-5 py-4 text-xs text-slate-700">
                          {r.courseName} ({r.courseCode}) · {r.className}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-500">
                          {new Date(r.date).toLocaleDateString()} {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {r.distanceMeters !== null ? `${r.distanceMeters}m` : 'Verified'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" /> {r.status}
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
