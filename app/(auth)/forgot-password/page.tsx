import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
export default function ForgotPasswordPage() { return <main className="flex min-h-screen items-center justify-center bg-[#0d172b] p-5"><Card className="w-full max-w-md bg-white"><CardHeader><Link href="/login" className="mb-4 flex items-center gap-2 text-sm text-slate-500"><ArrowLeft className="size-4" /> Back to sign in</Link><CardTitle>Reset your password</CardTitle><CardDescription>Enter your institution email and we&apos;ll send a secure reset link.</CardDescription></CardHeader><CardContent><form className="flex flex-col gap-4"><label className="flex flex-col gap-2 text-sm font-medium" htmlFor="email">Email address<div className="relative"><Mail className="absolute left-3 top-3 size-4 text-slate-400" /><Input id="email" type="email" className="pl-10" required /></div></label><Button type="submit">Send reset link</Button></form></CardContent></Card></main> }
