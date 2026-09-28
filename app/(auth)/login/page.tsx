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
  Users,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
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

      // Successful sign in, redirect to workspace
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
      setError('Unable to reach the authentication service. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'https://attendion.vercel.app'

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setGoogleLoading(false)
      }
    } catch {
      setError('Failed to initiate Google sign-in. Check configuration.')
      setGoogleLoading(false)
    }
  }

  function fillDemo(userEmail: string, userPass: string) {
    setEmail(userEmail)
    setPassword(userPass)
    setError('')
  }

  return (
    <main className="flex min-h-screen bg-[#f3f7f9] text-[#24345f]">
      {/* Visual Brand Panel (Left on Desktop) */}
      <section className="relative hidden overflow-hidden lg:flex lg:w-[48%] lg:flex-col lg:justify-between bg-[#1e2746] p-12 text-white">
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
            Cryptographic 15-second dynamic QR rotation coupled with real-time GPS geofencing. Built for institutions that demand integrity.
          </p>

          <div className="space-y-2.5 pt-4 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Prevents screenshot sharing and proxy attendance</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Server-enforced GPS distance verification</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Full Supabase Row-Level-Security (RLS) protection</span>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          © 2026 Attendly Technologies. Production-ready classroom attendance.
        </p>
      </section>

      {/* Login Card Panel (Right) */}
      <section className="flex flex-1 items-center justify-center p-5 sm:p-10">
        <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl">
          <CardHeader className="p-7 pb-4 sm:p-9 sm:pb-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#6558ee]/10 text-[#6558ee] lg:hidden">
              <Zap className="size-5 fill-current" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to Attendly
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your institutional credentials, sign in with Google, or select a demo account
            </CardDescription>
          </CardHeader>

          <CardContent className="p-7 pt-3 sm:p-9 sm:pt-4 space-y-4">
            {/* Quick Demo Logins Bar */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Quick Demo Accounts (Click to Fill):
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

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full h-11 gap-3 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              {googleLoading ? (
                <Loader2 className="size-4 animate-spin text-[#6558ee]" />
              ) : (
                <svg className="size-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.24A7.18 7.18 0 0 1 4.9 12c0-.78.14-1.54.37-2.24V6.61H1.27A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.27 5.39l4-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </Button>

            <div className="relative my-3 flex items-center justify-center">
              <Separator className="w-full" />
              <span className="absolute bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400">
                Or sign in with email
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                <ShieldAlert className="size-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
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
                    placeholder="Enter your password"
                    className="pl-9 pr-9 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
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
                className="w-full h-11 gap-2 rounded-xl bg-[#6558ee] font-semibold text-white shadow-md shadow-[#6558ee]/25 hover:bg-[#5549d8] transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Verifying Credentials…
                  </>
                ) : (
                  <>
                    Sign In with Email <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              Role routing: Admins → <code>/admin</code> · Teachers → <code>/teacher</code> · Students → <code>/student</code>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
