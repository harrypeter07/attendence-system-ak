'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface StudentItem {
  id: string
  fullName: string
  email: string
  studentId: string
  department: string
  departmentCode: string
  departmentId: string | null
  status: string
  phone: string
  presentSessions: number
  createdAt: string
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  async function loadData() {
    try {
      const [stuRes, deptRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/departments'),
      ])
      const stuData = await stuRes.json()
      const deptData = await deptRes.json()

      if (stuData.ok) setStudents(stuData.data || [])
      if (deptData.ok) {
        setDepartments(deptData.data || [])
        if (deptData.data?.length > 0) setDepartmentId(deptData.data[0].id)
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

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')

    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()
    const trimmedStudentId = studentId.trim()

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter student full name (at least 2 characters).')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid student email address.')
      return
    }
    if (!trimmedStudentId) {
      setError('Please enter a valid Student ID / Roll Number.')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          password,
          studentId: trimmedStudentId,
          departmentId: departmentId || null,
        }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        setNotice(`Student "${fullName}" successfully created!`)
        setShowModal(false)
        setFullName('')
        setEmail('')
        setStudentId('')
        await loadData()
      } else {
        setError(data.message || 'Failed to create student.')
      }
    } catch {
      setError('Network error creating student.')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(student: StudentItem) {
    const newStatus = student.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: student.id, status: newStatus }),
      })
      if (res.ok) {
        setNotice(`Student marked as ${newStatus}.`)
        await loadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      s.studentId.toLowerCase().includes(query.toLowerCase()) ||
      s.department.toLowerCase().includes(query.toLowerCase())
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
              Student Directory & Accounts
            </h1>
            <p className="text-sm text-slate-500">
              Manage student enrollment identities, authentication profiles, and access status.
            </p>
          </div>

          <Button
            onClick={() => {
              setShowModal(true)
              setError('')
            }}
            className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]"
          >
            <Plus className="size-4" /> Add New Student
          </Button>
        </div>

        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="size-4 text-emerald-600" /> {notice}
          </div>
        )}

        {/* Directory Card */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-slate-100">
            <div>
              <CardTitle className="text-base">Registered Students ({students.length})</CardTitle>
              <CardDescription className="text-xs">Database-backed student roster</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Search students..."
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
                No students match your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Student ID</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Attendance Scans</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{s.fullName}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                          {s.studentId}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          {s.department}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                          {s.presentSessions} sessions
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant="outline"
                            className={
                              s.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }
                          >
                            {s.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus(s)}
                            className="h-8 text-xs border-slate-200"
                          >
                            {s.status === 'active' ? (
                              <>
                                <UserX className="size-3 text-rose-500 mr-1" /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="size-3 text-emerald-500 mr-1" /> Activate
                              </>
                            )}
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

        {/* Modal: Create Student */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-lg border-slate-200 bg-white shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <CardTitle className="text-lg">Add New Student</CardTitle>
                  <CardDescription className="text-xs">
                    Create a verified institutional account and student profile
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowModal(false)}
                  className="size-8 text-slate-400 hover:text-slate-700"
                >
                  <X className="size-4" />
                </Button>
              </CardHeader>

              <form onSubmit={handleCreateStudent}>
                <CardContent className="space-y-4 p-5">
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      <ShieldAlert className="size-4 shrink-0 text-rose-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Student full name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Student Roll / ID</label>
                      <Input
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Student ID or Roll Number"
                        className="mt-1 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Department</label>
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs shadow-2xs"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Institutional Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@institution.edu"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Initial Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Initial password (min. 6 characters)"
                      className="mt-1"
                      minLength={6}
                      required
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Must be at least 6 characters</p>
                  </div>
                </CardContent>

                <div className="flex justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50 rounded-b-xl">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="text-xs border-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Create Student
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
