'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Camera,
  Check,
  ChevronDown,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Settings2,
  ShieldCheck,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface UserButtonUser {
  id?: string
  email: string
  fullName: string
  role: string
  avatarUrl?: string | null
  studentId?: string
  employeeId?: string
}

interface UserButtonProps {
  user: UserButtonUser | null
  onAvatarUpdate?: (newAvatarUrl: string) => void
}

export function UserButton({ user, onAvatarUpdate }: UserButtonProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const role = user?.role || 'student'
  const roleLabel =
    role === 'admin'
      ? 'Administrator'
      : role === 'teacher'
      ? 'Faculty Instructor'
      : 'Student'

  const roleBadgeStyle =
    role === 'admin'
      ? 'bg-rose-500/10 text-rose-700 border-rose-200'
      : role === 'teacher'
      ? 'bg-violet-500/10 text-violet-700 border-violet-200'
      : 'bg-emerald-500/10 text-emerald-700 border-emerald-200'

  const profileHref =
    role === 'admin'
      ? '/admin/settings'
      : role === 'teacher'
      ? '/teacher/profile'
      : '/student/profile'

  const initials = (user?.fullName || role)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Handle local file selection and convert to clean data URL
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploadSuccess(false)

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Resize image to max 400x400 to keep performance blazing fast
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setPreviewUrl(compressedDataUrl)
        } else {
          setPreviewUrl(reader.result as string)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  // Save uploaded photo to profile via unified /api/profile endpoint
  async function handleSavePhoto() {
    if (!previewUrl) return
    setUploading(true)
    setUploadError('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: previewUrl }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        setUploadSuccess(true)
        if (onAvatarUpdate) {
          onAvatarUpdate(previewUrl)
        }
        setTimeout(() => {
          setUploadModalOpen(false)
          setPreviewUrl(null)
          setUploadSuccess(false)
        }, 800)
      } else {
        setUploadError(data.message || 'Failed to update photo.')
      }
    } catch {
      setUploadError('Network error while saving photo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      router.push('/login')
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button Trigger */}
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="group flex items-center gap-2 rounded-full p-1 text-left transition-all hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#6558ee]/40"
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <div className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-200 transition-all group-hover:ring-[#6558ee]">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName || 'User Avatar'}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-tr from-[#6558ee] to-[#8c82f8] font-bold text-white text-xs shadow-inner">
              {initials}
            </div>
          )}
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        <div className="hidden text-left xl:block">
          <p className="max-w-[120px] truncate text-xs font-bold text-slate-800">
            {user?.fullName || roleLabel}
          </p>
          <p className="text-[10px] capitalize text-slate-500">{role}</p>
        </div>

        <ChevronDown className="hidden size-3.5 text-slate-400 transition-transform xl:block group-hover:text-slate-600" />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 top-12 z-50 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95">
          {/* Profile Card Header */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#6558ee]/30">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || 'Avatar'}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-tr from-[#6558ee] to-[#8c82f8] font-bold text-white text-sm">
                  {initials}
                </div>
              )}
              {/* Quick camera overlay */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setUploadModalOpen(true)
                }}
                title="Change Photo"
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100"
              >
                <Camera className="size-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.fullName || roleLabel}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold border ${roleBadgeStyle}`}
                >
                  {roleLabel}
                </span>
                {(user?.studentId || user?.employeeId) && (
                  <span className="font-mono text-[10px] text-slate-500">
                    ID: {user.studentId || user.employeeId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Photo Upload Button */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setUploadModalOpen(true)
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#6558ee] bg-[#6558ee]/5 hover:bg-[#6558ee]/10 transition-colors"
            >
              <Camera className="size-4 text-[#6558ee]" />
              <span>{user?.avatarUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}</span>
            </button>
          </div>

          <div className="h-px bg-slate-100 my-1" />

          {/* Nav Links */}
          <div className="space-y-0.5 p-1">
            <Link
              href={profileHref}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <User className="size-4 text-slate-400" />
              <span>Manage Profile</span>
            </Link>

            {role === 'admin' && (
              <Link
                href="/admin/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Settings2 className="size-4 text-slate-400" />
                <span>System Settings</span>
              </Link>
            )}
          </div>

          <div className="h-px bg-slate-100 my-1" />

          {/* Logout */}
          <div className="p-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="size-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-[#6558ee]/10 text-[#6558ee]">
                  <Camera className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Profile Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadModalOpen(false)
                  setPreviewUrl(null)
                  setUploadError('')
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center">
              {/* Photo Preview Circle */}
              <div className="relative size-28 overflow-hidden rounded-full ring-4 ring-[#6558ee]/20 shadow-md">
                {previewUrl || user?.avatarUrl ? (
                  <img
                    src={previewUrl || user?.avatarUrl || ''}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-slate-100 text-slate-400">
                    <User className="size-12" />
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="mt-3 text-center text-xs font-medium text-rose-600">{uploadError}</p>
              )}

              {uploadSuccess && (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <Check className="size-4" /> Photo updated successfully!
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mt-5 flex w-full flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full gap-2 border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Upload className="size-3.5" /> Select Photo from Device
                </Button>

                {previewUrl && (
                  <Button
                    type="button"
                    onClick={handleSavePhoto}
                    disabled={uploading}
                    className="w-full gap-2 bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" /> Save Photo
                      </>
                    )}
                  </Button>
                )}
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-400">
                Your photo will be visible to your instructors during classroom attendance verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
