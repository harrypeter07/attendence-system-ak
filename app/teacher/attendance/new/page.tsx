'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Compass,
  Loader2,
  MapPin,
  QrCode,
  ShieldAlert,
  Sparkles,
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

export default function NewAttendanceSessionPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [latitude, setLatitude] = useState<number>(12.9716)
  const [longitude, setLongitude] = useState<number>(77.5946)
  const [radiusMeters, setRadiusMeters] = useState<number>(100)
  const [locationStatus, setLocationStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/teacher/classes')
        const json = await res.json()
        if (json.ok && json.data) {
          setClasses(json.data)
          if (json.data.length > 0) {
            setSelectedClassId(json.data[0].id)
            if (json.data[0].location) {
              setLatitude(Number(json.data[0].location.latitude) || 12.9716)
              setLongitude(Number(json.data[0].location.longitude) || 77.5946)
              setRadiusMeters(json.data[0].location.radius_meters || 100)
            }
          }
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load assigned classes')
      } finally {
        setLoading(false)
      }
    }
    loadClasses()
  }, [])

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
        setLocationStatus(`Could not acquire GPS: ${err.message}. Using default campus coordinates.`)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function handleStartSession(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClassId) {
      setError('Please select a class.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/teacher/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
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
          <Card className="p-8 text-center">
            <BookOpen className="mx-auto size-12 text-slate-400" />
            <h3 className="mt-4 text-base font-semibold text-slate-900">No classes assigned</h3>
            <p className="mt-1 text-sm text-slate-500">
              You are not currently assigned to any active classes. Contact an administrator.
            </p>
          </Card>
        ) : (
          <form onSubmit={handleStartSession} className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Select Class & Academic Section</CardTitle>
                <CardDescription>Choose which assigned group you are currently instructing</CardDescription>
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

            {/* Geofence and Classroom Location */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Classroom Location & Geofence</CardTitle>
                  <CardDescription>
                    Students must be physically within the specified radius to mark attendance
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectCurrentLocation}
                  className="gap-2 border-slate-200 text-xs"
                >
                  <Compass className="size-4 text-[#6558ee]" /> Detect My Current GPS Location
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {locationStatus && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 border border-emerald-200">
                    <MapPin className="size-4 shrink-0 text-emerald-600" />
                    <span>{locationStatus}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value))}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value))}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Allowed Radius (meters)</label>
                    <Input
                      type="number"
                      min={10}
                      max={2000}
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Security Note:</span> The server validates the Haversine distance from this coordinate when students scan the QR code. Any scan outside {radiusMeters} meters will be automatically blocked.
                </div>
              </CardContent>
            </Card>

            {/* Launch Action */}
            <div className="flex items-center justify-between rounded-2xl border border-[#6558ee]/20 bg-gradient-to-r from-[#6558ee]/10 to-violet-500/5 p-6">
              <div>
                <h3 className="font-bold text-slate-900">Ready to begin class attendance?</h3>
                <p className="text-xs text-slate-600">
                  Dynamic QR codes will automatically regenerate every 15 seconds.
                </p>
              </div>
              <Button
                type="submit"
                disabled={submitting || !selectedClassId}
                className="gap-2 rounded-xl bg-[#6558ee] px-6 py-2.5 font-semibold text-white shadow-md shadow-[#6558ee]/25 hover:bg-[#5549d8]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Starting…
                  </>
                ) : (
                  <>
                    <QrCode className="size-4" /> Start Session & Show QR
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
