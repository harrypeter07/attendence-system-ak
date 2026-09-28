'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { /* Report sanitized error metadata to an observability service when connected. */ }, []); return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] p-6"><div className="max-w-md text-center"><AlertTriangle className="mx-auto size-10 text-amber-500" /><h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1><p className="mt-2 text-sm text-slate-500">We couldn&apos;t load this workspace. Try again or return to the dashboard.</p><Button className="mt-6" onClick={reset}><RefreshCcw data-icon="inline-start" /> Try again</Button></div></main> }
