export type AttendanceStatus = 'Present' | 'Late' | 'Absent'

export const summaryStats = [
  { label: 'Total students', value: '2,847', change: '+8.2%', detail: 'vs last month', tone: 'blue' },
  { label: 'Attendance today', value: '94.6%', change: '+2.4%', detail: 'vs yesterday', tone: 'green' },
  { label: 'Active sessions', value: '12', change: 'Live now', detail: 'across 8 classes', tone: 'violet' },
  { label: 'At risk students', value: '86', change: '-6.1%', detail: 'needs attention', tone: 'amber' },
] as const

export const attendanceTrend = [
  { day: 'Mon', value: 88 }, { day: 'Tue', value: 93 }, { day: 'Wed', value: 91 },
  { day: 'Thu', value: 96 }, { day: 'Fri', value: 94 }, { day: 'Sat', value: 72 }, { day: 'Sun', value: 0 },
]

export const recentSessions = [
  { course: 'Advanced Mathematics', code: 'MATH-302', teacher: 'Dr. Sarah Wilson', time: '10:00 AM', present: 42, total: 45, status: 'Active' },
  { course: 'Database Systems', code: 'CS-408', teacher: 'Prof. Michael Chen', time: '09:30 AM', present: 38, total: 40, status: 'Active' },
  { course: 'Human Computer Interaction', code: 'DES-210', teacher: 'Emily Rodriguez', time: '09:00 AM', present: 31, total: 34, status: 'Completed' },
  { course: 'Business Analytics', code: 'BUS-114', teacher: 'James Bennett', time: '08:30 AM', present: 27, total: 30, status: 'Completed' },
]

export const activities = [
  { initials: 'SW', name: 'Sarah Wilson', action: 'started a new attendance session', time: '2 min ago', color: 'bg-blue-100 text-blue-700' },
  { initials: 'MC', name: 'Michael Chen', action: 'exported an attendance report', time: '18 min ago', color: 'bg-violet-100 text-violet-700' },
  { initials: 'ER', name: 'Emily Rodriguez', action: 'updated class enrollment', time: '42 min ago', color: 'bg-emerald-100 text-emerald-700' },
  { initials: 'JB', name: 'James Bennett', action: 'ended a session', time: '1 hr ago', color: 'bg-amber-100 text-amber-700' },
]

export const navGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', icon: 'LayoutDashboard' }] },
  { label: 'Management', items: [{ label: 'Students', icon: 'GraduationCap' }, { label: 'Teachers', icon: 'Users' }, { label: 'Departments', icon: 'Building2' }, { label: 'Courses & Classes', icon: 'BookOpen' }] },
  { label: 'Attendance', items: [{ label: 'Sessions', icon: 'CalendarCheck' }, { label: 'Reports', icon: 'FileBarChart' }, { label: 'Analytics', icon: 'ChartNoAxesCombined' }] },
  { label: 'System', items: [{ label: 'Audit logs', icon: 'ShieldCheck' }, { label: 'Settings', icon: 'Settings2' }] },
]

export const lowAttendanceStudents = [
  { name: 'Marcus Thompson', id: 'STU-20481', course: 'Database Systems', percent: 61 },
  { name: 'Ava Martinez', id: 'STU-19302', course: 'Advanced Mathematics', percent: 67 },
  { name: 'Noah Williams', id: 'STU-21094', course: 'Business Analytics', percent: 69 },
]

export const formatPercent = (present: number, total: number) => `${Math.round((present / total) * 100)}%`

export const statusClass: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Late: 'bg-amber-50 text-amber-700 border-amber-200',
  Absent: 'bg-rose-50 text-rose-700 border-rose-200',
}
