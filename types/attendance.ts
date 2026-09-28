export type UserRole = 'admin' | 'teacher' | 'student'
export type AccountStatus = 'active' | 'inactive' | 'suspended'
export type SessionStatus = 'scheduled' | 'active' | 'paused' | 'ended' | 'cancelled'
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused' | 'rejected'

export interface Profile { id: string; fullName: string; email: string; role: UserRole; studentId?: string; employeeId?: string; departmentId?: string; status: AccountStatus }
export interface AttendanceSession { id: string; classId: string; teacherId: string; status: SessionStatus; startedAt: string; endedAt?: string; radiusMeters: number }
export interface AttendanceRecord { id: string; sessionId: string; studentId: string; status: AttendanceStatus; markedAt: string; distanceMeters?: number }
export interface ReportFilters { studentId?: string; teacherId?: string; courseId?: string; classId?: string; departmentId?: string; from?: string; to?: string; status?: AttendanceStatus }

export const roleHome: Record<UserRole, string> = { admin: '/admin', teacher: '/teacher', student: '/student' }
export function isRole(value: unknown): value is UserRole { return value === 'admin' || value === 'teacher' || value === 'student' }
export function roleLabel(role: UserRole) { return role[0].toUpperCase() + role.slice(1) }
