-- Phase 0.5: Nachweis der Einwilligungen (Art. 7 Abs. 1 DSGVO). Append-only.

create table public.consent_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  consent_type text not null
    check (consent_type in ('health_data', 'location', 'marketing')),
  granted boolean not null,
  policy_version text not null,
  created_at timestamptz not null default now()
);

create index consent_log_user_id_idx on public.consent_log (user_id, created_at desc);

alter table public.consent_log enable row level security;

-- Nur lesen und anhängen, keine Änderungen oder Löschungen durch Nutzer
create policy "consent_log_select_own" on public.consent_log
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "consent_log_insert_own" on public.consent_log
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
