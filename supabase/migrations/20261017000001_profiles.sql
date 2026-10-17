-- Phase 0.2: profiles-Tabelle (Erweiterung von auth.users), Consent-Felder, RLS

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  units_preference text not null default 'metric'
    check (units_preference in ('metric', 'imperial')),

  -- Einwilligungen (Art. 9 DSGVO): je Datenkategorie getrennt und widerrufbar
  consent_health_data boolean not null default false,
  consent_location boolean not null default false,
  consent_marketing boolean not null default false,
  consent_given_at timestamptz,
  -- gesetzt, sobald der Consent-Flow einmal komplett durchlaufen wurde
  consent_completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Nutzer sehen und ändern nur ihre eigene Zeile. Kein DELETE: Löschen läuft über delete_own_account().
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- updated_at automatisch pflegen
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Bei jeder Registrierung automatisch ein Profil anlegen
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Art. 17 DSGVO: Nutzer löschen ihr Konto selbst. Alle Tabellen verweisen mit
-- "on delete cascade" auf auth.users bzw. profiles und werden dadurch mitgelöscht.
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
