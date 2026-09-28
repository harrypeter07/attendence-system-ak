'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  Loader2,
  Lock,
  MapPin,
  Maximize2,
  Power,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface Attendee {
  id: string
  studentName: string
  studentEmail: string
  studentId: string
  markedAt: string
  distanceMeters: number | null
  status: string
}

interface SessionData {
  id: string
  status: string
  startedAt: string
  endedAt: string | null
  latitude: number
  longitude: number
  radiusMeters: number
  className: string
  room: string
  courseCode: string
  courseName: string
  totalEnrolled: number
  presentCount: number
  attendees: Attendee[]
}

const ROTATION_SECONDS = 15

export default function LiveAttendanceRoomPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [currentToken, setCurrentToken] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(ROTATION_SECONDS)
  const [loading, setLoading] = useState(true)
  const [rotating, setRotating] = useState(false)
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState<string>('')
  const [fullscreen, setFullscreen] = useState(false)

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Fetch Session Info
  async function fetchSessionDetails() {
    try {
      const res = await fetch(`/api/teacher/sessions/${sessionId}`)
      const data = await res.json()
      if (res.ok && data.ok) {
        setSession(data.data)
        if (data.data.status === 'ended') {
          // If session is ended, stop timers
          if (countdownRef.current) clearInterval(countdownRef.current)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } else {
        setError(data.message || 'Failed to load session details')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 2. Fetch and Rotate Dynamic Token
  async function fetchNewToken() {
    if (session?.status === 'ended') return
    try {
      setRotating(true)
      const res = await fetch(`/api/teacher/sessions/${sessionId}/token`)
      const data = await res.json()

      if (res.ok && data.ok) {
        const rawToken = data.data.token
        setCurrentToken(rawToken)

        // Generate QR Code containing structured attendance payload
        const qrPayload = JSON.stringify({
          sessionId,
          token: rawToken,
          validUntil: data.data.validUntil,
        })

        const dataUrl = await QRCode.toDataURL(qrPayload, {
          width: 480,
          margin: 2,
          color: {
            dark: '#1e2746',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        })

        setQrDataUrl(dataUrl)
        setCountdown(ROTATION_SECONDS)
      } else {
        setError(data.message || 'Token generation error')
      }
    } catch (err) {
      console.error('Failed to rotate token:', err)
    } finally {
      setRotating(false)
    }
  }

  // Initial Load
  useEffect(() => {
    async function init() {
      setLoading(true)
      await fetchSessionDetails()
      await fetchNewToken()
      setLoading(false)
    }
    init()

    // Setup 1-second interval for countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchNewToken()
          return ROTATION_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    // Setup 3-second polling for live attendee list
    pollRef.current = setInterval(() => {
      fetchSessionDetails()
    }, 3000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [sessionId])

  // End Session Handler
  async function handleEndSession() {
    if (!confirm('Are you sure you want to end this attendance session? Students will no longer be able to scan.')) {
      return
    }

    setEnding(true)
    try {
      const res = await fetch(`/api/teacher/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        if (countdownRef.current) clearInterval(countdownRef.current)
        if (pollRef.current) clearInterval(pollRef.current)
        router.push('/teacher/sessions')
      } else {
        setError(data.message || 'Failed to end session')
      }
    } catch {
      setError('Network error ending session')
    } finally {
      setEnding(false)
    }
  }

  const attendancePercentage =
    session && session.totalEnrolled > 0
      ? Math.round((session.presentCount / session.totalEnrolled) * 100)
      : 0

  const countdownPercent = ((ROTATION_SECONDS - countdown) / ROTATION_SECONDS) * 100

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/teacher/sessions"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
            >
              <ArrowLeft className="size-4" /> Back to Sessions
            </Link>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {session?.courseName || 'Live Attendance'}
              </h1>
              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 gap-1.5 animate-pulse">
                <span className="size-2 rounded-full bg-emerald-500 inline-block" /> Live Active Session
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              {session?.courseCode} · {session?.className} · Room {session?.room || 'TBD'} · Started at{' '}
              {session?.startedAt ? new Date(session.startedAt).toLocaleTimeString() : ''}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNewToken}
              disabled={rotating || session?.status === 'ended'}
              className="gap-2 border-slate-200 text-xs text-slate-700"
            >
              <RefreshCw className={`size-3.5 ${rotating ? 'animate-spin' : ''}`} /> Force Rotate QR
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndSession}
              disabled={ending || session?.status === 'ended'}
              className="gap-2 bg-rose-600 text-xs font-semibold hover:bg-rose-700"
            >
              {ending ? <Loader2 className="size-3.5 animate-spin" /> : <Power className="size-3.5" />} End Session
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Live Grid: Dynamic QR Display + Live Attendees Feed */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Dynamic Rotating QR Card (Left / Center) */}
          <div className="lg:col-span-7 xl:col-span-6 space-y-4">
            <Card className="border-slate-200 shadow-md overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-[#1e2746] to-[#2e3b66] p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold">15-Second Dynamic QR Verification</h3>
                    <p className="text-[11px] text-slate-300">Rotating token prevents photo sharing & proxy scans</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-black/30 px-2.5 py-1 text-xs font-mono font-semibold text-amber-300">
                  <Clock className="size-3.5" />
                  <span>{countdown}s</span>
                </div>
              </div>

              {/* Progress bar showing rotation countdown */}
              <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#6558ee] transition-all duration-1000 ease-linear"
                  style={{ width: `${100 - countdownPercent}%` }}
                />
              </div>

              <CardContent className="p-8 flex flex-col items-center justify-center">
                {loading ? (
                  <div className="flex h-80 flex-col items-center justify-center gap-3">
                    <Loader2 className="size-10 animate-spin text-[#6558ee]" />
                    <p className="text-sm text-slate-500">Generating cryptographic token…</p>
                  </div>
                ) : qrDataUrl ? (
                  <div className="space-y-4 text-center">
                    <div className="relative inline-block rounded-3xl border-4 border-slate-900/5 p-4 shadow-xl bg-white">
                      <img
                        src={qrDataUrl}
                        alt="Dynamic Attendance QR"
                        className="size-72 sm:size-80 rounded-2xl object-contain"
                      />
                      {rotating && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-xs">
                          <Loader2 className="size-8 animate-spin text-[#6558ee]" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-[#6558ee]">
                        <RefreshCw className="size-3 animate-spin" /> Rotates automatically every 15s
                      </span>
                      <p className="text-xs text-slate-500">
                        Ask students to scan using their mobile camera from the Attendly student portal
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No QR Code available</p>
                )}
              </CardContent>

              {/* Classroom Geofence Status */}
              <div className="border-t border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-[#6558ee]" />
                  <span>
                    GPS Geofence: <strong>{session?.latitude.toFixed(4)}, {session?.longitude.toFixed(4)}</strong>
                  </span>
                </div>
                <Badge variant="outline" className="border-slate-300 font-mono text-[11px]">
                  Radius: ±{session?.radiusMeters}m
                </Badge>
              </div>
            </Card>
          </div>

          {/* Live Attendee Stream & Metrics (Right) */}
          <div className="lg:col-span-5 xl:col-span-6 space-y-4">
            {/* Live Stats Cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-[#6558ee]">{attendancePercentage}%</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {session?.presentCount} of {session?.totalEnrolled} Enrolled
                    </span>
                  </div>
                  <Progress value={attendancePercentage} className="mt-3 h-2" />
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Scans</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-emerald-600">{session?.presentCount || 0}</span>
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Verified
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400">Stream updates every 3 seconds</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Attendee Feed */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Realtime Attendance Roster</CardTitle>
                  <CardDescription className="text-xs">Students verified for this session</CardDescription>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  {session?.attendees?.length || 0} Present
                </span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                  {session?.attendees && session.attendees.length > 0 ? (
                    session.attendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 text-xs">
                            {attendee.studentName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{attendee.studentName}</p>
                            <p className="text-xs text-slate-500 font-mono">
                              ID: {attendee.studentId} · {attendee.studentEmail}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" /> Present
                          </span>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {new Date(attendee.markedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                            {attendee.distanceMeters !== null && ` · ${attendee.distanceMeters}m`}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <Users className="mx-auto size-8 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-600">Waiting for scans…</p>
                      <p className="text-xs text-slate-400">Students scanning the QR code will appear here instantly.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
