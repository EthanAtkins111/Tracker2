-- Allow admins to see and manage users from all stores, not just their own.

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- Admins can see every profile; regular users can only see their own.
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- Admins can update any profile regardless of store.
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
