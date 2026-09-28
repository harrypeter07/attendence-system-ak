'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Loader2,
  MapPin,
  QrCode,
  User,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface EnrolledCourse {
  enrollmentId: string
  classId: string
  className: string
  room: string
  semester: string
  academicYear: string
  courseCode: string
  courseName: string
  credits: number
  department: string
  teacherName: string
  totalSessions: number
  attendedSessions: number
  percentage: number
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/courses')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setCourses(res.data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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
              My Enrolled Courses
            </h1>
            <p className="text-sm text-slate-500">
              Classes you are currently registered for in the academic term.
            </p>
          </div>

          <Link href="/student/scan">
            <Button className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
              <QrCode className="size-4" /> Scan QR Code
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#6558ee]" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="mx-auto size-12 text-slate-300" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">No enrolled courses</h3>
            <p className="mt-1 text-sm text-slate-500">
              You are not currently enrolled in any classes. Please contact the registrar.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.enrollmentId} className="border-slate-200 shadow-xs hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between">
                    <span className="rounded-lg bg-[#6558ee]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#6558ee]">
                      {course.courseCode}
                    </span>
                    <Badge variant="outline" className={course.percentage >= 75 ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : 'text-amber-700 border-amber-300 bg-amber-50'}>
                      {course.percentage}% Attendance
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-base">{course.courseName}</CardTitle>
                  <CardDescription className="text-xs">
                    {course.className} · {course.credits} Credits
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-slate-400" />
                      <span>Instructor: <strong>{course.teacherName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-slate-400" />
                      <span>Room: <strong>{course.room}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-slate-400" />
                      <span>{course.semester} · {course.academicYear}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Sessions</span>
                      <span className="text-slate-800">{course.attendedSessions} of {course.totalSessions} attended</span>
                    </div>
                    <Progress value={course.percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
