'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/admin/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setLogs(data.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(query.toLowerCase()) ||
      l.actorName.toLowerCase().includes(query.toLowerCase()) ||
      l.entityType.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
          >
            <ArrowLeft className="size-4" /> Back to Overview
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Security & System Audit Logs
          </h1>
          <p className="text-sm text-slate-500">
            Immutable log of logins, session events, geofence breaches, and administrative changes.
          </p>
        </div>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-slate-100">
            <div>
              <CardTitle className="text-base">Logged Events ({logs.length})</CardTitle>
              <CardDescription className="text-xs">Chronological security ledger</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Search action or actor..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-[#6558ee]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No audit logs recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Actor</th>
                      <th className="px-5 py-3.5">Entity</th>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-700">
                          {log.actorName}
                          <span className="block text-[11px] text-slate-400 font-normal">{log.actorRole}</span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {log.entityType}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              log.success
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.success ? <CheckCircle2 className="size-3" /> : <ShieldAlert className="size-3" />}
                            {log.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
