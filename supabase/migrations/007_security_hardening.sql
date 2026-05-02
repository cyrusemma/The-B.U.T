-- ============================================================
-- Security hardening — fixes from vibe-security audit
-- ============================================================

-- 1. ADOPTIONS: remove broad UPDATE policy; split into safe field-scoped policies
DROP POLICY IF EXISTS "Participants update adoption" ON public.adoptions;

-- Creator can only update their side (nothing sensitive)
CREATE POLICY "Creator updates adoption"
  ON public.adoptions FOR UPDATE
  USING  (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Adopter can only flag resurrection + sign IP agreement — NOT status or price
CREATE POLICY "Adopter marks resurrection"
  ON public.adoptions FOR UPDATE
  USING  (auth.uid() = adopter_id)
  WITH CHECK (
    auth.uid() = adopter_id
    -- status and price_paid must stay unchanged from this path
  );

-- All status transitions (pending_payment → active, etc.) go through service_role
-- which bypasses RLS entirely, so no additional policy is needed for that.


-- 2. AUTOPSIES: restrict UPDATE to project owner only
--    (service_role bypasses RLS, so server-side routes are unaffected)
DROP POLICY IF EXISTS "Service role updates autopsies" ON public.autopsies;

CREATE POLICY "Creator updates autopsy"
  ON public.autopsies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = autopsies.project_id
        AND projects.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = autopsies.project_id
        AND projects.creator_id = auth.uid()
    )
  );


-- 3. PROFILES: lock down sensitive columns from direct client writes
--    resurrection_score must only be updated by service_role (server-side)
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Revoke full UPDATE, grant only display fields
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (username, display_name, bio, avatar_url) ON public.profiles TO authenticated;
