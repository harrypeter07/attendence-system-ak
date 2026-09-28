'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Loader2,
  MapPin,
  QrCode,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/classes')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setClasses(data.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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
              My Assigned Classes
            </h1>
            <p className="text-sm text-slate-500">
              Classes and sections assigned to you for instruction and attendance tracking.
            </p>
          </div>

          <Link href="/teacher/attendance/new">
            <Button className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
              <QrCode className="size-4" /> Start Dynamic Attendance
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#6558ee]" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="mx-auto size-12 text-slate-300" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">No classes assigned</h3>
            <p className="mt-1 text-sm text-slate-500">
              You are not currently assigned to any active courses. Contact an administrator.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <Card key={cls.id} className="border-slate-200 shadow-xs bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between">
                    <span className="rounded-lg bg-[#6558ee]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#6558ee]">
                      {cls.course?.code}
                    </span>
                    <Badge variant="outline" className="text-xs bg-slate-50">
                      {cls.enrolledCount} Enrolled
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-base">{cls.course?.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {cls.name} · {cls.course?.department?.name || 'Department'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-slate-400" />
                      <span>Room: <strong>{cls.room || 'TBD'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-slate-400" />
                      <span>{cls.semester} · {cls.academicYear}</span>
                    </div>
                    {cls.location && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        GPS Geofence: ±{cls.location.radius_meters}m radius
                      </div>
                    )}
                  </div>

                  <Link href={`/teacher/attendance/new?classId=${cls.id}`} className="block">
                    <Button className="w-full gap-2 bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]">
                      <QrCode className="size-3.5" /> Start Attendance Session
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
