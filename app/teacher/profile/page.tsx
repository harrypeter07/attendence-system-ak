'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
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

export default function TeacherProfilePage() {
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
        setNotice('Faculty profile updated.')
      }
    } catch {
      setNotice('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="teacher">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/teacher"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Faculty Profile
          </h1>
          <p className="text-sm text-slate-500">
            Your instructor profile, department affiliation, and contact details.
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
              <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-100 text-xl font-bold text-violet-700">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'T'}
              </div>
              <div>
                <CardTitle className="text-lg">{profile?.full_name}</CardTitle>
                <CardDescription className="text-xs">
                  Faculty ID: <span className="font-mono font-semibold text-slate-700">{profile?.employee_id || 'FAC-102'}</span>
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
                    <label className="text-xs font-semibold text-slate-500">Institutional Email</label>
                    <Input value={profile?.email || ''} disabled className="mt-1 bg-slate-50 text-slate-600" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Employee ID</label>
                    <Input value={profile?.employee_id || 'FAC-102'} disabled className="mt-1 bg-slate-50 text-slate-600 font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Department</label>
                    <Input value={profile?.department?.name || 'Computer Science & Engineering'} disabled className="mt-1 bg-slate-50 text-slate-600" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Contact Phone Number</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <ShieldCheck className="size-4 text-violet-600" /> Authorized Faculty Credentials
                  </div>
                  <p>
                    Faculty permissions allow starting dynamic QR sessions and signing student attendance rosters.
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
