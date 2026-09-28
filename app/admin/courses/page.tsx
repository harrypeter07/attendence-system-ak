'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Course form
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [credits, setCredits] = useState(3)
  const [departmentId, setDepartmentId] = useState('')

  // Department form
  const [deptName, setDeptName] = useState('')
  const [deptCode, setDeptCode] = useState('')

  async function loadData() {
    try {
      const [crsRes, deptRes] = await Promise.all([
        fetch('/api/admin/courses'),
        fetch('/api/admin/departments'),
      ])
      const crsData = await crsRes.json()
      const deptData = await deptRes.json()

      if (crsData.ok) setCourses(crsData.data || [])
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

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId, code, name, credits: Number(credits) }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setNotice(`Course ${code} created.`)
        setShowCourseModal(false)
        setCode('')
        setName('')
        await loadData()
      } else {
        setError(data.message || 'Failed to create course.')
      }
    } catch {
      setError('Network error creating course.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateDept(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deptName, code: deptCode }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setNotice(`Department ${deptName} created.`)
        setShowDeptModal(false)
        setDeptName('')
        setDeptCode('')
        await loadData()
      } else {
        setError(data.message || 'Failed to create department.')
      }
    } catch {
      setError('Network error creating department.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.department.toLowerCase().includes(query.toLowerCase())
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
              Curriculum: Courses & Departments
            </h1>
            <p className="text-sm text-slate-500">
              Manage academic programs, course codes, departments, and credit allocations.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeptModal(true)
                setError('')
              }}
              className="gap-2 border-slate-300 text-xs font-semibold"
            >
              <Building2 className="size-4" /> Add Department
            </Button>
            <Button
              onClick={() => {
                setShowCourseModal(true)
                setError('')
              }}
              className="gap-2 bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]"
            >
              <Plus className="size-4" /> Create Course
            </Button>
          </div>
        </div>

        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="size-4 text-emerald-600" /> {notice}
          </div>
        )}

        {/* Departments Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Departments:</span>
          {departments.map((d) => (
            <Badge key={d.id} variant="outline" className="bg-white px-3 py-1 text-xs font-medium text-slate-700">
              {d.name} ({d.code})
            </Badge>
          ))}
        </div>

        {/* Courses Table Card */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-slate-100">
            <div>
              <CardTitle className="text-base">Courses Directory ({courses.length})</CardTitle>
              <CardDescription className="text-xs">Database-backed curriculum inventory</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Search courses..."
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
                No courses match your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Code</th>
                      <th className="px-5 py-3.5">Course Name</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Credits</th>
                      <th className="px-5 py-3.5 text-right">Sections</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-xs text-[#6558ee]">
                          {c.code}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{c.name}</td>
                        <td className="px-5 py-4 text-xs text-slate-600">{c.department}</td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-700">{c.credits} Credits</td>
                        <td className="px-5 py-4 text-right">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {c.classesCount} Sections
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

        {/* Modal: Create Course */}
        {showCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <CardTitle className="text-lg">Create Course</CardTitle>
                  <CardDescription className="text-xs">Add an academic course to the database</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCourseModal(false)} className="size-8">
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <form onSubmit={handleCreateCourse}>
                <CardContent className="space-y-4 p-5">
                  {error && (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Department</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs"
                      required
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Course Code</label>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. CS-201"
                        className="mt-1 font-mono uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Credits</label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={credits}
                        onChange={(e) => setCredits(parseInt(e.target.value, 10))}
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Course Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Data Structures & Algorithms"
                      className="mt-1"
                      required
                    />
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50 rounded-b-xl">
                  <Button type="button" variant="outline" onClick={() => setShowCourseModal(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-[#6558ee] text-xs font-semibold text-white">
                    {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Save Course
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Modal: Create Department */}
        {showDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <CardTitle className="text-lg">Add Academic Department</CardTitle>
                  <CardDescription className="text-xs">Create institutional department branch</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowDeptModal(false)} className="size-8">
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <form onSubmit={handleCreateDept}>
                <CardContent className="space-y-4 p-5">
                  {error && (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Department Name</label>
                    <Input
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      placeholder="e.g. Electrical Engineering"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Department Code</label>
                    <Input
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      placeholder="e.g. EEE"
                      className="mt-1 font-mono uppercase"
                      required
                    />
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50 rounded-b-xl">
                  <Button type="button" variant="outline" onClick={() => setShowDeptModal(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-[#6558ee] text-xs font-semibold text-white">
                    {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Save Department
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
