-- WLP PageOps — esquema de base de datos (Supabase / Postgres).
-- Se aplica en Fase 1, cuando la app deja de leer lib/seed.ts.

create type page_type as enum ('Páginas Principales', 'Servicios Core', 'Empleos', 'Landing Pages');
create type stage as enum ('Por hacer', 'En curso', 'QA', 'Revisión Admin', 'Cambios solicitados', 'Publicado', 'Archivado');
create type work_kind as enum ('Página V2', 'Ajuste');
create type priority as enum ('Urgente', 'Alta', 'Normal', 'Baja');
create type feedback_status as enum ('Pendiente', 'Resuelto', 'Descartado');
create type review_result as enum ('Aprobado', 'Cambios solicitados');
create type note_kind as enum ('Decisión técnica', 'Indicación del Admin', 'General');
create type app_role as enum ('produccion', 'admin');

-- Quién puede entrar y con qué rol.
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role app_role not null default 'admin'
);

create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  type page_type not null,
  channel text,
  wp_page_id integer,
  public_url text,
  docs_url text,
  figma_url text,
  created_at timestamptz not null default now()
);

create table work_items (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages on delete cascade,
  kind work_kind not null,
  title text not null,
  stage stage not null default 'Por hacer',
  priority priority not null default 'Normal',
  story_points smallint check (story_points in (1, 2, 3, 5, 8, 13)),
  start_date date,
  due_date date,
  delivered_at date,
  blocked_reason text,
  blocked_since date,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references work_items on delete cascade,
  title text not null,
  category text not null,
  done boolean not null default false,
  critical boolean not null default false,
  feedback_id uuid,
  position integer not null default 0
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references work_items on delete cascade,
  number smallint not null,
  requested_at date not null default current_date,
  responded_at date,
  closed_at date,
  result review_result,
  unique (work_item_id, number)
);

create table feedback_items (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews on delete cascade,
  text text not null,
  status feedback_status not null default 'Pendiente',
  discard_reason text,
  author uuid references profiles,
  created_at timestamptz not null default now()
);

alter table tasks
  add constraint tasks_feedback_fk foreign key (feedback_id) references feedback_items on delete set null;

create table qa_checks (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references work_items on delete cascade,
  grp text not null,
  label text not null,
  status text not null default 'Pendiente' check (status in ('Pendiente', 'OK', 'N/A')),
  position integer not null default 0
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages on delete cascade,
  work_item_id uuid references work_items on delete set null,
  kind note_kind not null default 'General',
  body text not null,
  pinned boolean not null default false,
  author uuid references profiles,
  created_at timestamptz not null default now()
);

create table activity (
  id bigint generated always as identity primary key,
  page_id uuid not null references pages on delete cascade,
  work_item_id uuid references work_items on delete cascade,
  action text not null,
  from_value text,
  to_value text,
  actor uuid default auth.uid(),
  at timestamptz not null default now()
);

-- Actividad automática: cada cambio relevante de un trabajo queda registrado,
-- sin depender de que la interfaz lo haga.
create function log_work_item_change() returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    insert into activity (page_id, work_item_id, action, to_value)
    values (new.page_id, new.id, 'Trabajo creado', new.stage::text);
    return new;
  end if;
  if new.stage is distinct from old.stage then
    insert into activity (page_id, work_item_id, action, from_value, to_value)
    values (new.page_id, new.id, 'Etapa', old.stage::text, new.stage::text);
    -- "Entregada el" se llena sola la primera vez que el trabajo va a revisión.
    if new.stage = 'Revisión Admin' and new.delivered_at is null then
      new.delivered_at := current_date;
    end if;
  end if;
  if new.blocked_reason is distinct from old.blocked_reason then
    insert into activity (page_id, work_item_id, action, from_value, to_value)
    values (new.page_id, new.id, 'Bloqueo', old.blocked_reason, new.blocked_reason);
  end if;
  if new.due_date is distinct from old.due_date then
    insert into activity (page_id, work_item_id, action, from_value, to_value)
    values (new.page_id, new.id, 'Fecha de entrega', old.due_date::text, new.due_date::text);
  end if;
  if new.story_points is distinct from old.story_points then
    insert into activity (page_id, work_item_id, action, from_value, to_value)
    values (new.page_id, new.id, 'Story points', old.story_points::text, new.story_points::text);
  end if;
  return new;
end $$;

create trigger work_items_activity_insert after insert on work_items
  for each row execute function log_work_item_change();
create trigger work_items_activity_update before update on work_items
  for each row execute function log_work_item_change();

-- Permisos: producción edita todo; el Admin lee todo y escribe feedback, notas
-- y el resultado de las revisiones.
create function current_role_is(r app_role) returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = r)
$$;

alter table profiles enable row level security;
alter table pages enable row level security;
alter table work_items enable row level security;
alter table tasks enable row level security;
alter table reviews enable row level security;
alter table feedback_items enable row level security;
alter table qa_checks enable row level security;
alter table notes enable row level security;
alter table activity enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','pages','work_items','tasks','reviews','feedback_items','qa_checks','notes','activity'] loop
    execute format('create policy "leer (usuarios con perfil)" on %I for select using (auth.uid() in (select id from profiles))', t);
    execute format('create policy "producción edita" on %I for all using (current_role_is(''produccion'')) with check (current_role_is(''produccion''))', t);
  end loop;
end $$;

create policy "admin deja feedback" on feedback_items for insert with check (current_role_is('admin'));
create policy "admin edita su feedback" on feedback_items for update using (current_role_is('admin') and author = auth.uid());
create policy "admin deja notas" on notes for insert with check (current_role_is('admin') and author = auth.uid());
create policy "admin cierra revisiones" on reviews for update using (current_role_is('admin'));
