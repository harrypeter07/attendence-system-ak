import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.rqllmdgejuhbmywjiadf:Hassantiya%401505@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
const supabaseUrl = 'https://rqllmdgejuhbmywjiadf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxbGxtZGdlanVoYm15d2ppYWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDU0MDg1MiwiZXhwIjoyMTA2MTE2ODUyfQ.94yaV1htZ9iPnblY5T9loYMsoCQZYP8FLZ-WN7KppJI'

const sql = postgres(connectionString, { ssl: 'require' })
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('--- Applying Database Schema ---')
  
  await sql.unsafe(`
    create extension if not exists pgcrypto;

    do $$ begin create type public.app_role as enum ('admin','teacher','student'); exception when duplicate_object then null; end $$;
    do $$ begin create type public.account_status as enum ('active','inactive','suspended'); exception when duplicate_object then null; end $$;
    do $$ begin create type public.session_status as enum ('scheduled','active','paused','ended','cancelled'); exception when duplicate_object then null; end $$;
    do $$ begin create type public.attendance_status as enum ('present','late','absent','excused','rejected'); exception when duplicate_object then null; end $$;

    create table if not exists public.departments (
      id uuid primary key default gen_random_uuid(),
      name text not null unique,
      code text not null unique,
      description text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists public.profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      full_name text not null,
      email text not null,
      role public.app_role not null default 'student',
      student_id text unique,
      employee_id text unique,
      department_id uuid references public.departments(id) on delete set null,
      avatar_url text,
      phone text,
      status public.account_status not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists public.courses (
      id uuid primary key default gen_random_uuid(),
      department_id uuid not null references public.departments(id) on delete restrict,
      code text not null,
      name text not null,
      credits smallint not null default 3 check (credits > 0),
      description text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(department_id, code)
    );

    create table if not exists public.classes (
      id uuid primary key default gen_random_uuid(),
      course_id uuid not null references public.courses(id) on delete cascade,
      name text not null,
      room text,
      semester text not null,
      academic_year text not null,
      capacity integer check (capacity is null or capacity > 0),
      created_at timestamptz not null default now(),
      unique(course_id, name, semester, academic_year)
    );

    create table if not exists public.enrollments (
      id uuid primary key default gen_random_uuid(),
      class_id uuid not null references public.classes(id) on delete cascade,
      student_id uuid not null references public.profiles(id) on delete cascade,
      status public.account_status not null default 'active',
      enrolled_at timestamptz not null default now(),
      unique(class_id, student_id)
    );

    create table if not exists public.teacher_assignments (
      id uuid primary key default gen_random_uuid(),
      class_id uuid not null references public.classes(id) on delete cascade,
      teacher_id uuid not null references public.profiles(id) on delete cascade,
      assigned_at timestamptz not null default now(),
      unique(class_id, teacher_id)
    );

    create table if not exists public.attendance_sessions (
      id uuid primary key default gen_random_uuid(),
      class_id uuid not null references public.classes(id) on delete restrict,
      teacher_id uuid not null references public.profiles(id) on delete restrict,
      status public.session_status not null default 'active',
      started_at timestamptz not null default now(),
      ended_at timestamptz,
      latitude numeric(9,6) not null default 0,
      longitude numeric(9,6) not null default 0,
      radius_meters integer not null default 100 check(radius_meters between 5 and 5000),
      created_at timestamptz not null default now()
    );

    create table if not exists public.attendance_tokens (
      id uuid primary key default gen_random_uuid(),
      session_id uuid not null references public.attendance_sessions(id) on delete cascade,
      token_hash text not null unique,
      valid_from timestamptz not null default now(),
      valid_until timestamptz not null,
      consumed_at timestamptz,
      created_at timestamptz not null default now(),
      check(valid_until > valid_from)
    );

    create table if not exists public.attendance_records (
      id uuid primary key default gen_random_uuid(),
      session_id uuid not null references public.attendance_sessions(id) on delete restrict,
      student_id uuid not null references public.profiles(id) on delete restrict,
      status public.attendance_status not null,
      marked_at timestamptz not null default now(),
      distance_meters numeric(8,2),
      student_latitude numeric(9,6),
      student_longitude numeric(9,6),
      source text not null default 'qr',
      note text,
      unique(session_id, student_id)
    );

    create table if not exists public.attendance_attempts (
      id uuid primary key default gen_random_uuid(),
      session_id uuid references public.attendance_sessions(id) on delete set null,
      student_id uuid references public.profiles(id) on delete set null,
      token_id uuid references public.attendance_tokens(id) on delete set null,
      success boolean not null,
      reason text,
      distance_meters numeric(8,2),
      attempted_at timestamptz not null default now()
    );

    create table if not exists public.location_settings (
      id uuid primary key default gen_random_uuid(),
      class_id uuid unique references public.classes(id) on delete cascade,
      latitude numeric(9,6) not null,
      longitude numeric(9,6) not null,
      radius_meters integer not null default 100 check(radius_meters between 5 and 5000),
      updated_at timestamptz not null default now()
    );

    create table if not exists public.audit_logs (
      id uuid primary key default gen_random_uuid(),
      actor_id uuid references public.profiles(id) on delete set null,
      action text not null,
      entity_type text not null,
      entity_id uuid,
      success boolean not null default true,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists public.notifications (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.profiles(id) on delete cascade,
      title text not null,
      body text not null,
      read_at timestamptz,
      created_at timestamptz not null default now()
    );

    -- Indexes
    create index if not exists idx_profiles_role on public.profiles(role);
    create index if not exists idx_enrollments_student on public.enrollments(student_id);
    create index if not exists idx_assignments_teacher on public.teacher_assignments(teacher_id);
    create index if not exists idx_sessions_teacher_status on public.attendance_sessions(teacher_id, status);
    create index if not exists idx_sessions_started_at on public.attendance_sessions(started_at desc);
    create index if not exists idx_records_student_marked on public.attendance_records(student_id, marked_at desc);
    create index if not exists idx_records_session on public.attendance_records(session_id);
    create index if not exists idx_tokens_session_valid on public.attendance_tokens(session_id, valid_until desc);
    create index if not exists idx_attempts_session_time on public.attendance_attempts(session_id, attempted_at desc);
    create index if not exists idx_audit_created on public.audit_logs(created_at desc);

    -- Helper functions (SECURITY DEFINER to prevent recursive RLS)
    create or replace function public.is_admin(uid uuid default auth.uid())
    returns boolean language plpgsql security definer set search_path = public as $$
    begin
      return exists (
        select 1 from public.profiles
        where id = coalesce(uid, auth.uid()) and role = 'admin' and status = 'active'
      );
    end;
    $$;

    create or replace function public.is_teacher(uid uuid default auth.uid())
    returns boolean language plpgsql security definer set search_path = public as $$
    begin
      return exists (
        select 1 from public.profiles
        where id = coalesce(uid, auth.uid()) and role = 'teacher' and status = 'active'
      );
    end;
    $$;

    create or replace function public.is_student(uid uuid default auth.uid())
    returns boolean language plpgsql security definer set search_path = public as $$
    begin
      return exists (
        select 1 from public.profiles
        where id = coalesce(uid, auth.uid()) and role = 'student' and status = 'active'
      );
    end;
    $$;

    -- Enable RLS
    alter table public.departments enable row level security;
    alter table public.profiles enable row level security;
    alter table public.courses enable row level security;
    alter table public.classes enable row level security;
    alter table public.enrollments enable row level security;
    alter table public.teacher_assignments enable row level security;
    alter table public.attendance_sessions enable row level security;
    alter table public.attendance_tokens enable row level security;
    alter table public.attendance_records enable row level security;
    alter table public.attendance_attempts enable row level security;
    alter table public.location_settings enable row level security;
    alter table public.audit_logs enable row level security;
    alter table public.notifications enable row level security;

    -- Clean up existing policies if any
    drop policy if exists "profiles read" on public.profiles;
    drop policy if exists "profiles admin manage" on public.profiles;
    drop policy if exists "departments authenticated read" on public.departments;
    drop policy if exists "departments admin manage" on public.departments;
    drop policy if exists "courses authenticated read" on public.courses;
    drop policy if exists "courses admin manage" on public.courses;
    drop policy if exists "classes authenticated read" on public.classes;
    drop policy if exists "classes admin manage" on public.classes;
    drop policy if exists "enrollments read" on public.enrollments;
    drop policy if exists "enrollments admin manage" on public.enrollments;
    drop policy if exists "assignments read" on public.teacher_assignments;
    drop policy if exists "assignments admin manage" on public.teacher_assignments;
    drop policy if exists "sessions read" on public.attendance_sessions;
    drop policy if exists "teachers manage sessions" on public.attendance_sessions;
    drop policy if exists "records read" on public.attendance_records;
    drop policy if exists "audit read" on public.audit_logs;
    drop policy if exists "location read" on public.location_settings;
    drop policy if exists "location manage" on public.location_settings;

    -- RLS Policies
    create policy "profiles read" on public.profiles
      for select to authenticated
      using (id = (select auth.uid()) or public.is_admin() or public.is_teacher());

    create policy "profiles admin manage" on public.profiles
      for all to authenticated
      using (public.is_admin())
      with check (public.is_admin());

    create policy "departments authenticated read" on public.departments
      for select to authenticated using (true);

    create policy "departments admin manage" on public.departments
      for all to authenticated
      using (public.is_admin())
      with check (public.is_admin());

    create policy "courses authenticated read" on public.courses
      for select to authenticated using (true);

    create policy "courses admin manage" on public.courses
      for all to authenticated
      using (public.is_admin())
      with check (public.is_admin());

    create policy "classes authenticated read" on public.classes
      for select to authenticated using (true);

    create policy "classes admin manage" on public.classes
      for all to authenticated
      using (public.is_admin())
      with check (public.is_admin());

    create policy "enrollments read" on public.enrollments
      for select to authenticated
      using (
        student_id = (select auth.uid())
        or public.is_admin()
        or exists (select 1 from public.teacher_assignments ta where ta.class_id = enrollments.class_id and ta.teacher_id = (select auth.uid()))
      );

    create policy "enrollments admin manage" on public.enrollments
      for all to authenticated
      using (public.is_admin())
      with check (public.is_admin());

    create policy "assignments read" on public.teacher_assignments
      for select to authenticated
      using (teacher_id = (select auth.uid()) or public.is_admin());

    create policy "assignments admin manage" on public.teacher_assignments
      for all to authenticated
      using (public.is_admin())
      with check (public.is_admin());

    create policy "sessions read" on public.attendance_sessions
      for select to authenticated
      using (
        teacher_id = (select auth.uid())
        or public.is_admin()
        or exists (select 1 from public.enrollments e where e.class_id = attendance_sessions.class_id and e.student_id = (select auth.uid()))
      );

    create policy "teachers manage sessions" on public.attendance_sessions
      for all to authenticated
      using (teacher_id = (select auth.uid()) or public.is_admin())
      with check (teacher_id = (select auth.uid()) or public.is_admin());

    create policy "records read" on public.attendance_records
      for select to authenticated
      using (
        student_id = (select auth.uid())
        or public.is_admin()
        or exists (select 1 from public.attendance_sessions s where s.id = attendance_records.session_id and s.teacher_id = (select auth.uid()))
      );

    create policy "location read" on public.location_settings
      for select to authenticated using (true);

    create policy "location manage" on public.location_settings
      for all to authenticated
      using (public.is_admin() or public.is_teacher())
      with check (public.is_admin() or public.is_teacher());

    create policy "audit read" on public.audit_logs
      for select to authenticated
      using (public.is_admin());

    -- Trigger for new auth users
    create or replace function public.handle_new_user()
    returns trigger language plpgsql security definer set search_path = public as $$
    begin
      insert into public.profiles (id, full_name, email, role, status)
      values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'student'::public.app_role),
        'active'
      )
      on conflict (id) do update set
        email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name);
      return new;
    end;
    $$;

    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  `)

  console.log('✓ Tables, types, functions, and RLS policies created.')

  // Seed default test accounts and institution data
  console.log('--- Creating Seed Accounts & Initial Data ---')

  const usersToSeed = [
    { email: 'admin@attendly.edu', password: 'AdminPassword123!', full_name: 'Dr. Arthur Vance (Admin)', role: 'admin', employee_id: 'EMP-001' },
    { email: 'teacher@attendly.edu', password: 'TeacherPassword123!', full_name: 'Prof. Sarah Wilson (Teacher)', role: 'teacher', employee_id: 'EMP-102' },
    { email: 'student@attendly.edu', password: 'StudentPassword123!', full_name: 'Ava Martinez (Student)', role: 'student', student_id: 'STU-19302' },
    { email: 'student2@attendly.edu', password: 'StudentPassword123!', full_name: 'Marcus Thompson (Student)', role: 'student', student_id: 'STU-20481' },
    { email: 'student3@attendly.edu', password: 'StudentPassword123!', full_name: 'Noah Williams (Student)', role: 'student', student_id: 'STU-21094' },
  ]

  const userIds = {}

  for (const u of usersToSeed) {
    // Check if user exists in auth.users
    const [existing] = await sql`select id from auth.users where email = ${u.email}`
    let userId
    if (!existing) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role }
      })
      if (error) {
        console.error('Failed to create user', u.email, error.message)
        continue
      }
      userId = data.user.id
      console.log(`Created auth user: ${u.email} (${userId})`)
    } else {
      userId = existing.id
      console.log(`User already exists: ${u.email} (${userId})`)
    }
    userIds[u.role] = userIds[u.role] || userId
    userIds[u.email] = userId

    // Upsert profile
    await sql`
      insert into public.profiles (id, full_name, email, role, student_id, employee_id, status)
      values (${userId}, ${u.full_name}, ${u.email}, ${u.role}, ${u.student_id || null}, ${u.employee_id || null}, 'active')
      on conflict (id) do update set
        full_name = ${u.full_name},
        role = ${u.role},
        student_id = coalesce(${u.student_id || null}, profiles.student_id),
        employee_id = coalesce(${u.employee_id || null}, profiles.employee_id),
        status = 'active';
    `
  }

  // Seed departments
  console.log('Seeding departments...')
  const [deptCs] = await sql`
    insert into public.departments (name, code, description)
    values ('Computer Science & Engineering', 'CSE', 'Department of Computer Science')
    on conflict (code) do update set name = excluded.name
    returning id;
  `
  const [deptMath] = await sql`
    insert into public.departments (name, code, description)
    values ('Mathematics', 'MATH', 'Department of Mathematics')
    on conflict (code) do update set name = excluded.name
    returning id;
  `
  const [deptBus] = await sql`
    insert into public.departments (name, code, description)
    values ('Business Administration', 'BUS', 'School of Business')
    on conflict (code) do update set name = excluded.name
    returning id;
  `

  // Update profiles with department
  if (userIds['teacher@attendly.edu']) {
    await sql`update public.profiles set department_id = ${deptCs.id} where id = ${userIds['teacher@attendly.edu']}`
  }
  if (userIds['student@attendly.edu']) {
    await sql`update public.profiles set department_id = ${deptCs.id} where id = ${userIds['student@attendly.edu']}`
  }

  // Seed courses
  console.log('Seeding courses...')
  const [courseCs408] = await sql`
    insert into public.courses (department_id, code, name, credits, description)
    values (${deptCs.id}, 'CS-408', 'Database Systems', 4, 'Relational databases, indexing, transactions, and SQL.')
    on conflict (department_id, code) do update set name = excluded.name
    returning id;
  `
  const [courseCs101] = await sql`
    insert into public.courses (department_id, code, name, credits, description)
    values (${deptCs.id}, 'CS-101', 'Intro to Computer Science', 3, 'Foundations of algorithms and programming.')
    on conflict (department_id, code) do update set name = excluded.name
    returning id;
  `
  const [courseMath302] = await sql`
    insert into public.courses (department_id, code, name, credits, description)
    values (${deptMath.id}, 'MATH-302', 'Advanced Mathematics', 4, 'Linear algebra, calculus, and discrete mathematics.')
    on conflict (department_id, code) do update set name = excluded.name
    returning id;
  `

  // Seed classes
  console.log('Seeding classes...')
  const [classDbA] = await sql`
    insert into public.classes (course_id, name, room, semester, academic_year, capacity)
    values (${courseCs408.id}, 'Section A', 'Lab 408', 'Fall 2026', '2026-2027', 45)
    on conflict (course_id, name, semester, academic_year) do update set room = excluded.room
    returning id;
  `
  const [classMathB] = await sql`
    insert into public.classes (course_id, name, room, semester, academic_year, capacity)
    values (${courseMath302.id}, 'Section B', 'Room 302', 'Fall 2026', '2026-2027', 50)
    on conflict (course_id, name, semester, academic_year) do update set room = excluded.room
    returning id;
  `
  const [classCs101A] = await sql`
    insert into public.classes (course_id, name, room, semester, academic_year, capacity)
    values (${courseCs101.id}, 'Section A', 'Hall 101', 'Fall 2026', '2026-2027', 60)
    on conflict (course_id, name, semester, academic_year) do update set room = excluded.room
    returning id;
  `

  // Seed location settings (Campus coordinates: Lab 408 at default coords)
  console.log('Seeding location settings...')
  await sql`
    insert into public.location_settings (class_id, latitude, longitude, radius_meters)
    values (${classDbA.id}, 12.971600, 77.594600, 150)
    on conflict (class_id) do update set radius_meters = excluded.radius_meters;
  `
  await sql`
    insert into public.location_settings (class_id, latitude, longitude, radius_meters)
    values (${classMathB.id}, 12.971600, 77.594600, 150)
    on conflict (class_id) do update set radius_meters = excluded.radius_meters;
  `

  // Teacher assignments
  console.log('Assigning teacher...')
  const teacherId = userIds['teacher@attendly.edu']
  if (teacherId) {
    await sql`
      insert into public.teacher_assignments (class_id, teacher_id)
      values (${classDbA.id}, ${teacherId})
      on conflict (class_id, teacher_id) do nothing;
    `
    await sql`
      insert into public.teacher_assignments (class_id, teacher_id)
      values (${classMathB.id}, ${teacherId})
      on conflict (class_id, teacher_id) do nothing;
    `
  }

  // Student enrollments
  console.log('Enrolling students...')
  const studentIds = [
    userIds['student@attendly.edu'],
    userIds['student2@attendly.edu'],
    userIds['student3@attendly.edu'],
  ].filter(Boolean)

  for (const sid of studentIds) {
    await sql`
      insert into public.enrollments (class_id, student_id, status)
      values (${classDbA.id}, ${sid}, 'active')
      on conflict (class_id, student_id) do nothing;
    `
    await sql`
      insert into public.enrollments (class_id, student_id, status)
      values (${classMathB.id}, ${sid}, 'active')
      on conflict (class_id, student_id) do nothing;
    `
  }

  // Seed an initial completed session and attendance records for realistic data
  console.log('Seeding sample attendance records...')
  const [prevSession] = await sql`
    insert into public.attendance_sessions (
      class_id, teacher_id, status, started_at, ended_at, latitude, longitude, radius_meters
    )
    values (
      ${classDbA.id}, ${teacherId}, 'ended', now() - interval '2 days', now() - interval '2 days' + interval '50 minutes', 12.971600, 77.594600, 150
    )
    returning id;
  `
  if (prevSession && studentIds.length > 0) {
    for (const sid of studentIds) {
      await sql`
        insert into public.attendance_records (session_id, student_id, status, marked_at, distance_meters, source)
        values (${prevSession.id}, ${sid}, 'present', now() - interval '2 days', 18.5, 'qr')
        on conflict (session_id, student_id) do nothing;
      `
    }
  }

  // Seed audit logs
  await sql`
    insert into public.audit_logs (actor_id, action, entity_type, success, metadata)
    values (${userIds['admin@attendly.edu']}, 'INITIAL_DATABASE_SETUP', 'SYSTEM', true, '{"event": "System initialized and seeded"}');
  `

  console.log('✓ Seeding complete!')
  await sql.end()
}

main().catch((err) => {
  console.error('Migration error:', err)
  process.exit(1)
})
