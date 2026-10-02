'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Loader2,
  MapPin,
  Plus,
  QrCode,
  User,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

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

function StudentCoursesContent() {
  const searchParams = useSearchParams()
  const joinClassId = searchParams.get('join')

  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollMessage, setEnrollMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Enroll Modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [classCodeInput, setClassCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [modalError, setModalError] = useState('')

  async function loadCourses() {
    try {
      const res = await fetch('/api/student/courses')
      const json = await res.json()
      if (json.ok && json.data) {
        setCourses(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function handleAutoJoin() {
      if (joinClassId) {
        try {
          const res = await fetch('/api/student/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId: joinClassId }),
          })
          const data = await res.json()
          if (res.ok && data.ok) {
            setEnrollMessage({ type: 'success', text: data.message || 'Successfully joined class!' })
          } else {
            setEnrollMessage({ type: 'error', text: data.message || 'Could not join class.' })
          }
        } catch {
          setEnrollMessage({ type: 'error', text: 'Network error joining class.' })
        }
      }
      await loadCourses()
    }

    handleAutoJoin()
  }, [joinClassId])

  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault()
    const code = classCodeInput.trim()
    if (!code) {
      setModalError('Please enter a course or class code.')
      return
    }

    setJoining(true)
    setModalError('')
    try {
      const res = await fetch('/api/student/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setIsEnrollModalOpen(false)
        setClassCodeInput('')
        setEnrollMessage({ type: 'success', text: data.message || 'Successfully enrolled in class!' })
        await loadCourses()
      } else {
        setModalError(data.message || 'Could not find class. Please check the code.')
      }
    } catch {
      setModalError('Network error while joining class.')
    } finally {
      setJoining(false)
    }
  }

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

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => {
                setModalError('')
                setClassCodeInput('')
                setIsEnrollModalOpen(true)
              }}
              className="gap-1.5 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]"
            >
              <Plus className="size-4" /> Enroll in Class
            </Button>
            <Link href="/student/scan">
              <Button variant="outline" className="gap-2 border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <QrCode className="size-4 text-[#6558ee]" /> Scan QR Code
              </Button>
            </Link>
          </div>
        </div>

        {/* Enrollment Notification Banner */}
        {enrollMessage && (
          <div
            className={`flex items-center justify-between rounded-xl border p-4 text-xs font-medium animate-in fade-in duration-200 ${
              enrollMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {enrollMessage.type === 'success' ? (
                <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="size-4.5 text-rose-600 shrink-0" />
              )}
              <span>{enrollMessage.text}</span>
            </div>
            <button
              onClick={() => setEnrollMessage(null)}
              className="rounded-md p-1 hover:bg-black/5"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#6558ee]" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="p-12 text-center bg-white border-slate-200">
            <BookOpen className="mx-auto size-12 text-slate-300" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">No enrolled courses yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              You haven&apos;t joined any classes yet. Simply scan your instructor&apos;s classroom QR code to automatically join the class roster and mark your attendance.
            </p>
            <div className="mt-4">
              <Link href="/student/scan">
                <Button className="bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]">
                  <QrCode className="size-3.5 mr-1.5" /> Scan Attendance QR
                </Button>
              </Link>
            </div>
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
        {/* Modal: Enroll in Class */}
        {isEnrollModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsEnrollModalOpen(false)
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#6558ee]/10 text-[#6558ee]">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Enroll in Course</h3>
                    <p className="text-xs text-slate-500">Join a class via code or camera scan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="size-5" />
                </button>
              </div>

              {modalError && (
                <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="mt-5 space-y-4">
                {/* Option 1: Enter Class / Course Code */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <KeyRound className="size-4 text-[#6558ee]" />
                    <span>Option 1: Enter Class Code</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Provided by your instructor (e.g. CS-401 or Class ID).
                  </p>
                  <form onSubmit={handleJoinByCode} className="mt-3 space-y-2.5">
                    <Input
                      value={classCodeInput}
                      onChange={(e) => setClassCodeInput(e.target.value)}
                      placeholder="e.g. CS-401"
                      className="bg-white font-mono uppercase text-xs"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={joining}
                      className="w-full bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
                    >
                      {joining ? (
                        <>
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Enrolling…
                        </>
                      ) : (
                        'Join Class by Code'
                      )}
                    </Button>
                  </form>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center text-xs uppercase text-slate-400">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative bg-white px-2 text-[11px] font-medium text-slate-400">OR</span>
                </div>

                {/* Option 2: Scan QR Code */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <QrCode className="size-4 text-[#6558ee]" />
                    <span>Option 2: Scan QR Code</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Scan the enrollment QR or dynamic session QR shown on your instructor&apos;s screen.
                  </p>
                  <Link href="/student/scan" className="mt-3 block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 border-[#6558ee]/40 bg-white text-xs font-semibold text-[#6558ee] hover:bg-[#6558ee]/5"
                    >
                      <QrCode className="size-3.5" /> Open Camera to Scan QR
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function StudentCoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#6558ee]" />
        </div>
      }
    >
      <StudentCoursesContent />
    </Suspense>
  )
}
