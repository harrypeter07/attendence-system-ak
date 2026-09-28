'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Plus,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface TeacherItem {
  id: string
  fullName: string
  email: string
  employeeId: string
  department: string
  departmentId: string | null
  status: string
  phone: string
  assignedCount: number
  classes: Array<{ id: string; name: string; course: { code: string; name: string } }>
  createdAt: string
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
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
  const [password, setPassword] = useState('TeacherPass123!')
  const [employeeId, setEmployeeId] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  async function loadData() {
    try {
      const [teaRes, deptRes] = await Promise.all([
        fetch('/api/admin/teachers'),
        fetch('/api/admin/departments'),
      ])
      const teaData = await teaRes.json()
      const deptData = await deptRes.json()

      if (teaData.ok) setTeachers(teaData.data || [])
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

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          employeeId,
          departmentId: departmentId || null,
        }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        setNotice(`Teacher "${fullName}" successfully invited!`)
        setShowModal(false)
        setFullName('')
        setEmail('')
        setEmployeeId('')
        await loadData()
      } else {
        setError(data.message || 'Failed to create teacher.')
      }
    } catch {
      setError('Network error creating teacher.')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(teacher: TeacherItem) {
    const newStatus = teacher.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teacher.id, status: newStatus }),
      })
      if (res.ok) {
        setNotice(`Faculty marked as ${newStatus}.`)
        await loadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(query.toLowerCase()) ||
      t.email.toLowerCase().includes(query.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(query.toLowerCase()) ||
      t.department.toLowerCase().includes(query.toLowerCase())
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
              Faculty & Instructor Directory
            </h1>
            <p className="text-sm text-slate-500">
              Manage teacher accounts, course permissions, and teaching assignments.
            </p>
          </div>

          <Button
            onClick={() => {
              setShowModal(true)
              setError('')
            }}
            className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]"
          >
            <Plus className="size-4" /> Invite New Teacher
          </Button>
        </div>

        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="size-4 text-emerald-600" /> {notice}
          </div>
        )}

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-slate-100">
            <div>
              <CardTitle className="text-base">Instructors ({teachers.length})</CardTitle>
              <CardDescription className="text-xs">Faculty accounts with QR session rights</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Search teachers..."
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
                No teachers match your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Instructor</th>
                      <th className="px-5 py-3.5">Employee ID</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Assigned Classes</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{t.fullName}</p>
                          <p className="text-xs text-slate-400">{t.email}</p>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                          {t.employeeId}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">{t.department}</td>
                        <td className="px-5 py-4 text-xs text-slate-800">
                          <span className="font-semibold">{t.assignedCount} classes</span>
                          {t.classes.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {t.classes.map((c) => (
                                <span
                                  key={c.id}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
                                >
                                  {c.course?.code}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant="outline"
                            className={
                              t.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }
                          >
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus(t)}
                            className="h-8 text-xs border-slate-200"
                          >
                            {t.status === 'active' ? (
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

        {/* Modal: Invite Teacher */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-lg border-slate-200 bg-white shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <CardTitle className="text-lg">Invite New Teacher</CardTitle>
                  <CardDescription className="text-xs">
                    Creates faculty account with authorization to start attendance sessions
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

              <form onSubmit={handleCreateTeacher}>
                <CardContent className="space-y-4 p-5">
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      <ShieldAlert className="size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Arthur Pendelton"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Faculty / Employee ID</label>
                      <Input
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g. EMP-204"
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
                      placeholder="faculty@attendly.edu"
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
                      className="mt-1"
                      minLength={6}
                      required
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Default: TeacherPass123!</p>
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
                    {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Create Teacher
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
