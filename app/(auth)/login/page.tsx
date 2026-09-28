'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  // Common fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Signup fields
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student')
  const [identifier, setIdentifier] = useState('') // Student ID or Employee ID

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        setError(result?.message || 'Invalid email or password.')
        return
      }

      const target =
        result.redirectTo ||
        (result.user?.role === 'admin'
          ? '/admin'
          : result.user?.role === 'teacher'
          ? '/teacher'
          : '/student')
      router.push(target)
      router.refresh()
    } catch {
      setError('Unable to reach the authentication service. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
          identifier: identifier.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        setError(result?.message || 'Failed to create account.')
        return
      }

      const target = result.redirectTo || (role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student')
      router.push(target)
      router.refresh()
    } catch {
      setError('Registration error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(userEmail: string, userPass: string) {
    setMode('signin')
    setEmail(userEmail)
    setPassword(userPass)
    setError('')
  }

  return (
    <main className="flex min-h-screen bg-[#f3f7f9] text-[#24345f]">
      {/* Visual Brand Panel (Left on Desktop) */}
      <section className="relative hidden overflow-hidden lg:flex lg:w-[46%] lg:flex-col lg:justify-between bg-[#1e2746] p-12 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(101,88,238,.35),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(16,185,129,.18),transparent_35%)]" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#6558ee] shadow-lg shadow-[#6558ee]/40">
            <Zap className="size-6 fill-current text-white" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">Attendly</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Smart Attendance System</p>
          </div>
        </div>

        <div className="relative max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles className="size-3.5" /> Next-Gen Classroom Security
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight">
            Every class counted.<br />
            <span className="text-[#a59dfe]">Every scan verified.</span>
          </h1>
          <p className="max-w-md text-base leading-7 text-slate-300">
            15-second dynamic QR token rotation coupled with real-time GPS geofencing. Built for institutions that demand integrity.
          </p>

          <div className="space-y-2.5 pt-4 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Anti-screenshot dynamic QR code rotation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Server-validated GPS distance check</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Role-based access: Admin, Teacher, and Student</span>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          © 2026 Attendly Technologies. Production-ready classroom attendance.
        </p>
      </section>

      {/* Auth Card Panel (Right) */}
      <section className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl">
          <CardHeader className="p-6 pb-3 sm:p-8 sm:pb-4">
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#6558ee]/10 text-[#6558ee] lg:hidden">
              <Zap className="size-5 fill-current" />
            </div>

            {/* Mode Selector Tabs (Sign In / Register) */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError('')
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError('')
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>

            <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
              {mode === 'signin' ? 'Sign in to Attendly' : 'Register New Account'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {mode === 'signin'
                ? 'Enter your institutional credentials or click a demo account'
                : 'Select your role and create a new institutional account'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2 sm:p-8 sm:pt-2 space-y-4">
            {/* Quick Demo Credentials Bar (Visible on Sign In) */}
            {mode === 'signin' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  One-Click Demo Fill:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo('admin@attendly.edu', 'AdminPassword123!')}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-center text-xs font-semibold text-slate-700 hover:border-[#6558ee] hover:bg-[#6558ee]/5 transition-colors"
                  >
                    <ShieldCheck className="mx-auto size-3.5 text-rose-500 mb-1" />
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('teacher@attendly.edu', 'TeacherPassword123!')}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-center text-xs font-semibold text-slate-700 hover:border-[#6558ee] hover:bg-[#6558ee]/5 transition-colors"
                  >
                    <Users className="mx-auto size-3.5 text-violet-500 mb-1" />
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('student@attendly.edu', 'StudentPassword123!')}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-center text-xs font-semibold text-slate-700 hover:border-[#6558ee] hover:bg-[#6558ee]/5 transition-colors"
                  >
                    <GraduationCap className="mx-auto size-3.5 text-emerald-500 mb-1" />
                    Student
                  </button>
                </div>
              </div>
            )}

            {/*
              ========================================================
              GOOGLE SIGN IN UI (COMMENTED OUT FOR NOW AS REQUESTED)
              ========================================================
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 gap-2 rounded-xl border-slate-200 bg-white font-semibold text-slate-700"
              >
                Sign in with Google
              </Button>
            */}

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <ShieldAlert className="size-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <div className="relative mt-1">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@attendly.edu"
                      className="pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <div className="relative mt-1">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="pl-9 pr-9 text-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 text-slate-500">
                    <input type="checkbox" defaultChecked className="accent-[#6558ee] rounded" />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="font-semibold text-[#6558ee] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 gap-2 rounded-xl bg-[#6558ee] font-semibold text-white shadow-md shadow-[#6558ee]/25 hover:bg-[#5549d8]"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                  Sign In to Attendly
                </Button>
              </form>
            ) : (
              /* ROLE-BASED SIGN UP FORM */
              <form onSubmit={handleSignUp} className="space-y-3">
                {/* Role Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700">Select Role</label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
                        role === 'student'
                          ? 'border-[#6558ee] bg-[#6558ee]/10 text-[#6558ee]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="mx-auto size-4 mb-1" />
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
                        role === 'teacher'
                          ? 'border-[#6558ee] bg-[#6558ee]/10 text-[#6558ee]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="mx-auto size-4 mb-1" />
                      Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
                        role === 'admin'
                          ? 'border-[#6558ee] bg-[#6558ee]/10 text-[#6558ee]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className="mx-auto size-4 mb-1" />
                      Admin
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="mt-1 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className="mt-1 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    {role === 'student' ? 'Student Roll / ID' : 'Faculty / Employee ID'}
                  </label>
                  <Input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={role === 'student' ? 'e.g. STU-20901' : 'e.g. EMP-109'}
                    className="mt-1 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="pr-9 text-xs"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 gap-2 rounded-xl bg-[#6558ee] font-semibold text-white shadow-md shadow-[#6558ee]/25 hover:bg-[#5549d8] mt-2"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Register as {role.charAt(0).toUpperCase() + role.slice(1)}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
