-- Create curator_notes table
create table curator_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  curator_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  is_public boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(project_id, curator_id) -- One note per curator per project
);

-- Enable RLS
alter table curator_notes enable row level security;

-- Policies
create policy "Anyone can view public curator notes"
  on curator_notes for select
  using (is_public = true);

create policy "Curators can view their own notes"
  on curator_notes for select
  using (auth.uid() = curator_id);

create policy "Authenticated users can create notes"
  on curator_notes for insert
  with check (auth.uid() = curator_id);

create policy "Curators can update their notes"
  on curator_notes for update
  using (auth.uid() = curator_id)
  with check (auth.uid() = curator_id);

create policy "Curators can delete their notes"
  on curator_notes for delete
  using (auth.uid() = curator_id);

-- Index for performance
create index idx_curator_notes_project_id on curator_notes(project_id);
create index idx_curator_notes_curator_id on curator_notes(curator_id);
create index idx_curator_notes_public on curator_notes(is_public) where is_public = true;
