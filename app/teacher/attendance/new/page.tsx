'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  QrCode,
  ShieldAlert,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface ClassItem {
  id: string
  name: string
  room: string
  semester: string
  academicYear: string
  course: {
    id?: string
    code: string
    name: string
    department?: { name: string }
  }
  enrolledCount: number
  location?: {
    latitude: number
    longitude: number
    radius_meters: number
  }
}

interface CatalogCourse {
  id: string
  code: string
  name: string
  department?: { name: string }
}

export default function NewAttendanceSessionPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [catalogCourses, setCatalogCourses] = useState<CatalogCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [latitude, setLatitude] = useState<number>(12.9716)
  const [longitude, setLongitude] = useState<number>(77.5946)
  const [radiusMeters, setRadiusMeters] = useState<number>(100)
  const [locationStatus, setLocationStatus] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [successNotice, setSuccessNotice] = useState<string>('')

  // Inline Class Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creatingClass, setCreatingClass] = useState(false)
  const [createError, setCreateError] = useState('')
  const [courseMode, setCourseMode] = useState<'new' | 'existing'>('new')
  const [selectedCatalogId, setSelectedCatalogId] = useState('')
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseCode, setNewCourseCode] = useState('')
  const [newClassName, setNewClassName] = useState('Section A')
  const [newRoom, setNewRoom] = useState('')
  const [newSemester, setNewSemester] = useState('Spring 2026')

  async function loadClasses() {
    try {
      const res = await fetch('/api/teacher/classes')
      const json = await res.json()
      if (json.ok && json.data) {
        setClasses(json.data)
        if (json.data.length > 0) {
          // If none selected or selected class no longer in list, pick first
          setSelectedClassId((prev) => {
            const exists = json.data.some((c: ClassItem) => c.id === prev)
            return exists ? prev : json.data[0].id
          })
          if (json.data[0].location) {
            setLatitude(Number(json.data[0].location.latitude) || 12.9716)
            setLongitude(Number(json.data[0].location.longitude) || 77.5946)
            setRadiusMeters(json.data[0].location.radius_meters || 100)
          }
        }
      }
    } catch (err) {
      console.error(err)
      setError('Could not load classes.')
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalog() {
    try {
      const res = await fetch('/api/admin/courses')
      const json = await res.json()
      if (json.ok && Array.isArray(json.data)) {
        setCatalogCourses(json.data)
      }
    } catch {}
  }

  useEffect(() => {
    loadClasses()
    loadCatalog()
  }, [])

  function openCreateModal() {
    setCreateError('')
    setNewCourseName('')
    setNewCourseCode('')
    setNewClassName('Section A')
    setNewRoom('')
    setNewSemester('Spring 2026')
    setCourseMode(catalogCourses.length > 0 ? 'existing' : 'new')
    if (catalogCourses.length > 0) {
      setSelectedCatalogId(catalogCourses[0].id)
    }
    setIsCreateModalOpen(true)
  }

  async function handleCreateClassSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')

    if (courseMode === 'new') {
      if (!newCourseName.trim() || newCourseName.trim().length < 2) {
        setCreateError('Course name must be at least 2 characters.')
        return
      }
    } else {
      if (!selectedCatalogId) {
        setCreateError('Please select a course from the catalog.')
        return
      }
    }

    setCreatingClass(true)
    try {
      const payload: any = {
        className: newClassName.trim() || 'Section A',
        room: newRoom.trim() || 'Room 101',
        semester: newSemester.trim() || 'Spring 2026',
        latitude,
        longitude,
        radiusMeters,
      }

      if (courseMode === 'existing') {
        payload.courseId = selectedCatalogId
        const matched = catalogCourses.find((c) => c.id === selectedCatalogId)
        if (matched) {
          payload.courseName = matched.name
          payload.courseCode = matched.code
        }
      } else {
        payload.courseName = newCourseName.trim()
        payload.courseCode = newCourseCode.trim()
      }

      const res = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        setIsCreateModalOpen(false)
        setSuccessNotice(`Class "${payload.courseName || 'Course'} (${payload.className})" created and ready!`)
        await loadClasses()
        if (data.data?.id) {
          setSelectedClassId(data.data.id)
        }
      } else {
        setCreateError(data.message || 'Failed to create class.')
      }
    } catch {
      setCreateError('Network error while creating class.')
    } finally {
      setCreatingClass(false)
    }
  }

  function handleClassChange(classId: string) {
    setSelectedClassId(classId)
    const cls = classes.find((c) => c.id === classId)
    if (cls?.location) {
      setLatitude(Number(cls.location.latitude) || 12.9716)
      setLongitude(Number(cls.location.longitude) || 77.5946)
      setRadiusMeters(cls.location.radius_meters || 100)
    }
  }

  function detectCurrentLocation() {
    setLocationStatus('Acquiring device GPS coordinates…')
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)))
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)))
        setLocationStatus(
          `GPS coordinates acquired! (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`
        )
      },
      (err) => {
        console.error(err)
        setLocationStatus(`Could not acquire GPS: ${err.message}. Using current coordinates.`)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function handleStartSession(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedClassId) {
      setError('Please select a class.')
      return
    }

    const lat = Number(latitude)
    const lng = Number(longitude)
    const rad = Number(radiusMeters)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Please provide a valid classroom latitude (-90 to 90).')
      return
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Please provide a valid classroom longitude (-180 to 180).')
      return
    }
    if (isNaN(rad) || rad < 10 || rad > 1000) {
      setError('Classroom geofence radius must be between 10 and 1000 meters.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/teacher/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          latitude: lat,
          longitude: lng,
          radiusMeters: rad,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.ok) {
        setError(data.message || 'Failed to start session.')
        return
      }

      // Navigate to live session room
      router.push(`/teacher/attendance/${data.data.sessionId}`)
    } catch {
      setError('Network error while starting attendance session.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  return (
    <DashboardLayout role="teacher">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/teacher/classes"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
            >
              <ArrowLeft className="size-4" /> Back to My Classes
            </Link>
            <div className="mt-2 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6558ee]">Live Attendance</span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Start Dynamic QR Attendance
              </h1>
              <p className="text-sm text-slate-500">
                Launch a live attendance session with 15-second rotating cryptographic QR codes and GPS geofence verification.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={openCreateModal}
            variant="outline"
            className="self-start sm:self-auto gap-1.5 border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="size-3.5" /> Create New Class
          </Button>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice('')} className="text-emerald-600 hover:text-emerald-800">
              <X className="size-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <ShieldAlert className="size-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <Card className="flex items-center justify-center p-12">
            <Loader2 className="size-8 animate-spin text-[#6558ee]" />
          </Card>
        ) : classes.length === 0 ? (
          <Card className="p-8 text-center bg-white border-slate-200 shadow-sm">
            <BookOpen className="mx-auto size-12 text-[#6558ee]/40" />
            <h3 className="mt-4 text-base font-bold text-slate-900">No classes created yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Create your course and class section right now to broadcast dynamic QR attendance. Students automatically enroll on their first scan!
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                onClick={openCreateModal}
                className="gap-2 bg-[#6558ee] px-6 text-xs font-semibold text-white shadow-md shadow-[#6558ee]/25 hover:bg-[#5549d8]"
              >
                <Plus className="size-4" /> Create Class & Start Attendance
              </Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleStartSession} className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">Select Class & Academic Section</CardTitle>
                  <CardDescription>Choose which class section you are broadcasting attendance for</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={openCreateModal}
                  className="gap-1 text-xs font-semibold text-[#6558ee] hover:bg-[#6558ee]/10"
                >
                  <Plus className="size-3.5" /> Add Another Class
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {classes.map((cls) => {
                    const isSelected = cls.id === selectedClassId
                    return (
                      <div
                        key={cls.id}
                        onClick={() => handleClassChange(cls.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          isSelected
                            ? 'border-[#6558ee] bg-[#6558ee]/5 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block rounded-md bg-[#6558ee]/10 px-2 py-0.5 text-xs font-bold text-[#6558ee]">
                              {cls.course?.code}
                            </span>
                            <h4 className="mt-1 font-semibold text-slate-900">{cls.course?.name}</h4>
                            <p className="text-xs text-slate-500">
                              {cls.name} · Room: {cls.room || 'TBD'}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="size-5 text-[#6558ee]" />}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs text-slate-500">
                          <span>{cls.semester}</span>
                          <span className="font-semibold text-slate-700">{cls.enrolledCount} Students Enrolled</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* GPS Geofence Settings */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Classroom Geofence Location</CardTitle>
                    <CardDescription>
                      Students must be within this physical radius to verify their scan
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={detectCurrentLocation}
                    className="gap-2 border-slate-300 text-xs font-medium"
                  >
                    <Compass className="size-3.5 text-[#6558ee]" /> Auto-Detect Current GPS
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {locationStatus && (
                  <div className="rounded-lg bg-indigo-50 p-3 text-xs font-medium text-indigo-700 border border-indigo-100 flex items-center gap-2">
                    <MapPin className="size-3.5 shrink-0" />
                    <span>{locationStatus}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Classroom Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="mt-1 font-mono text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Classroom Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="mt-1 font-mono text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Allowable Radius (Meters)</label>
                    <Input
                      type="number"
                      min={10}
                      max={1000}
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(parseInt(e.target.value) || 100)}
                      className="mt-1 font-mono text-xs"
                      required
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Recommended: 50m – 100m for lecture halls</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Launch CTA */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/teacher/classes">
                <Button type="button" variant="ghost" className="text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 gap-2 bg-[#6558ee] px-6 text-sm font-semibold text-white shadow-md shadow-[#6558ee]/25 hover:bg-[#5549d8]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Initializing Live Room…
                  </>
                ) : (
                  <>
                    <QrCode className="size-4" /> Start Dynamic Attendance Session
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Modal: Create Class Section */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Class Section</h3>
                  <p className="text-xs text-slate-500">Set up a course section to start taking attendance</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-5" />
                </button>
              </div>

              {createError && (
                <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-700 border border-rose-200">
                  {createError}
                </div>
              )}

              {/* Mode Toggle: Existing Course vs New Course */}
              {catalogCourses.length > 0 && (
                <div className="mt-4 flex rounded-lg bg-slate-100 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setCourseMode('existing')}
                    className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
                      courseMode === 'existing'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Select Catalog Course ({catalogCourses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseMode('new')}
                    className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
                      courseMode === 'new'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Create New Course
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateClassSubmit} className="mt-4 space-y-3.5">
                {courseMode === 'existing' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Course from Catalog *</label>
                    <select
                      value={selectedCatalogId}
                      onChange={(e) => setSelectedCatalogId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-[#6558ee] focus:outline-hidden focus:ring-1 focus:ring-[#6558ee]"
                      required
                    >
                      {catalogCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.name} {c.department?.name ? `(${c.department.name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Course Name *</label>
                      <Input
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        placeholder="e.g. Distributed Systems & Cloud Computing"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Course Code (Optional)</label>
                      <Input
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value)}
                        placeholder="e.g. CS-401 (leave blank to auto-generate)"
                        className="mt-1 font-mono uppercase"
                      />
                    </div>
                  </>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">Section / Class Name *</label>
                    <div className="flex gap-1">
                      {['Section A', 'Section B', 'Section C'].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setNewClassName(sec)}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                            newClassName === sec
                              ? 'border-[#6558ee] bg-[#6558ee]/10 text-[#6558ee]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. Section A"
                    className="mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Room / Venue</label>
                    <Input
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      placeholder="e.g. Room 302"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Academic Semester</label>
                    <Input
                      value={newSemester}
                      onChange={(e) => setNewSemester(e.target.value)}
                      placeholder="e.g. Spring 2026"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-100 flex items-start gap-2">
                  <GraduationCap className="size-4 text-[#6558ee] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-700">Autonomous Student Auto-Enrollment:</strong> Students are automatically enrolled when they scan your dynamic QR code. No manual roster needed.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creatingClass}
                    className="bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
                  >
                    {creatingClass ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Creating…
                      </>
                    ) : (
                      'Create Class & Select'
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
