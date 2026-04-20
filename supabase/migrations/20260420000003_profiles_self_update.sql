-- Allow users to update their own profile (name, role).
-- Admins can update any profile (to approve, toggle admin, etc.).
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));
