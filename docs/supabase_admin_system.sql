-- ============================================================
-- SISTEMA DE ADMINISTRACIÓN PARA APROBACIÓN DE RADIOS
-- ============================================================

-- Tabla: admin_users
-- Guarda los administradores aprobados con permisos de revisión
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null default 'reviewer',  -- 'admin' (super), 'reviewer' (aprueba)
  status text not null default 'active',  -- 'active', 'suspended'
  invited_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para admin_users
create index if not exists admin_users_email_idx on public.admin_users(email);
create index if not exists admin_users_role_idx on public.admin_users(role);
create index if not exists admin_users_status_idx on public.admin_users(status);

alter table public.admin_users enable row level security;

-- Tabla: admin_invitations
-- Guarda las invitaciones pendientes de aceptación
create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null default 'reviewer',  -- rol a asignar
  invitation_token text not null unique,
  invited_by uuid not null references public.admin_users(id) on delete cascade,
  status text not null default 'pending',  -- 'pending', 'accepted', 'rejected', 'expired'
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);

-- Índices para admin_invitations
create index if not exists admin_invitations_email_idx on public.admin_invitations(email);
create index if not exists admin_invitations_token_idx on public.admin_invitations(invitation_token);
create index if not exists admin_invitations_status_idx on public.admin_invitations(status);

alter table public.admin_invitations enable row level security;

-- Tabla: approval_history
-- Registro de todas las aprobaciones/rechazos para auditoría
create table if not exists public.approval_history (
  id uuid primary key default gen_random_uuid(),
  station_id bigint not null references public.global_stations(id) on delete cascade,
  admin_id uuid not null references public.admin_users(id) on delete set null,
  action text not null,  -- 'approved', 'rejected'
  comments text,
  created_at timestamptz not null default now()
);

-- Índices para approval_history
create index if not exists approval_history_station_idx on public.approval_history(station_id);
create index if not exists approval_history_admin_idx on public.approval_history(admin_id);
create index if not exists approval_history_created_idx on public.approval_history(created_at);

alter table public.approval_history enable row level security;

-- ============================================================
-- POLÍTICAS RLS PARA ADMINISTRADORES
-- ============================================================

-- admin_users: Solo admins pueden leer, solo super-admins pueden crear
drop policy if exists "admins read all admin_users" on public.admin_users;
create policy "admins read all admin_users"
on public.admin_users
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where email = auth.jwt() ->> 'email'
    and role = 'admin'
    and status = 'active'
  )
);

drop policy if exists "super admins create admin_users" on public.admin_users;
create policy "super admins create admin_users"
on public.admin_users
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where email = auth.jwt() ->> 'email'
    and role = 'admin'
    and status = 'active'
  )
);

-- admin_invitations: Admins pueden crear invitaciones
drop policy if exists "admins can create invitations" on public.admin_invitations;
create policy "admins can create invitations"
on public.admin_invitations
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where email = auth.jwt() ->> 'email'
    and role = 'admin'
    and status = 'active'
  )
);

-- admin_invitations: Cualquiera puede leer su propia invitación
drop policy if exists "users can view their own invitations" on public.admin_invitations;
create policy "users can view their own invitations"
on public.admin_invitations
for select
to anon, authenticated
using (email = current_user_email() or status != 'expired');

-- Function para obtener email del usuario actual
create or replace function current_user_email() returns text as $$
begin
  return coalesce(auth.jwt() ->> 'email', '');
end;
$$ language plpgsql security definer;

-- approval_history: Admins pueden leer el historial
drop policy if exists "admins read approval_history" on public.approval_history;
create policy "admins read approval_history"
on public.approval_history
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where email = auth.jwt() ->> 'email'
    and role in ('admin', 'reviewer')
    and status = 'active'
  )
);

-- approval_history: Admins pueden crear registros
drop policy if exists "admins create approval_history" on public.approval_history;
create policy "admins create approval_history"
on public.approval_history
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where email = auth.jwt() ->> 'email'
    and role in ('admin', 'reviewer')
    and status = 'active'
  )
);

-- ============================================================
-- FUNCIONES PARA APROBACIÓN
-- ============================================================

-- Función para aprobar una estación
create or replace function approve_station(
  p_station_id bigint,
  p_admin_email text
)
returns boolean as $$
declare
  v_admin_id uuid;
begin
  -- Verificar que el admin exista y tenga permisos
  select id into v_admin_id from public.admin_users
  where email = p_admin_email
  and role in ('admin', 'reviewer')
  and status = 'active';

  if v_admin_id is null then
    raise exception 'Admin no autorizado o no existe';
  end if;

  -- Actualizar estación
  update public.global_stations
  set status = 'approved',
      reviewed_by = p_admin_email,
      approved_at = now()
  where id = p_station_id;

  -- Registrar en historial
  insert into public.approval_history
  (station_id, admin_id, action, created_at)
  values (p_station_id, v_admin_id, 'approved', now());

  return true;
end;
$$ language plpgsql security definer;

-- Función para rechazar una estación
create or replace function reject_station(
  p_station_id bigint,
  p_admin_email text,
  p_comments text default null
)
returns boolean as $$
declare
  v_admin_id uuid;
begin
  -- Verificar que el admin exista y tenga permisos
  select id into v_admin_id from public.admin_users
  where email = p_admin_email
  and role in ('admin', 'reviewer')
  and status = 'active';

  if v_admin_id is null then
    raise exception 'Admin no autorizado o no existe';
  end if;

  -- Actualizar estación
  update public.global_stations
  set status = 'rejected',
      reviewed_by = p_admin_email,
      approved_at = now()
  where id = p_station_id;

  -- Registrar en historial
  insert into public.approval_history
  (station_id, admin_id, action, comments, created_at)
  values (p_station_id, v_admin_id, 'rejected', p_comments, now());

  return true;
end;
$$ language plpgsql security definer;

-- Función para crear invitación
create or replace function create_admin_invitation(
  p_email text,
  p_role text,
  p_invited_by_email text
)
returns json as $$
declare
  v_invited_by_id uuid;
  v_token text;
  v_invitation_id uuid;
begin
  -- Verificar que quien invita es admin
  select id into v_invited_by_id from public.admin_users
  where email = p_invited_by_email
  and role = 'admin'
  and status = 'active';

  if v_invited_by_id is null then
    raise exception 'Solo admins pueden invitar personas';
  end if;

  -- Generar token único
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Crear invitación
  insert into public.admin_invitations
  (email, role, invitation_token, invited_by, status, expires_at)
  values (p_email, p_role, v_token, v_invited_by_id, 'pending', now() + interval '7 days')
  returning id into v_invitation_id;

  return json_build_object(
    'id', v_invitation_id,
    'email', p_email,
    'token', v_token,
    'role', p_role
  );
end;
$$ language plpgsql security definer;

-- Función para aceptar invitación
create or replace function accept_admin_invitation(
  p_token text,
  p_user_email text
)
returns boolean as $$
declare
  v_invitation admin_invitations%rowtype;
begin
  -- Buscar y validar invitación
  select * into v_invitation from public.admin_invitations
  where invitation_token = p_token
  and status = 'pending'
  and expires_at > now();

  if v_invitation is null then
    raise exception 'Invitación no válida o expirada';
  end if;

  if v_invitation.email != p_user_email then
    raise exception 'Email no coincide con invitación';
  end if;

  -- Crear usuario admin
  insert into public.admin_users
  (email, role, status, invited_by, created_at)
  values (p_user_email, v_invitation.role, 'active', v_invitation.invited_by, now())
  on conflict (email) do update
  set status = 'active', updated_at = now();

  -- Marcar invitación como aceptada
  update public.admin_invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invitation.id;

  return true;
end;
$$ language plpgsql security definer;
