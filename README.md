# attendence-app

> **Attendly**: Next-Generation Smart QR Attendance System with 15-Second Dynamic Cryptographic Rotation and GPS Geofencing.

**Live Deployment**: [https://attendion.vercel.app](https://attendion.vercel.app)

---

## 🔑 Default Institutional Credentials

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@attendly.edu` | `AdminPassword123!` | Institution Dashboard, Student & Teacher CRUD, Reports, Audit Logs |
| **Teacher** | `teacher@attendly.edu` | `TeacherPassword123!` | Dynamic 15s QR Session Launcher, Live Attendee Roster, Class Reports |
| **Student** | `student@attendly.edu` | `StudentPassword123!` | Mobile Camera QR Scanner, GPS Geofence Verification, Attendance History |
| **Student 2** | `student2@attendly.edu` | `StudentPassword123!` | Additional enrolled student |
| **Student 3** | `student3@attendly.edu` | `StudentPassword123!` | Additional enrolled student |

*(One-click demo login buttons are also available directly on the login page!)*

---

## ⚡ Key Production Features

1. **15-Second Dynamic Rotating QR Code**:
   - Cryptographically secure server-generated tokens hashed with SHA-256 in PostgreSQL.
   - Rotates automatically every 15 seconds on the teacher's live screen.
   - Prevents screenshot sharing, proxy attendance, and replay attacks.

2. **GPS Geofence Verification**:
   - Calculates real-time Haversine distance between student GPS and classroom coordinates.
   - Automatically blocks and logs scans originating outside the configured radius (e.g., 100 meters).

3. **Database-Level Duplicate Prevention**:
   - Strict `UNIQUE(session_id, student_id)` database constraint guarantees no duplicate check-ins.

4. **Multi-Role Workspaces**:
   - **Admin Workspace (`/admin`)**: Institutional analytics, user CRUD, class enrollments, faculty assignments, system settings, immutable audit logs.
   - **Teacher Workspace (`/teacher`)**: Class management, GPS session launcher, live dynamic QR room with real-time attendee feed, CSV exports.
   - **Student Workspace (`/student`)**: Mobile camera QR scanner (`html5-qrcode`), location verification feedback, attendance history, course attendance percentages.

---

## ⚙️ Google OAuth & Supabase Setup Guide

### 1. Google Cloud Console Configuration
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Create or select a project and configure the **OAuth consent screen** (External).
3. Create credentials: **OAuth 2.0 Client ID** -> Application Type: **Web application**.
4. Set **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://attendion.vercel.app`
   - `https://rqllmdgejuhbmywjiadf.supabase.co`
5. Set **Authorized redirect URIs**:
   - `https://rqllmdgejuhbmywjiadf.supabase.co/auth/v1/callback`
6. Copy the **Client ID** and **Client Secret**.

### 2. Supabase Dashboard Configuration
1. In your Supabase dashboard (`rqllmdgejuhbmywjiadf`):
2. Navigate to **Authentication** -> **Providers** -> **Google**.
3. Toggle **Enable Google provider** to `ON`.
4. Paste the **Client ID** and **Client Secret** from Google Cloud Console.
5. In **Authentication** -> **URL Configuration**:
   - **Site URL**: `https://attendion.vercel.app`
   - **Redirect URLs**:
     - `http://localhost:3000/**`
     - `http://localhost:3000/auth/callback`
     - `https://attendion.vercel.app/**`
     - `https://attendion.vercel.app/auth/callback`
6. Click **Save**.

---

## 🚀 Environment Variables (Vercel & Local)

Configure the following in `.env.local` or Vercel Project Settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rqllmdgejuhbmywjiadf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=your-supabase-postgres-connection-string
NEXT_PUBLIC_SITE_URL=https://attendion.vercel.app
```
