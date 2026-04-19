-- ============================================================
-- THE BUREAU OF UNFINISHED THINGS
-- Initial Schema Migration
-- ============================================================

-- Core Tables

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  resurrection_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ghost_letter TEXT,
  causes_of_death TEXT[] NOT NULL,
  project_type TEXT NOT NULL,
  started_at DATE,
  died_at DATE NOT NULL DEFAULT CURRENT_DATE,
  lifespan_months INT GENERATED ALWAYS AS (
    EXTRACT(YEAR FROM age(died_at::timestamp, started_at::timestamp)) * 12 +
    EXTRACT(MONTH FROM age(died_at::timestamp, started_at::timestamp))
  ) STORED,
  adoption_type TEXT NOT NULL,
  adoption_price DECIMAL(10, 2),
  revenue_share_percent INT DEFAULT 5,
  is_adopted BOOLEAN DEFAULT FALSE,
  adopted_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  adopted_at TIMESTAMP,
  is_public BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE public.autopsies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  pathologist_diagnosis TEXT,
  pathologist_recommendation TEXT,
  confidence_score INT,
  community_diagnosis_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE public.autopsy_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autopsy_id UUID NOT NULL REFERENCES public.autopsies(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  alternative_causes TEXT[],
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE public.adoptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  adopter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  adoption_type TEXT NOT NULL,
  price_paid DECIMAL(10, 2),
  ip_transfer_agreement_signed BOOLEAN DEFAULT FALSE,
  ip_transfer_signed_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  resurrected_at TIMESTAMP,
  resurrection_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE public.adoption_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_id UUID NOT NULL REFERENCES public.adoptions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_id UUID NOT NULL REFERENCES public.adoptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_cents INT NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  creator_receives_cents INT,
  bureau_receives_cents INT,
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

CREATE TABLE public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL,
  new_projects_submitted INT DEFAULT 0,
  new_adoptions INT DEFAULT 0,
  projects_resurrected INT DEFAULT 0,
  death_cause_perfectionism INT DEFAULT 0,
  death_cause_money INT DEFAULT 0,
  death_cause_life INT DEFAULT 0,
  death_cause_scope_creep INT DEFAULT 0,
  death_cause_breakup INT DEFAULT 0,
  death_cause_obsolete INT DEFAULT 0,
  death_cause_interest INT DEFAULT 0,
  death_cause_market INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopsies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopsy_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects
CREATE POLICY "Public projects viewable" ON public.projects
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());
CREATE POLICY "Users create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = creator_id);

-- Project Files
CREATE POLICY "Project files viewable with project" ON public.project_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_files.project_id
      AND (projects.is_public = true OR projects.creator_id = auth.uid())
    )
  );
CREATE POLICY "Users upload own project files" ON public.project_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_files.project_id
      AND projects.creator_id = auth.uid()
    )
  );

-- Autopsies
CREATE POLICY "Autopsies viewable with project" ON public.autopsies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = autopsies.project_id
      AND (projects.is_public = true OR projects.creator_id = auth.uid())
    )
  );
CREATE POLICY "Service role updates autopsies" ON public.autopsies
  FOR UPDATE USING (true);

-- Autopsy Comments
CREATE POLICY "Comments viewable by everyone" ON public.autopsy_comments
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.autopsy_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Adoptions
CREATE POLICY "Adoptions visible to participants" ON public.adoptions
  FOR SELECT USING (
    auth.uid() = creator_id OR auth.uid() = adopter_id OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = adoptions.project_id AND projects.is_public = true
    )
  );
CREATE POLICY "Authenticated users can adopt" ON public.adoptions
  FOR INSERT WITH CHECK (auth.uid() = adopter_id);
CREATE POLICY "Participants update adoption" ON public.adoptions
  FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = adopter_id);

-- Adoption Chats
CREATE POLICY "Chat visible to participants" ON public.adoption_chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.adoptions
      WHERE adoptions.id = adoption_chats.adoption_id
      AND (auth.uid() = creator_id OR auth.uid() = adopter_id)
    )
  );
CREATE POLICY "Users message in their adoptions" ON public.adoption_chats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.adoptions
      WHERE adoptions.id = adoption_chats.adoption_id
      AND (auth.uid() = creator_id OR auth.uid() = adopter_id)
    )
  );

-- Payments
CREATE POLICY "Payments visible to participants" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.adoptions
      WHERE adoptions.id = payments.adoption_id
      AND (auth.uid() = creator_id OR auth.uid() = adopter_id)
    )
  );

-- Daily Stats (public read)
CREATE POLICY "Daily stats viewable by everyone" ON public.daily_stats
  FOR SELECT USING (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_autopsy()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.autopsies (project_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_autopsy
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_autopsy();

CREATE OR REPLACE FUNCTION mark_project_adopted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects
  SET is_adopted = TRUE, adopted_by_id = NEW.adopter_id, adopted_at = NOW()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_mark_adopted
  AFTER INSERT ON public.adoptions
  FOR EACH ROW
  EXECUTE FUNCTION mark_project_adopted();

-- Update resurrection score when a project is resurrected
CREATE OR REPLACE FUNCTION update_resurrection_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resurrected_at IS NOT NULL AND OLD.resurrected_at IS NULL THEN
    UPDATE public.profiles
    SET resurrection_score = resurrection_score + 10
    WHERE id = NEW.adopter_id;

    UPDATE public.projects
    SET updated_at = NOW()
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_resurrection_score
  AFTER UPDATE ON public.adoptions
  FOR EACH ROW
  EXECUTE FUNCTION update_resurrection_score();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_autopsies_updated_at
  BEFORE UPDATE ON public.autopsies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_projects_creator_id ON public.projects(creator_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_is_public ON public.projects(is_public);
CREATE INDEX idx_projects_causes ON public.projects USING GIN(causes_of_death);
CREATE INDEX idx_projects_is_adopted ON public.projects(is_adopted);
CREATE INDEX idx_adoptions_adopter_id ON public.adoptions(adopter_id);
CREATE INDEX idx_adoptions_project_id ON public.adoptions(project_id);
CREATE INDEX idx_adoption_chats_adoption_id ON public.adoption_chats(adoption_id);
CREATE INDEX idx_adoption_chats_created_at ON public.adoption_chats(created_at);
CREATE INDEX idx_daily_stats_stat_date ON public.daily_stats(stat_date DESC);

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- ============================================================

-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
