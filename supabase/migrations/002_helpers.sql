-- Helper functions for increment operations

CREATE OR REPLACE FUNCTION increment_daily_stat(p_date DATE, p_column TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'INSERT INTO public.daily_stats (stat_date, %I) VALUES ($1, 1)
     ON CONFLICT (stat_date)
     DO UPDATE SET %I = public.daily_stats.%I + 1',
    p_column, p_column, p_column
  ) USING p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_autopsy_comment_count(p_autopsy_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.autopsies
  SET community_diagnosis_count = community_diagnosis_count + 1
  WHERE id = p_autopsy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unique constraint on daily_stats date
ALTER TABLE public.daily_stats ADD CONSTRAINT daily_stats_date_unique UNIQUE (stat_date);

-- Storage policies for project-files bucket
-- Run these after creating the bucket in Supabase dashboard:

-- CREATE POLICY "Users upload own files" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'project-files' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Authenticated users download files" ON storage.objects
--   FOR SELECT USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

-- CREATE POLICY "Public avatars" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

-- CREATE POLICY "Users upload own avatars" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'avatars' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
