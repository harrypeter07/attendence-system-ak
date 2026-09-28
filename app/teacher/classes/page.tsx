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
  Plus,
  QrCode,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Form state
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [className, setClassName] = useState('Section A')
  const [room, setRoom] = useState('')
  const [semester, setSemester] = useState('Spring 2026')

  async function loadClasses() {
    try {
      const res = await fetch('/api/teacher/classes')
      const data = await res.json()
      if (data.ok) setClasses(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')

    if (!courseName.trim() || courseName.trim().length < 2) {
      setError('Please provide a course name (minimum 2 characters).')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: courseName.trim(),
          courseCode: courseCode.trim(),
          className: className.trim() || 'Section A',
          room: room.trim() || 'Room 101',
          semester: semester.trim() || 'Spring 2026',
        }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        setNotice(`Class "${courseName.trim()} (${className.trim() || 'Section A'})" created!`)
        setIsModalOpen(false)
        setCourseName('')
        setCourseCode('')
        setClassName('Section A')
        setRoom('')
        await loadClasses()
      } else {
        setError(data.message || 'Failed to create class.')
      }
    } catch {
      setError('Network error occurred while creating class.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
            >
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Classes & Courses
            </h1>
            <p className="text-sm text-slate-500">
              Create and manage your courses. Students automatically enroll on their first QR scan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => {
                setIsModalOpen(true)
                setError('')
              }}
              variant="outline"
              className="gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="size-3.5" /> Create New Class
            </Button>
            <Link href="/teacher/attendance/new">
              <Button className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
                <QrCode className="size-4" /> Start Dynamic Attendance
              </Button>
            </Link>
          </div>
        </div>

        {/* Notice alert */}
        {notice && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice('')} className="text-emerald-600 hover:text-emerald-800">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Informative Auto-Enroll Banner */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Instant Student Auto-Enrollment Active</p>
            <p className="text-xs text-slate-500">
              You do not need to manually enter student rosters. When you launch an attendance session, students are automatically enrolled in your class upon scanning your classroom QR code.
            </p>
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#6558ee]" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="p-12 text-center bg-white border-slate-200 shadow-xs">
            <BookOpen className="mx-auto size-12 text-slate-300" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">No classes created yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Create your first course section to start broadcasting 15-second dynamic QR attendance for your students.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]"
            >
              <Plus className="size-3.5" /> Create Your First Class
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <Card key={cls.id} className="border-slate-200 shadow-xs bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between">
                    <span className="rounded-md bg-[#6558ee]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#6558ee]">
                      {cls.course?.code}
                    </span>
                    <Badge variant="outline" className="text-xs bg-slate-50">
                      {cls.enrolledCount} Enrolled
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-base font-bold text-slate-900">{cls.course?.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {cls.name} · {cls.course?.department?.name || 'Academic Course'}
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

        {/* Modal: Create New Class */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Class</h3>
                  <p className="text-xs text-slate-500">Set up a course section for attendance tracking</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-5" />
                </button>
              </div>

              {error && (
                <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-700 border border-rose-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateClass} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Course Name *</label>
                  <Input
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Course Code (Optional)</label>
                    <Input
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="e.g. CS-201"
                      className="mt-1 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Section / Class Name</label>
                    <Input
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="e.g. Section A"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Room / Venue</label>
                    <Input
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="e.g. Room 302"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Academic Semester</label>
                    <Input
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="e.g. Spring 2026"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-100">
                  <span className="font-semibold text-slate-700">Zero Administrative Overhead:</span> Students will be automatically enrolled into this course when they scan the daily attendance QR code.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Creating…
                      </>
                    ) : (
                      'Create Class'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

