'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Download,
  Filter,
  Loader2,
  Search,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  async function loadReports(classId = '') {
    setLoading(true)
    try {
      const url = classId ? `/api/admin/reports?classId=${classId}` : '/api/admin/reports'
      const res = await fetch(url)
      const resData = await res.json()
      if (resData.ok) setData(resData.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/admin/classes')
        const classRes = await res.json()
        if (classRes.ok) setClasses(classRes.data || [])
      } catch (err) {
        console.error(err)
      }
      await loadReports()
    }
    init()
  }, [])

  function handleFilterClass(classId: string) {
    setSelectedClassId(classId)
    loadReports(classId)
  }

  function downloadCsv() {
    const url = selectedClassId
      ? `/api/admin/reports?format=csv&classId=${selectedClassId}`
      : '/api/admin/reports?format=csv'
    window.location.href = url
  }

  const records = data?.records || []
  const summary = data?.summary || { total: 0, present: 0, late: 0, absent: 0, attendanceRate: 100 }

  const filtered = records.filter(
    (r: any) =>
      r.studentName.toLowerCase().includes(query.toLowerCase()) ||
      r.studentId.toLowerCase().includes(query.toLowerCase()) ||
      r.courseName.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
            >
              <ArrowLeft className="size-4" /> Back to Overview
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Institution Reports & Exports
            </h1>
            <p className="text-sm text-slate-500">
              Filter attendance trends across courses and export authorized audit reports.
            </p>
          </div>

          <Button onClick={downloadCsv} className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
            <Download className="size-4" /> Download Official CSV Report
          </Button>
        </div>

        {/* Filters & Summary */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recorded</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{summary.total}</p>
              <p className="mt-1 text-xs text-slate-400">Total attendance check-ins</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Rate</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">{summary.attendanceRate}%</p>
              <p className="mt-1 text-xs text-slate-400">{summary.present} verified scans</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter by Class</p>
              <select
                value={selectedClassId}
                onChange={(e) => handleFilterClass(e.target.value)}
                className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800"
              >
                <option value="">All Courses & Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} - {c.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance Mode</p>
              <p className="mt-2 text-xs font-semibold text-slate-800">Geofence + Rotating QR</p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">100% Server Verified</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-slate-100">
            <div>
              <CardTitle className="text-base">Scanned Attendances ({filtered.length})</CardTitle>
              <CardDescription className="text-xs">Individual verified student records</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Search student or course..."
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
                No attendance reports found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Student ID</th>
                      <th className="px-5 py-3.5">Course / Class</th>
                      <th className="px-5 py-3.5">Instructor</th>
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">GPS Distance</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">{r.studentName}</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">{r.studentId}</td>
                        <td className="px-5 py-4 text-xs text-slate-700">
                          {r.courseName} ({r.courseCode}) · {r.className}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">{r.teacherName}</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {new Date(r.date).toLocaleDateString()} {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono">
                          {r.distanceMeters !== null ? `${r.distanceMeters}m` : 'Verified'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
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
