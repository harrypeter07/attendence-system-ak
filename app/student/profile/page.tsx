'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    fetch('/api/student/profile')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setProfile(res.data)
          setPhone(res.data.phone || '')
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setNotice('Profile updated successfully.')
      }
    } catch {
      setNotice('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="student">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Student Profile
          </h1>
          <p className="text-sm text-slate-500">
            View your institution enrollment identity and contact details.
          </p>
        </div>

        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="size-4 text-emerald-600" /> {notice}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#6558ee]" />
          </div>
        ) : (
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#6558ee]/10 text-xl font-bold text-[#6558ee]">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'S'}
              </div>
              <div>
                <CardTitle className="text-lg">{profile?.full_name}</CardTitle>
                <CardDescription className="text-xs">
                  Student ID: <span className="font-mono font-semibold text-slate-700">{profile?.student_id || 'N/A'}</span>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Full Name</label>
                    <Input value={profile?.full_name || ''} disabled className="mt-1 bg-slate-50 text-slate-600" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Email Address</label>
                    <Input value={profile?.email || ''} disabled className="mt-1 bg-slate-50 text-slate-600" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Student Roll / ID</label>
                    <Input value={profile?.student_id || ''} disabled className="mt-1 bg-slate-50 text-slate-600 font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Department</label>
                    <Input value={profile?.department?.name || 'General Engineering'} disabled className="mt-1 bg-slate-50 text-slate-600" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Phone Number (Editable)</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <ShieldCheck className="size-4 text-emerald-600" /> Verified Institutional Record
                  </div>
                  <p>
                    Official academic details such as full name and student ID are managed by the institution registrar.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="gap-2 bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
