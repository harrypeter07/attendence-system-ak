'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  QrCode,
  Search,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function TeacherSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch('/api/teacher/sessions')
        const data = await res.json()
        if (data.ok) setSessions(data.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [])

  const filtered = sessions.filter(
    (s) =>
      s.courseName.toLowerCase().includes(query.toLowerCase()) ||
      s.courseCode.toLowerCase().includes(query.toLowerCase()) ||
      s.className.toLowerCase().includes(query.toLowerCase())
  )

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
              Attendance Sessions History
            </h1>
            <p className="text-sm text-slate-500">
              Track active and completed classroom attendance sessions with live roster counts.
            </p>
          </div>

          <Link href="/teacher/attendance/new">
            <Button className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
              <QrCode className="size-4" /> Start New Session
            </Button>
          </Link>
        </div>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-slate-100">
            <div>
              <CardTitle className="text-base">All Sessions</CardTitle>
              <CardDescription className="text-xs">
                Total {sessions.length} sessions logged
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Search sessions..."
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
                No attendance sessions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Course / Class</th>
                      <th className="px-5 py-3.5">Started At</th>
                      <th className="px-5 py-3.5">Attendance</th>
                      <th className="px-5 py-3.5">Geofence Radius</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-900">{session.courseName}</span>
                          <span className="mt-0.5 block font-mono text-xs text-slate-400">
                            {session.courseCode} · {session.className} · Room {session.room || 'TBD'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-700">
                          {new Date(session.startedAt).toLocaleDateString()} at{' '}
                          {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                          {session.presentCount} / {session.totalEnrolled} Present
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <span className="inline-flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <MapPin className="size-3 text-[#6558ee]" /> ±{session.radiusMeters}m
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {session.status === 'active' ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 animate-pulse">
                              <span className="size-1.5 rounded-full bg-emerald-500" /> Active Now
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 bg-slate-50">
                              Completed
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/teacher/attendance/${session.id}`}>
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs border-slate-200">
                              {session.status === 'active' ? 'Live Room' : 'View Roster'}{' '}
                              <ExternalLink className="size-3" />
                            </Button>
                          </Link>
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
