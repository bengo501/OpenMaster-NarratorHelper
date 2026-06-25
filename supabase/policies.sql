-- =====================================================================
-- Mesa Viva — Row Level Security (RLS)
-- Rode este script no Supabase: SQL Editor > New query > Run.
-- Rode DEPOIS de aplicar as migrations (npm run db:migrate).
--
-- Por que isto é necessário:
-- O Supabase expõe uma API pública (PostgREST) usando a anon key, que fica
-- embutida no bundle do front. Sem RLS, qualquer um com essa chave poderia
-- ler/gravar todas as linhas. As políticas abaixo restringem cada usuário
-- aos próprios dados. (A app usa conexão direta via Drizzle e também filtra
-- por owner_id no código — isto aqui é a defesa da API pública.)
-- =====================================================================

alter table campaign enable row level security;

drop policy if exists "campaign_select_own" on campaign;
create policy "campaign_select_own" on campaign
  for select to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "campaign_insert_own" on campaign;
create policy "campaign_insert_own" on campaign
  for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "campaign_update_own" on campaign;
create policy "campaign_update_own" on campaign
  for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "campaign_delete_own" on campaign;
create policy "campaign_delete_own" on campaign
  for delete to authenticated
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- actor (M2)
-- ---------------------------------------------------------------------------
alter table actor enable row level security;

drop policy if exists "actor_select_own" on actor;
create policy "actor_select_own" on actor
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists "actor_insert_own" on actor;
create policy "actor_insert_own" on actor
  for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "actor_update_own" on actor;
create policy "actor_update_own" on actor
  for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "actor_delete_own" on actor;
create policy "actor_delete_own" on actor
  for delete to authenticated using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- location (M2)
-- ---------------------------------------------------------------------------
alter table location enable row level security;

drop policy if exists "location_select_own" on location;
create policy "location_select_own" on location
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists "location_insert_own" on location;
create policy "location_insert_own" on location
  for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "location_update_own" on location;
create policy "location_update_own" on location
  for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "location_delete_own" on location;
create policy "location_delete_own" on location
  for delete to authenticated using (auth.uid() = owner_id);
