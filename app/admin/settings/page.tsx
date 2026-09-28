'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Compass,
  Loader2,
  Lock,
  MapPin,
  Save,
  Settings2,
  ShieldCheck,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const [institutionName, setInstitutionName] = useState('Attendly Institute of Technology')
  const [defaultRadius, setDefaultRadius] = useState(100)
  const [defaultLat, setDefaultLat] = useState(12.9716)
  const [defaultLng, setDefaultLng] = useState(77.5946)
  const [tokenRotationSeconds, setTokenRotationSeconds] = useState(15)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data) {
          setInstitutionName(res.data.institutionName || 'Attendly Institute of Technology')
          setDefaultRadius(res.data.defaultRadiusMeters || 100)
          setDefaultLat(res.data.defaultLatitude || 12.9716)
          setDefaultLng(res.data.defaultLongitude || 77.5946)
          setTokenRotationSeconds(res.data.tokenRotationSeconds || 15)
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
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName,
          defaultRadiusMeters: defaultRadius,
          defaultLatitude: defaultLat,
          defaultLongitude: defaultLng,
          tokenRotationSeconds,
        }),
      })
      if (res.ok) {
        setNotice('Institution settings updated successfully.')
      }
    } catch {
      setNotice('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
          >
            <ArrowLeft className="size-4" /> Back to Overview
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            System & Security Settings
          </h1>
          <p className="text-sm text-slate-500">
            Configure campus geofencing rules and dynamic QR security parameters.
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
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="p-6 border-b border-slate-100">
                <CardTitle className="text-base">Institutional Identity</CardTitle>
                <CardDescription className="text-xs">
                  Campus name and organizational metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Institution Name</label>
                  <Input
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="p-6 border-b border-slate-100">
                <CardTitle className="text-base">Dynamic QR Security Policies</CardTitle>
                <CardDescription className="text-xs">
                  Cryptographic rotation interval and replay defense
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Token Rotation Interval (seconds)
                  </label>
                  <Input
                    type="number"
                    value={tokenRotationSeconds}
                    disabled
                    className="mt-1 font-mono bg-slate-50 text-slate-700"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Enforced at 15 seconds for strict defense against projection capture and proxy scanning.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-white">
              <CardHeader className="p-6 border-b border-slate-100">
                <CardTitle className="text-base">Campus GPS Geofence Defaults</CardTitle>
                <CardDescription className="text-xs">
                  Default coordinates and bounding radius applied to newly created classrooms
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Default Campus Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={defaultLat}
                      onChange={(e) => setDefaultLat(parseFloat(e.target.value))}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Default Campus Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={defaultLng}
                      onChange={(e) => setDefaultLng(parseFloat(e.target.value))}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Default Allowed Distance Radius (meters)
                  </label>
                  <Input
                    type="number"
                    min={10}
                    max={2000}
                    value={defaultRadius}
                    onChange={(e) => setDefaultRadius(parseInt(e.target.value, 10))}
                    className="mt-1"
                    required
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Students farther than this distance when scanning will be blocked by the server.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={saving}
              className="gap-2 bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save Settings
            </Button>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
