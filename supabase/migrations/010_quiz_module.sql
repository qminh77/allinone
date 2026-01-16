-- Create Quiz Tables

-- Table: quizzes
create table if not exists public.quizzes (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  is_public boolean default false,
  share_token text unique default encode(gen_random_bytes(16), 'hex'),
  constraint quizzes_pkey primary key (id)
);

-- Table: quiz_questions
create table if not exists public.quiz_questions (
  id uuid not null default gen_random_uuid (),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  content text not null,
  type text not null default 'single', -- 'single' or 'multiple'
  explanation text null,
  media_url text null,
  media_type text null, -- 'image' or 'youtube'
  order_index integer default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint quiz_questions_pkey primary key (id)
);

-- Table: quiz_answers
create table if not exists public.quiz_answers (
  id uuid not null default gen_random_uuid (),
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  content text not null,
  is_correct boolean default false,
  order_index integer default 0,
  created_at timestamp with time zone not null default now(),
  constraint quiz_answers_pkey primary key (id)
);

-- Table: quiz_attempts
create table if not exists public.quiz_attempts (
  id uuid not null default gen_random_uuid (),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid null references auth.users (id) on delete set null, -- Can be null if anonymous with token? For now let's assume auth users or maybe anonymous allowed later
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone null,
  score integer default 0,
  total_questions integer default 0,
  constraint quiz_attempts_pkey primary key (id)
);

-- Table: quiz_attempt_answers
create table if not exists public.quiz_attempt_answers (
  id uuid not null default gen_random_uuid (),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  answer_id uuid null references public.quiz_answers (id) on delete cascade, -- Can be null if skipped or multiple choice storage? actually for multiple probably need separate rows or array
  -- For multi-choice, we might structure this differently, but simplest is 1 row per selected answer.
  created_at timestamp with time zone not null default now(),
  constraint quiz_attempt_answers_pkey primary key (id)
);

-- Enable RLS
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;

-- Policies

-- Quizzes:
-- View: Owners, Public ones, or if you have a valid share token (handled via function or loose policy? For now, stick to Owner/Public + Service Role will handle token logic safely)
create policy "Users can view their own quizzes" on public.quizzes
  for select using (auth.uid() = user_id);

create policy "Users can view public quizzes" on public.quizzes
  for select using (is_public = true);

create policy "Users can insert their own quizzes" on public.quizzes
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own quizzes" on public.quizzes
  for update using (auth.uid() = user_id);

create policy "Users can delete their own quizzes" on public.quizzes
  for delete using (auth.uid() = user_id);

-- Questions & Answers (Inherit access from Quiz)
-- Simplest is to check if user can see the quiz.
-- Ideally we use a joining check or maintain metadata.
create policy "Users can view questions of visible quizzes" on public.quiz_questions
  for select using ( exists (select 1 from public.quizzes where public.quizzes.id = quiz_questions.quiz_id and (public.quizzes.user_id = auth.uid() or public.quizzes.is_public = true)) );

create policy "Users can manage questions of own quizzes" on public.quiz_questions
  for all using ( exists (select 1 from public.quizzes where public.quizzes.id = quiz_questions.quiz_id and public.quizzes.user_id = auth.uid()) );

create policy "Users can view answers of visible quizzes" on public.quiz_answers
  for select using ( exists (select 1 from public.quiz_questions join public.quizzes on public.quiz_questions.quiz_id = public.quizzes.id where public.quiz_questions.id = quiz_answers.question_id and (public.quizzes.user_id = auth.uid() or public.quizzes.is_public = true)) );

create policy "Users can manage answers of own quizzes" on public.quiz_answers
  for all using ( exists (select 1 from public.quiz_questions join public.quizzes on public.quiz_questions.quiz_id = public.quizzes.id where public.quiz_questions.id = quiz_answers.question_id and public.quizzes.user_id = auth.uid()) );


-- Attempts
create policy "Users can view own attempts" on public.quiz_attempts
  for select using (auth.uid() = user_id);

create policy "Users can create own attempts" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

-- Attempt Answers
create policy "Users can view own attempt answers" on public.quiz_attempt_answers
  for select using (exists (select 1 from public.quiz_attempts where public.quiz_attempts.id = quiz_attempt_answers.attempt_id and public.quiz_attempts.user_id = auth.uid()));

create policy "Users can create own attempt answers" on public.quiz_attempt_answers
  for insert with check (exists (select 1 from public.quiz_attempts where public.quiz_attempts.id = quiz_attempt_answers.attempt_id and public.quiz_attempts.user_id = auth.uid()));
