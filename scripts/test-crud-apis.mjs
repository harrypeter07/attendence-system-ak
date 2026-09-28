// Comprehensive End-to-End CRUD and API Route Testing Suite
const BASE_URL = 'http://localhost:3000'

class CookieJar {
  constructor() {
    this.cookies = {}
  }

  update(response) {
    const raw = response.headers.getSetCookie
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter(Boolean)

    for (const c of raw) {
      const parts = c.split(';')[0].split('=')
      const name = parts[0].trim()
      const value = parts.slice(1).join('=').trim()
      this.cookies[name] = value
    }
  }

  header() {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')
  }

  clear() {
    this.cookies = {}
  }
}

let passed = 0
let failed = 0
const results = []

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  ✅ PASS: ${message}`)
    results.push({ message, ok: true })
  } else {
    failed++
    console.error(`  ❌ FAIL: ${message}`)
    results.push({ message, ok: false })
  }
}

async function request(path, options = {}, jar = null) {
  const headers = { ...(options.headers || {}) }
  if (jar && Object.keys(jar.cookies).length > 0) {
    headers['Cookie'] = jar.header()
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (jar) {
    jar.update(res)
  }

  let json = null
  let text = ''
  try {
    text = await res.text()
    json = JSON.parse(text)
  } catch {}

  return { res, json, text, status: res.status }
}

async function runAllTests() {
  console.log('====================================================')
  console.log('🚀 RUNNING PRODUCTION API & CRUD TEST SUITE')
  console.log(`Target: ${BASE_URL}`)
  console.log('====================================================\n')

  const adminJar = new CookieJar()
  const teacherJar = new CookieJar()
  const studentJar = new CookieJar()

  const timestamp = Date.now()

  // ----------------------------------------------------
  // TEST 1: Health Check Endpoint
  // ----------------------------------------------------
  console.log('📌 [TEST GROUP 1] Health & System Status')
  {
    const { status, json } = await request('/api/health')
    assert(status === 200, `GET /api/health returned 200 (Got ${status})`)
    assert(json?.ok === true, 'GET /api/health reports ok: true')
    assert(json?.database?.connected === true, 'Database connection is active and healthy')
  }

  // ----------------------------------------------------
  // TEST 2: Authentication & Auto-Role Identification
  // ----------------------------------------------------
  console.log('\n📌 [TEST GROUP 2] Authentication & Auto-Role Identification')
  {
    // Invalid login attempt
    const invalid = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@attendly.edu', password: 'wrongpassword123' }),
    })
    assert(invalid.status === 401, `Invalid credentials rejected with 401 (Got ${invalid.status})`)

    // Admin login
    const adminLogin = await request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@attendly.edu', password: 'AdminPassword123!' }),
      },
      adminJar
    )
    assert(adminLogin.status === 200, 'Admin login returned 200')
    assert(adminLogin.json?.user?.role === 'admin', 'Admin role automatically identified as "admin"')
    assert(adminLogin.json?.redirectTo === '/admin', 'Admin auto-routes to /admin')

    // Session check for admin
    const adminSession = await request('/api/auth/session', {}, adminJar)
    assert(adminSession.status === 200, 'GET /api/auth/session returns 200')
    assert(adminSession.json?.authenticated === true, 'Admin session is authenticated')
    assert(adminSession.json?.user?.role === 'admin', 'Session verifies admin role')
  }

  // ----------------------------------------------------
  // TEST 3: Admin Dashboard & Settings
  // ----------------------------------------------------
  console.log('\n📌 [TEST GROUP 3] Admin Dashboard & Configuration')
  {
    const dash = await request('/api/admin/dashboard', {}, adminJar)
    assert(dash.status === 200, 'GET /api/admin/dashboard returned 200')
    assert(typeof dash.json?.data?.summary?.totalStudents === 'number', 'Dashboard returns student metrics')
    assert(typeof dash.json?.data?.summary?.totalTeachers === 'number', 'Dashboard returns teacher metrics')

    const settingsGet = await request('/api/admin/settings', {}, adminJar)
    assert(settingsGet.status === 200, 'GET /api/admin/settings returned 200')
    assert(settingsGet.json?.data?.tokenRotationSeconds === 15, 'Default token rotation is 15 seconds')

    const settingsPost = await request(
      '/api/admin/settings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName: 'Attendly Institute of Technology',
          defaultRadiusMeters: 120,
          tokenRotationSeconds: 15,
        }),
      },
      adminJar
    )
    assert(settingsPost.status === 200, 'POST /api/admin/settings updated institution configuration')
  }

  // ----------------------------------------------------
  // TEST 4: Full Admin CRUD Lifecycle (Dept -> Course -> Class -> Student -> Teacher)
  // ----------------------------------------------------
  console.log('\n📌 [TEST GROUP 4] Admin CRUD Operations')
  let testDeptId = null
  let testCourseId = null
  let testClassId = null
  let testStudentId = null
  let testTeacherId = null

  // 4a. Departments CRUD
  {
    const deptList = await request('/api/admin/departments', {}, adminJar)
    assert(deptList.status === 200, 'GET /api/admin/departments returned 200')

    const createDept = await request(
      '/api/admin/departments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `QA Department ${timestamp}`,
          code: `QA${timestamp.toString().slice(-4)}`,
          description: 'Automated CRUD Test Department',
        }),
      },
      adminJar
    )
    assert(createDept.status === 200, 'POST /api/admin/departments created department successfully')
    testDeptId = createDept.json?.data?.id
    assert(Boolean(testDeptId), `Created test department ID: ${testDeptId}`)
  }

  // 4b. Courses CRUD
  if (testDeptId) {
    const courseList = await request('/api/admin/courses', {}, adminJar)
    assert(courseList.status === 200, 'GET /api/admin/courses returned 200')

    const createCourse = await request(
      '/api/admin/courses',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: testDeptId,
          code: `CS${timestamp.toString().slice(-4)}`,
          name: 'Distributed Systems & Verification',
          credits: 4,
          description: 'CRUD Test Course for automated validation',
        }),
      },
      adminJar
    )
    assert(createCourse.status === 200, 'POST /api/admin/courses created course successfully')
    testCourseId = createCourse.json?.data?.id
    assert(Boolean(testCourseId), `Created test course ID: ${testCourseId}`)
  }

  // 4c. Classes CRUD
  if (testCourseId) {
    const classList = await request('/api/admin/classes', {}, adminJar)
    assert(classList.status === 200, 'GET /api/admin/classes returned 200')

    const createClass = await request(
      '/api/admin/classes',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: testCourseId,
          name: 'Section A - Morning',
          semester: 'Fall 2026',
          academicYear: '2026-2027',
          room: 'Hall 404',
          capacity: 60,
          latitude: 12.9716,
          longitude: 77.5946,
          radiusMeters: 100,
        }),
      },
      adminJar
    )
    assert(createClass.status === 200, 'POST /api/admin/classes created class section with GPS geofence')
    testClassId = createClass.json?.data?.id
    assert(Boolean(testClassId), `Created test class ID: ${testClassId}`)
  }

  // 4d. Students CRUD
  {
    const studentList = await request('/api/admin/students', {}, adminJar)
    assert(studentList.status === 200, 'GET /api/admin/students returned 200')

    const studentEmail = `qa.student.${timestamp}@attendly.edu`
    const createStudent = await request(
      '/api/admin/students',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'QA Automated Student',
          email: studentEmail,
          password: 'Password123!',
          studentId: `STU-${timestamp.toString().slice(-5)}`,
          departmentId: testDeptId,
          phone: '+1-555-0199',
        }),
      },
      adminJar
    )
    assert(createStudent.status === 200, 'POST /api/admin/students created student account')
    testStudentId = createStudent.json?.data?.id
    assert(Boolean(testStudentId), `Created test student ID: ${testStudentId}`)

    // Update student (PATCH)
    if (testStudentId) {
      const patchStudent = await request(
        '/api/admin/students',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: testStudentId,
            fullName: 'QA Automated Student (Verified)',
            phone: '+1-555-0200',
          }),
        },
        adminJar
      )
      assert(patchStudent.status === 200, 'PATCH /api/admin/students updated student profile')
    }
  }

  // 4e. Teachers CRUD & Assignment
  {
    const teacherList = await request('/api/admin/teachers', {}, adminJar)
    assert(teacherList.status === 200, 'GET /api/admin/teachers returned 200')

    const teacherEmail = `qa.teacher.${timestamp}@attendly.edu`
    const createTeacher = await request(
      '/api/admin/teachers',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Prof. QA Automated',
          email: teacherEmail,
          password: 'Password123!',
          employeeId: `FAC-${timestamp.toString().slice(-4)}`,
          departmentId: testDeptId,
        }),
      },
      adminJar
    )
    assert(createTeacher.status === 200, 'POST /api/admin/teachers created faculty account')
    testTeacherId = createTeacher.json?.data?.id
    assert(Boolean(testTeacherId), `Created test teacher ID: ${testTeacherId}`)

    // Assign teacher to class
    if (testTeacherId && testClassId) {
      const assign = await request(
        '/api/admin/teacher-assignments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherId: testTeacherId,
            classId: testClassId,
            isPrimary: true,
          }),
        },
        adminJar
      )
      assert(assign.status === 200, 'POST /api/admin/teacher-assignments assigned teacher to class')

      const assignmentsList = await request('/api/admin/teacher-assignments', {}, adminJar)
      assert(assignmentsList.status === 200, 'GET /api/admin/teacher-assignments returned 200')
    }
  }

  // 4f. Enrollments CRUD
  if (testStudentId && testClassId) {
    const enroll = await request(
      '/api/admin/enrollments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: testStudentId,
          classId: testClassId,
        }),
      },
      adminJar
    )
    assert(enroll.status === 200, 'POST /api/admin/enrollments enrolled student into class')

    const enrollList = await request('/api/admin/enrollments', {}, adminJar)
    assert(enrollList.status === 200, 'GET /api/admin/enrollments returned 200')
  }

  // 4g. Reports & CSV Export
  {
    const reportsJson = await request('/api/admin/reports', {}, adminJar)
    assert(reportsJson.status === 200, 'GET /api/admin/reports returned 200')
    assert(Array.isArray(reportsJson.json?.data?.records), 'Reports returned array of records')

    const reportsCsv = await request('/api/admin/reports?format=csv', {}, adminJar)
    assert(reportsCsv.status === 200, 'GET /api/admin/reports?format=csv returned 200')
    assert(reportsCsv.text.includes('Student Name,Student ID'), 'Reports CSV export contains valid CSV headers')

    const auditLogs = await request('/api/admin/audit-logs', {}, adminJar)
    assert(auditLogs.status === 200, 'GET /api/admin/audit-logs returned 200')
    assert(Array.isArray(auditLogs.json?.data), 'Audit logs contains historical operations')
  }

  // ----------------------------------------------------
  // TEST 5: Teacher Flow (Live Session Creation & 15s Dynamic QR Token)
  // ----------------------------------------------------
  console.log('\n📌 [TEST GROUP 5] Teacher Attendance Broadcasting & Dynamic Token Rotation')
  let liveSessionId = null
  let dynamicToken = null
  {
    // Login as Teacher
    const teacherLogin = await request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'teacher@attendly.edu', password: 'TeacherPassword123!' }),
      },
      teacherJar
    )
    assert(teacherLogin.status === 200, 'Teacher login returned 200')
    assert(teacherLogin.json?.user?.role === 'teacher', 'Role auto-identified as "teacher"')
    assert(teacherLogin.json?.redirectTo === '/teacher', 'Teacher auto-routes to /teacher')

    const teacherClasses = await request('/api/teacher/classes', {}, teacherJar)
    assert(teacherClasses.status === 200, 'GET /api/teacher/classes returned 200')
    const activeClass = teacherClasses.json?.data?.[0]
    assert(Boolean(activeClass), 'Teacher has at least 1 assigned class')

    const teacherSessions = await request('/api/teacher/sessions', {}, teacherJar)
    assert(teacherSessions.status === 200, 'GET /api/teacher/sessions returned 200')

    // Start a new live attendance session
    if (activeClass) {
      const createSession = await request(
        '/api/teacher/sessions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: activeClass.id,
            durationMinutes: 30,
            latitude: Number(activeClass.location?.latitude) || 12.9716,
            longitude: Number(activeClass.location?.longitude) || 77.5946,
            radiusMeters: Number(activeClass.location?.radius_meters) || 100,
          }),
        },
        teacherJar
      )
      assert(createSession.status === 200, 'POST /api/teacher/sessions started a new attendance session')
      liveSessionId = createSession.json?.data?.sessionId || createSession.json?.data?.id
      assert(Boolean(liveSessionId), `Live session ID: ${liveSessionId}`)

      // Fetch live session details
      const sessionDetails = await request(`/api/teacher/sessions/${liveSessionId}`, {}, teacherJar)
      assert(sessionDetails.status === 200, `GET /api/teacher/sessions/${liveSessionId} returned 200`)
      assert(sessionDetails.json?.data?.status === 'active', 'Session is actively receiving scans')

      // Fetch dynamic 15s rotating token
      const tokenRes = await request(`/api/teacher/sessions/${liveSessionId}/token`, {}, teacherJar)
      assert(tokenRes.status === 200, `GET /api/teacher/sessions/${liveSessionId}/token returned 200`)
      assert(Boolean(tokenRes.json?.data?.token), 'Server returned cryptographic rotating token')
      assert(typeof tokenRes.json?.data?.remainingSeconds === 'number', 'Token includes countdown remaining seconds')
      dynamicToken = tokenRes.json?.data?.token
    }
  }

  // ----------------------------------------------------
  // TEST 6: Student Verification & Geofence Enforcement
  // ----------------------------------------------------
  console.log('\n📌 [TEST GROUP 6] Student Scanner, Geofencing & Verification Engine')
  {
    // Login as Student
    const studentLogin = await request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@attendly.edu', password: 'StudentPassword123!' }),
      },
      studentJar
    )
    assert(studentLogin.status === 200, 'Student login returned 200')
    assert(studentLogin.json?.user?.role === 'student', 'Role auto-identified as "student"')
    assert(studentLogin.json?.redirectTo === '/student', 'Student auto-routes to /student')

    const studentDash = await request('/api/student/dashboard', {}, studentJar)
    assert(studentDash.status === 200, 'GET /api/student/dashboard returned 200')

    const studentCourses = await request('/api/student/courses', {}, studentJar)
    assert(studentCourses.status === 200, 'GET /api/student/courses returned 200')

    const studentAttendance = await request('/api/student/attendance', {}, studentJar)
    assert(studentAttendance.status === 200, 'GET /api/student/attendance returned 200')

    const studentProfile = await request('/api/student/profile', {}, studentJar)
    assert(studentProfile.status === 200, 'GET /api/student/profile returned 200')

    const patchProfile = await request(
      '/api/student/profile',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1-555-0808' }),
      },
      studentJar
    )
    assert(patchProfile.status === 200, 'PATCH /api/student/profile updated student telephone')

    // Verification Test 1: Geofence violation (Student coordinates 50km away)
    if (liveSessionId && dynamicToken) {
      const farAwayVerify = await request(
        '/api/attendance/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: liveSessionId,
            token: dynamicToken,
            latitude: 13.5000, // ~60km away
            longitude: 77.9000,
          }),
        },
        studentJar
      )
      assert(
        farAwayVerify.status === 403 || farAwayVerify.json?.ok === false,
        `Geofence violation rejected correctly (Distance out of bounds)`
      )

      // Verification Test 2: In-range coordinates (Classroom coordinates: 12.9716, 77.5946)
      const validVerify = await request(
        '/api/attendance/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: liveSessionId,
            token: dynamicToken,
            latitude: 12.9716,
            longitude: 77.5946,
          }),
        },
        studentJar
      )
      assert(
        validVerify.status === 200 && validVerify.json?.ok === true,
        'Valid QR scan with GPS coordinates verified and recorded into database'
      )

      // Verification Test 3: Duplicate scan prevention
      const duplicateVerify = await request(
        '/api/attendance/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: liveSessionId,
            token: dynamicToken,
            latitude: 12.9716,
            longitude: 77.5946,
          }),
        },
        studentJar
      )
      assert(
        duplicateVerify.status === 409 || duplicateVerify.json?.ok === false,
        'Duplicate scan rejected with conflict: Attendance already recorded'
      )
    }
  }

  // ----------------------------------------------------
  // TEST 7: Teacher Ends Session & General Attendance Feed
  // ----------------------------------------------------
  console.log('\n📌 [TEST GROUP 7] Teacher Session Finalization & Global Attendance Feed')
  if (liveSessionId) {
    const endSession = await request(
      `/api/teacher/sessions/${liveSessionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      },
      teacherJar
    )
    assert(endSession.status === 200, `Teacher ended live attendance session ${liveSessionId}`)

    // Test GET /api/attendance general feed
    const globalAttendance = await request('/api/attendance', {}, adminJar)
    assert(globalAttendance.status === 200, 'GET /api/attendance returned recent sessions feed')
  }

  // ----------------------------------------------------
  // TEST 8: Cleanup Test Department & Course
  // ----------------------------------------------------
  console.log('\n📌 [TEST GROUP 8] CRUD Cleanup')
  if (testClassId) {
    const delClass = await request(`/api/admin/classes?id=${testClassId}`, { method: 'DELETE' }, adminJar)
    assert(delClass.status === 200, `Deleted test class ${testClassId}`)
  }
  if (testCourseId) {
    const delCourse = await request(`/api/admin/courses?id=${testCourseId}`, { method: 'DELETE' }, adminJar)
    assert(delCourse.status === 200, `Deleted test course ${testCourseId}`)
  }
  if (testDeptId) {
    const delDept = await request(`/api/admin/departments?id=${testDeptId}`, { method: 'DELETE' }, adminJar)
    assert(delDept.status === 200, `Deleted test department ${testDeptId}`)
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================')
  console.log(`📊 TEST EXECUTION COMPLETE`)
  console.log(`Total Checks: ${passed + failed}`)
  console.log(`Passed:       ${passed}`)
  console.log(`Failed:       ${failed}`)
  console.log('====================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err)
  process.exit(1)
})
