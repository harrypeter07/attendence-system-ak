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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/teacher/profile')
        const json = await res.json()
        if (json.ok && json.data) {
          setProfile(json.data)
          setPhone(json.data.phone || '')
          setAvatarUrl(json.data.avatar_url || null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const MAX_DIM = 400
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width)
            width = MAX_DIM
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height)
            height = MAX_DIM
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.85)
          setAvatarUrl(compressed)
          setUploadingPhoto(true)
          try {
            const res = await fetch('/api/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ avatarUrl: compressed }),
            })
            const data = await res.json()
            if (res.ok && data.ok) {
              setNotice('Faculty photo updated successfully!')
            }
          } catch {
            setNotice('Failed to upload photo.')
          } finally {
            setUploadingPhoto(false)
          }
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      const res = await fetch('/api/teacher/profile', {
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
              <label className="relative size-16 shrink-0 cursor-pointer group">
                <div className="relative size-full overflow-hidden rounded-2xl ring-2 ring-violet-500/20 group-hover:ring-[#6558ee] transition-all">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Faculty Avatar" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-violet-100 text-xl font-bold text-violet-700">
                      {profile?.full_name ? profile.full_name[0].toUpperCase() : 'T'}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold">Edit</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
              <div>
                <CardTitle className="text-lg">{profile?.full_name}</CardTitle>
                <CardDescription className="text-xs">
                  Faculty ID: <span className="font-mono font-semibold text-slate-700">{profile?.employee_id || 'FAC-102'}</span>
                </CardDescription>
                <p className="text-[11px] text-slate-400 mt-1">Tap avatar to change faculty profile photo</p>
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
