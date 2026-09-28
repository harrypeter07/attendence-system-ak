'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  Layers,
  Lock,
  MapPin,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student' | 'admin'>('teacher')
  const [demoCountdown, setDemoCountdown] = useState(15)

  // Interactive 15s timer simulation for the demo card
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoCountdown((prev) => (prev <= 1 ? 15 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-[#6558ee]/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#6558ee] text-white shadow-md shadow-[#6558ee]/25">
              <Zap className="size-5 fill-current" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">Attendly</span>
              <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Institutional
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="text-xs font-semibold text-slate-600 hover:text-[#6558ee] transition-colors">
              How It Works
            </a>
            <a href="#roles" className="text-xs font-semibold text-slate-600 hover:text-[#6558ee] transition-colors">
              Role Workflows
            </a>
            <a href="#security" className="text-xs font-semibold text-slate-600 hover:text-[#6558ee] transition-colors">
              Security Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="h-9 rounded-lg border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="h-9 rounded-lg bg-[#6558ee] text-xs font-semibold text-white shadow-sm hover:bg-[#5549d8]">
                Access Portal <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <ShieldCheck className="size-4 text-emerald-600" /> Enterprise Campus Attendance Architecture
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.12]">
                Zero-Proxy Classroom Attendance, <br />
                <span className="text-[#6558ee]">Verified in Real Time.</span>
              </h1>

              <p className="max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
                Replace slow manual paper roll-calls and easily forged static QR codes with cryptographic 15-second dynamic tokens and GPS classroom geofencing.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/login">
                  <Button className="h-11 rounded-xl bg-[#6558ee] px-6 text-sm font-bold text-white shadow-md shadow-[#6558ee]/30 hover:bg-[#5549d8]">
                    Enter Workspace <ArrowRight className="size-4 ml-1.5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" className="h-11 rounded-xl border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Explore Architecture
                  </Button>
                </a>
              </div>

              {/* Core Metrics Pills */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 max-w-lg">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">15s</p>
                  <p className="text-xs text-slate-500">Token rotation rate</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">±100m</p>
                  <p className="text-xs text-slate-500">Classroom geofence</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">100%</p>
                  <p className="text-xs text-slate-500">Automated audit trail</p>
                </div>
              </div>
            </div>

            {/* Right Live Interactive Demo Card */}
            <div className="lg:col-span-5">
              <Card className="rounded-2xl border-slate-200 bg-gradient-to-b from-[#1e2746] to-[#161c33] text-white shadow-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">Live Session Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs font-mono font-bold text-amber-300">
                    <Clock className="size-3" />
                    <span>Rotates in {demoCountdown}s</span>
                  </div>
                </div>

                <div className="my-6 flex flex-col items-center justify-center space-y-4">
                  <div className="relative rounded-2xl bg-white p-4 shadow-xl">
                    <div className="flex size-44 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <QrCode className="size-36 text-white" />
                    </div>
                    <div className="mt-2 text-center text-[10px] font-mono text-slate-500 font-bold">
                      TOKEN: #{Math.floor(100000 + demoCountdown * 4123)}
                    </div>
                  </div>

                  <p className="text-center text-xs text-slate-300">
                    Students scan from mobile camera · Coordinates validated on entry
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-[#6558ee]" /> Geofence Status:
                    </span>
                    <span className="text-emerald-400 font-medium font-mono">18m from Center (Inside)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 border-t border-white/10 pt-2">
                    <span>Attendance Rate:</span>
                    <span className="font-bold text-white">48 / 52 Students Present</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: The Core Process (How It Works) */}
      <section id="how-it-works" className="py-20 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="rounded-md bg-[#6558ee]/10 px-2.5 py-1 text-xs font-semibold text-[#6558ee]">
              Streamlined Flow
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Three Simple Steps to Flawless Attendance
            </h2>
            <p className="text-sm text-slate-600">
              Designed from the ground up to eliminate institutional friction, spreadsheet imports, and manual roll-calls.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-[#6558ee] font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900">Teacher Launches Session</h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Faculty select their course and tap &quot;Start Attendance&quot;. The classroom screen displays a rolling QR code that cryptographically updates every 15 seconds.
                </p>
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
                ✓ No paper sheets · Automatically links to teacher
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900">Student Scans & Auto-Enrolls</h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Students point their mobile phone camera at the screen. On their very first scan, they are seamlessly enrolled into the course roster with zero paperwork.
                </p>
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
                ✓ Instant onboarding · Zero administrative gatekeeping
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-lg">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900">Dual Verification Applied</h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  The server checks token freshness and verifies the student&apos;s physical presence within the classroom GPS geofence before permanently recording presence.
                </p>
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
                ✓ Anti-proxy validated · Time & GPS logged
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 2: Role Workflows (Interactive Tabs) */}
      <section id="roles" className="py-20 border-b border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="rounded-md bg-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-700">
              Role Workspaces
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Tailored Experience for Every User
            </h2>
            <p className="text-sm text-slate-600">
              Select a role below to see how Attendly simplifies day-to-day operations.
            </p>

            {/* Role Switcher */}
            <div className="inline-flex rounded-xl bg-slate-200/80 p-1 mt-6">
              <button
                type="button"
                onClick={() => setActiveTab('teacher')}
                className={`rounded-lg px-5 py-2 text-xs font-semibold transition-all ${
                  activeTab === 'teacher' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Faculty / Teacher
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className={`rounded-lg px-5 py-2 text-xs font-semibold transition-all ${
                  activeTab === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student Portal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`rounded-lg px-5 py-2 text-xs font-semibold transition-all ${
                  activeTab === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Institutional Admin
              </button>
            </div>
          </div>

          <div className="mt-12 max-w-4xl mx-auto">
            {activeTab === 'teacher' && (
              <Card className="rounded-2xl border-slate-200 bg-white p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-violet-100 text-[#6558ee]">
                    <GraduationCap className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Faculty Instructor Workflow</h3>
                    <p className="text-xs text-slate-500">Full classroom control with zero administrative delays</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#6558ee]" /> Autonomous Class Creation
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Teachers can create new courses and sections directly from their dashboard without submitting IT tickets or waiting for admin approval.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#6558ee]" /> 15s Dynamic Display
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Launch a lecture session on any screen or projector. The rolling token ensures that students in the room are the only ones able to scan.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#6558ee]" /> Live Attendee Stream
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Watch students appear in real time on the live attendance roster. Attendance counts update automatically every 3 seconds.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#6558ee]" /> Instant Roster Export
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Download session summaries, individual student attendance percentages, and historical course records at any time.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'student' && (
              <Card className="rounded-2xl border-slate-200 bg-white p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Smartphone className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Student Mobile Experience</h3>
                    <p className="text-xs text-slate-500">Fast, friction-free attendance verification from your phone</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" /> One-Tap Mobile Camera Scan
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Simply tap &quot;Scan QR Now&quot; on your phone and point the camera at the classroom projector. No special hardware or dongles needed.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" /> Instant Auto-Enrollment
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Joining a new class? Scanning the teacher&apos;s code for the first time automatically adds you to the official course roster and records your presence.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" /> Transparent History
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Check your historical attendance rate, course progress, dates attended, and verified classroom distances in real time.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" /> Privacy & Location Security
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Location permissions are only requested during the active scan to verify classroom proximity, protecting battery and student privacy.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'admin' && (
              <Card className="rounded-2xl border-slate-200 bg-white p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Layers className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Institutional Governance & Analytics</h3>
                    <p className="text-xs text-slate-500">Campus-wide visibility without micromanaging daily operations</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-blue-600" /> Macro Campus Analytics
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Inspect overall attendance percentages, department comparison metrics, active session counts, and student participation rates at a glance.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-blue-600" /> Security Audit Log
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Review all authentication events, expired token scans, out-of-bounds geofence attempts, and institutional changes in an immutable log.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-blue-600" /> Zero Operational Bottlenecks
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Admins no longer need to upload rosters or assign teachers to every lecture. Teachers manage their classes, and students auto-enroll.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-blue-600" /> Registrar CSV & PDF Exports
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Generate official accreditation-ready attendance reports filtered by department, course, teacher, or semester with one click.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Deep Dive Security Architecture */}
      <section id="security" className="py-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Cryptographic Integrity
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Why Attendly Cannot Be Proxied
            </h2>
            <p className="text-sm text-slate-600">
              Traditional attendance systems suffer from proxy scans and forwarded photos. Here is how our dual-layer security guarantees genuine physical presence.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-slate-200 bg-slate-50/50 p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 text-[#6558ee]">
                <Clock className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">15s Ephemeral Tokens</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tokens are cryptographically signed and expire every 15 seconds. Photos sent over WhatsApp or messaging apps fail before a remote recipient can scan.
              </p>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-slate-50/50 p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 text-emerald-600">
                <MapPin className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Haversine GPS Geofencing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The server compares the student&apos;s live coordinates against the classroom center. Any scan beyond the preset radius (e.g., ±100m) is automatically rejected.
              </p>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-slate-50/50 p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 text-blue-600">
                <Lock className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Single-Record Enforcement</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict database constraints prevent multiple scans for the same student ID during a single lecture session. Duplicate attempts are immediately blocked.
              </p>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-slate-50/50 p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 text-amber-600">
                <ShieldAlert className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Tamper-Proof Audit Trail</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every scan attempt—whether successful or blocked due to expired tokens or out-of-bounds GPS—is permanently logged with exact meters and timestamps.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 4: Final Call to Action */}
      <section className="py-16 bg-[#1e2746] text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Experience Modern Academic Attendance
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Sign in with your university credentials to launch your faculty portal, mark student attendance, or monitor campus analytics.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button className="h-12 rounded-xl bg-[#6558ee] px-8 text-sm font-bold text-white shadow-lg shadow-[#6558ee]/40 hover:bg-[#5549d8]">
                Sign In to Your Workspace <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-[#6558ee] text-white">
              <Zap className="size-3.5 fill-current" />
            </div>
            <span className="font-bold text-slate-800">Attendly</span>
            <span>· Enterprise Campus Attendance Architecture</span>
          </div>
          <p>© 2026 Attendly Systems. Built for high-integrity academic institutions.</p>
        </div>
      </footer>
    </div>
  )
}
