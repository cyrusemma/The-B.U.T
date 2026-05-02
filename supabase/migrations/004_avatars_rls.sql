-- ============================================================
-- AVATARS STORAGE RLS POLICIES
-- ============================================================

-- Policy 1: Allow authenticated users to upload their own avatars
CREATE POLICY "Users upload own avatars" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 2: Allow public read access to avatars
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy 3: Allow authenticated users to update their own avatars
CREATE POLICY "Users update own avatars" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 4: Allow authenticated users to delete their own avatars
CREATE POLICY "Users delete own avatars" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
