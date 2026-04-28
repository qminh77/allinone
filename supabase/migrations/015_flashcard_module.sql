-- Flashcard module

create table if not exists public.flashcard_sets (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text null,
  visibility text not null default 'private',
  share_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint flashcard_sets_pkey primary key (id),
  constraint flashcard_sets_visibility_check check (visibility in ('public', 'private')),
  constraint flashcard_sets_title_length check (char_length(trim(title)) between 3 and 160)
);

create table if not exists public.flashcards (
  id uuid not null default gen_random_uuid(),
  set_id uuid not null references public.flashcard_sets(id) on delete cascade,
  term text not null,
  definition text not null,
  order_index integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint flashcards_pkey primary key (id),
  constraint flashcards_term_length check (char_length(trim(term)) between 1 and 500),
  constraint flashcards_definition_length check (char_length(trim(definition)) between 1 and 5000)
);

create table if not exists public.flashcard_progress (
  id uuid not null default gen_random_uuid(),
  set_id uuid not null references public.flashcard_sets(id) on delete cascade,
  card_id uuid not null references public.flashcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'unknown',
  last_seen_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint flashcard_progress_pkey primary key (id),
  constraint flashcard_progress_status_check check (status in ('unknown', 'known', 'mastered')),
  constraint flashcard_progress_unique unique (card_id, user_id)
);

create index if not exists idx_flashcard_sets_user_created on public.flashcard_sets(user_id, created_at desc);
create index if not exists idx_flashcard_sets_visibility on public.flashcard_sets(visibility);
create index if not exists idx_flashcard_sets_share_token on public.flashcard_sets(share_token);
create index if not exists idx_flashcard_sets_lower_title on public.flashcard_sets(lower(title));
create index if not exists idx_flashcards_set_order on public.flashcards(set_id, order_index asc);
create index if not exists idx_flashcard_progress_user_set on public.flashcard_progress(user_id, set_id);

create or replace function public.owns_flashcard_set(target_set_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.flashcard_sets fs
    where fs.id = target_set_id
      and fs.user_id = auth.uid()
  );
$$;

create or replace function public.can_view_flashcard_set(target_set_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.flashcard_sets fs
    where fs.id = target_set_id
      and (
        fs.user_id = auth.uid()
        or fs.visibility = 'public'
      )
  );
$$;

drop trigger if exists update_flashcard_sets_updated_at on public.flashcard_sets;
create trigger update_flashcard_sets_updated_at before update on public.flashcard_sets
  for each row execute function update_updated_at_column();

drop trigger if exists update_flashcards_updated_at on public.flashcards;
create trigger update_flashcards_updated_at before update on public.flashcards
  for each row execute function update_updated_at_column();

drop trigger if exists update_flashcard_progress_updated_at on public.flashcard_progress;
create trigger update_flashcard_progress_updated_at before update on public.flashcard_progress
  for each row execute function update_updated_at_column();

alter table public.flashcard_sets enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_progress enable row level security;

create policy "Users can view accessible flashcard sets" on public.flashcard_sets
  for select using (public.can_view_flashcard_set(id));

create policy "Users can insert own flashcard sets" on public.flashcard_sets
  for insert with check (auth.uid() = user_id);

create policy "Users can update own flashcard sets" on public.flashcard_sets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own flashcard sets" on public.flashcard_sets
  for delete using (auth.uid() = user_id);

create policy "Users can view cards of accessible sets" on public.flashcards
  for select using (public.can_view_flashcard_set(set_id));

create policy "Users can insert cards into own sets" on public.flashcards
  for insert with check (public.owns_flashcard_set(set_id));

create policy "Users can update cards of own sets" on public.flashcards
  for update using (public.owns_flashcard_set(set_id)) with check (public.owns_flashcard_set(set_id));

create policy "Users can delete cards of own sets" on public.flashcards
  for delete using (public.owns_flashcard_set(set_id));

create policy "Users can view own flashcard progress" on public.flashcard_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own flashcard progress" on public.flashcard_progress
  for insert with check (auth.uid() = user_id and public.can_view_flashcard_set(set_id));

create policy "Users can update own flashcard progress" on public.flashcard_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id and public.can_view_flashcard_set(set_id));

create policy "Users can delete own flashcard progress" on public.flashcard_progress
  for delete using (auth.uid() = user_id);
