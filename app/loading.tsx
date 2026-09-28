import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() { return <main className="min-h-screen bg-[#f7f9fc] p-8"><div className="mx-auto flex max-w-6xl flex-col gap-6"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-96" /><div className="grid gap-4 sm:grid-cols-3">{[1,2,3].map((item) => <Skeleton key={item} className="h-32 rounded-xl" />)}</div><Skeleton className="h-80 rounded-xl" /></div></main> }
