-- Fix 1: Restrict profiles visibility to own profile only
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON profiles;

CREATE POLICY "Usuários podem ver seu próprio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Fix 2: Make storage buckets private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('avatars', 'project-references');

-- Add RLS policies for storage.objects

-- Avatars bucket policies
CREATE POLICY "Users can view their own avatars" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Project references bucket policies
CREATE POLICY "Users can view their project references" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'project-references' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their project references" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'project-references' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their project references" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'project-references' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their project references" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'project-references' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );