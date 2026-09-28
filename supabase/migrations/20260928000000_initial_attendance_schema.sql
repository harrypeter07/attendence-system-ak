-- Attendly Smart Attendance schema for Supabase
-- Apply with Supabase CLI after connecting a project.
create extension if not exists pgcrypto;

do $$ begin create type public.app_role as enum ('admin','teacher','student'); exception when duplicate_object then null; end $$;
do $$ begin create type public.account_status as enum ('active','inactive','suspended'); exception when duplicate_object then null; end $$;
do $$ begin create type public.session_status as enum ('scheduled','active','paused','ended','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.attendance_status as enum ('present','late','absent','excused','rejected'); exception when duplicate_object then null; end $$;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(), name text not null unique, code text not null unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, full_name text not null, email text not null,
  role public.app_role not null default 'student', student_id text unique, employee_id text unique,
  department_id uuid references public.departments(id) on delete set null, avatar_url text,
  status public.account_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(), department_id uuid not null references public.departments(id) on delete restrict,
  code text not null, name text not null, credits smallint not null default 3 check (credits > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(department_id, code)
);
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  name text not null, room text, semester text not null, academic_year text not null, capacity integer check (capacity is null or capacity > 0),
  created_at timestamptz not null default now(), unique(course_id,name,semester,academic_year)
);
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, status public.account_status not null default 'active', enrolled_at timestamptz not null default now(),
  unique(class_id, student_id)
);
create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade, assigned_at timestamptz not null default now(), unique(class_id,teacher_id)
);
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id) on delete restrict,
  teacher_id uuid not null references public.profiles(id) on delete restrict, status public.session_status not null default 'active',
  started_at timestamptz not null default now(), ended_at timestamptz, latitude numeric(9,6), longitude numeric(9,6), radius_meters integer not null default 50 check(radius_meters between 10 and 1000),
  created_at timestamptz not null default now()
);
create table if not exists public.attendance_tokens (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  token_hash text not null unique, valid_from timestamptz not null default now(), valid_until timestamptz not null,
  consumed_at timestamptz, created_at timestamptz not null default now(), check(valid_until > valid_from)
);
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.attendance_sessions(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict, status public.attendance_status not null,
  marked_at timestamptz not null default now(), distance_meters numeric(8,2), source text not null default 'qr', note text,
  unique(session_id, student_id)
);
create table if not exists public.attendance_attempts (
  id uuid primary key default gen_random_uuid(), session_id uuid references public.attendance_sessions(id) on delete set null,
  student_id uuid references public.profiles(id) on delete set null, token_id uuid references public.attendance_tokens(id) on delete set null,
  success boolean not null, reason text, distance_meters numeric(8,2), attempted_at timestamptz not null default now()
);
create table if not exists public.location_settings (
  id uuid primary key default gen_random_uuid(), class_id uuid unique references public.classes(id) on delete cascade,
  latitude numeric(9,6) not null, longitude numeric(9,6) not null, radius_meters integer not null default 50 check(radius_meters between 10 and 1000), updated_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null, action text not null,
  entity_type text not null, entity_id uuid, success boolean not null default true, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_enrollments_student on public.enrollments(student_id);
create index if not exists idx_assignments_teacher on public.teacher_assignments(teacher_id);
create index if not exists idx_sessions_teacher_status on public.attendance_sessions(teacher_id,status);
create index if not exists idx_sessions_started_at on public.attendance_sessions(started_at desc);
create index if not exists idx_records_student_marked on public.attendance_records(student_id,marked_at desc);
create index if not exists idx_attempts_session_time on public.attendance_attempts(session_id,attempted_at desc);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path = public as $$ select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin' and status='active') $$;
create or replace function public.is_teacher() returns boolean language sql stable security invoker set search_path = public as $$ select exists(select 1 from public.profiles where id=(select auth.uid()) and role='teacher' and status='active') $$;

alter table public.departments enable row level security; alter table public.profiles enable row level security; alter table public.courses enable row level security; alter table public.classes enable row level security; alter table public.enrollments enable row level security; alter table public.teacher_assignments enable row level security; alter table public.attendance_sessions enable row level security; alter table public.attendance_tokens enable row level security; alter table public.attendance_records enable row level security; alter table public.attendance_attempts enable row level security; alter table public.location_settings enable row level security; alter table public.audit_logs enable row level security; alter table public.notifications enable row level security;

create policy "profiles self or admin" on public.profiles for select to authenticated using (id=(select auth.uid()) or public.is_admin());
create policy "profiles admin manage" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "departments authenticated read" on public.departments for select to authenticated using (true);
create policy "departments admin manage" on public.departments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "courses authenticated read" on public.courses for select to authenticated using (true);
create policy "courses admin manage" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "classes authenticated read" on public.classes for select to authenticated using (true);
create policy "classes admin manage" on public.classes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "enrollments student or admin" on public.enrollments for select to authenticated using (student_id=(select auth.uid()) or public.is_admin() or exists(select 1 from public.teacher_assignments ta where ta.class_id=enrollments.class_id and ta.teacher_id=(select auth.uid())));
create policy "enrollments admin manage" on public.enrollments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "assignments teacher or admin" on public.teacher_assignments for select to authenticated using (teacher_id=(select auth.uid()) or public.is_admin());
create policy "assignments admin manage" on public.teacher_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "sessions visible by role" on public.attendance_sessions for select to authenticated using (teacher_id=(select auth.uid()) or public.is_admin() or exists(select 1 from public.enrollments e join public.classes c on c.id=e.class_id where e.student_id=(select auth.uid()) and c.id=attendance_sessions.class_id));
create policy "teachers create sessions" on public.attendance_sessions for insert to authenticated with check (teacher_id=(select auth.uid()) and public.is_teacher());
create policy "teachers update sessions" on public.attendance_sessions for update to authenticated using (teacher_id=(select auth.uid()) or public.is_admin()) with check (teacher_id=(select auth.uid()) or public.is_admin());
create policy "students own records" on public.attendance_records for select to authenticated using (student_id=(select auth.uid()) or public.is_admin() or exists(select 1 from public.attendance_sessions s where s.id=attendance_records.session_id and s.teacher_id=(select auth.uid())));
create policy "students own attempts" on public.attendance_attempts for select to authenticated using (student_id=(select auth.uid()) or public.is_admin());
create policy "own notifications" on public.notifications for select to authenticated using (user_id=(select auth.uid()));
create policy "own notifications update" on public.notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "admin audit read" on public.audit_logs for select to authenticated using (public.is_admin());

create or replace function public.handle_new_user() returns trigger language plpgsql security invoker set search_path = public as $$ begin insert into public.profiles(id,full_name,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','New user'),new.email); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

comment on table public.attendance_tokens is 'Store SHA-256 token hashes only; raw QR tokens are never persisted.';
comment on table public.attendance_attempts is 'Security/audit trail for successful and rejected scan attempts.';
-- Production note: create privileged server-side RPCs for token rotation and marking attendance; never expose token writes to the browser.

-- Optional seed template (intentionally no credentials):
-- insert into public.departments(name,code) values ('Computer Science','CS');
-- Create users through Supabase Auth, then update their profiles.role using a privileged admin workflow.

-- Required environment shape for future wiring (do not commit values):
-- NEXT_PUBLIC_SUPABASE_URL=
-- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
-- SUPABASE_SERVICE_ROLE_KEY= (server-only, never expose)

-- End schema.
