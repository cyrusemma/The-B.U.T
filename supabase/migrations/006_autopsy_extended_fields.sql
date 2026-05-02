-- ============================================================
-- Extended autopsy fields for Claude AI pathologist
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'autopsies' AND column_name = 'official_cause') THEN
    ALTER TABLE public.autopsies ADD COLUMN official_cause TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'autopsies' AND column_name = 'resurrection_difficulty') THEN
    ALTER TABLE public.autopsies ADD COLUMN resurrection_difficulty TEXT
      CHECK (resurrection_difficulty IN ('easy', 'moderate', 'hard'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'autopsies' AND column_name = 'difficulty_reason') THEN
    ALTER TABLE public.autopsies ADD COLUMN difficulty_reason TEXT;
  END IF;
END $$;
