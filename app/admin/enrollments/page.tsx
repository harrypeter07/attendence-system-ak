'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  School,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')

  async function loadData() {
    try {
      const [enrRes, assignRes, stuRes, teaRes, clsRes] = await Promise.all([
        fetch('/api/admin/enrollments'),
        fetch('/api/admin/teacher-assignments'),
        fetch('/api/admin/students'),
        fetch('/api/admin/teachers'),
        fetch('/api/admin/classes'),
      ])
      const [enrData, assignData, stuData, teaData, clsData] = await Promise.all([
        enrRes.json(),
        assignRes.json(),
        stuRes.json(),
        teaRes.json(),
        clsRes.json(),
      ])

      if (enrData.ok) setEnrollments(enrData.data || [])
      if (assignData.ok) setAssignments(assignData.data || [])
      if (stuData.ok) {
        setStudents(stuData.data || [])
        if (stuData.data?.length > 0) setSelectedStudentId(stuData.data[0].id)
      }
      if (teaData.ok) {
        setTeachers(teaData.data || [])
        if (teaData.data?.length > 0) setSelectedTeacherId(teaData.data[0].id)
      }
      if (clsData.ok) {
        setClasses(clsData.data || [])
        if (clsData.data?.length > 0) setSelectedClassId(clsData.data[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedStudentId) {
      setError('Please select a student to enroll.')
      return
    }
    if (!selectedClassId) {
      setError('Please select a target class section.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudentId, classId: selectedClassId }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setNotice('Student successfully enrolled in class.')
        setShowEnrollModal(false)
        await loadData()
      } else {
        setError(data.message || 'Failed to enroll student.')
      }
    } catch {
      setError('Network error enrolling student.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAssignTeacher(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedTeacherId) {
      setError('Please select an instructor.')
      return
    }
    if (!selectedClassId) {
      setError('Please select a target class section.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/teacher-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedTeacherId, classId: selectedClassId }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setNotice('Teacher successfully assigned to class.')
        setShowAssignModal(false)
        await loadData()
      } else {
        setError(data.message || 'Failed to assign teacher.')
      }
    } catch {
      setError('Network error assigning teacher.')
    } finally {
      setSubmitting(false)
    }
  }

  async function removeEnrollment(id: string) {
    if (!confirm('Remove this student from the class?')) return
    try {
      const res = await fetch(`/api/admin/enrollments?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotice('Enrollment removed.')
        await loadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function removeAssignment(id: string) {
    if (!confirm('Remove this teacher assignment?')) return
    try {
      const res = await fetch(`/api/admin/teacher-assignments?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotice('Teacher assignment removed.')
        await loadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

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
              Enrollments & Teaching Assignments
            </h1>
            <p className="text-sm text-slate-500">
              Control student rosters and assign faculty to curriculum sections with database-level uniqueness.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignModal(true)
                setError('')
              }}
              className="gap-2 border-slate-300 text-xs font-semibold"
            >
              <Users className="size-4 text-[#6558ee]" /> Assign Teacher
            </Button>
            <Button
              onClick={() => {
                setShowEnrollModal(true)
                setError('')
              }}
              className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]"
            >
              <Plus className="size-4" /> Enroll Student
            </Button>
          </div>
        </div>

        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="size-4 text-emerald-600" /> {notice}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Enrollments Table (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Student Enrollments ({enrollments.length})</CardTitle>
                  <CardDescription className="text-xs">Active class rosters</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-[#6558ee]" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <p className="p-12 text-center text-xs text-slate-400">No enrollments yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3.5">Student</th>
                          <th className="px-5 py-3.5">Course / Class</th>
                          <th className="px-5 py-3.5">Enrolled Date</th>
                          <th className="px-5 py-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {enrollments.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">{e.studentName}</p>
                              <p className="text-xs font-mono text-slate-400">{e.studentCode}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-semibold text-slate-800">{e.courseName}</span>
                              <span className="mt-0.5 block font-mono text-xs text-slate-500">
                                {e.courseCode} · {e.className}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs font-mono text-slate-500">
                              {new Date(e.enrolledAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEnrollment(e.id)}
                                className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
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

          {/* Teacher Assignments (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="p-5 border-b border-slate-100">
                <CardTitle className="text-base">Teaching Assignments</CardTitle>
                <CardDescription className="text-xs">Faculty assigned to sections</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {assignments.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400">No assignments yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {assignments.map((a) => (
                      <div key={a.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{a.teacher?.full_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {a.class?.course?.code} · {a.class?.name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAssignment(a.id)}
                          className="size-7 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal: Enroll Student */}
        {showEnrollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <CardTitle className="text-lg">Enroll Student in Class</CardTitle>
                  <CardDescription className="text-xs">Links student profile to academic section</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowEnrollModal(false)} className="size-8">
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <form onSubmit={handleEnroll}>
                <CardContent className="space-y-4 p-5">
                  {error && (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Select Student</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs"
                      required
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.studentId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Select Class Section</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs"
                      required
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.courseCode} - {c.courseName} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50 rounded-b-xl">
                  <Button type="button" variant="outline" onClick={() => setShowEnrollModal(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-[#6558ee] text-xs font-semibold text-white">
                    {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Enroll Student
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Modal: Assign Teacher */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <CardTitle className="text-lg">Assign Teacher to Class</CardTitle>
                  <CardDescription className="text-xs">Grants faculty permission to conduct attendance</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAssignModal(false)} className="size-8">
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <form onSubmit={handleAssignTeacher}>
                <CardContent className="space-y-4 p-5">
                  {error && (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Select Instructor</label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs"
                      required
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Select Class Section</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs"
                      required
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.courseCode} - {c.courseName} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50 rounded-b-xl">
                  <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-[#6558ee] text-xs font-semibold text-white">
                    {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Assign Teacher
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
