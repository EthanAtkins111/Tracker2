-- Fix privilege escalation: prevent non-admin users from promoting themselves
-- to admin or changing their own approved/store_code fields.
--
-- Two separate policies replace the previous single policy:
--   1. Admins can update any profile row, any field (no restrictions).
--   2. Non-admins can only update their own row, and only safe fields
--      (full_name, role). is_admin, approved, and store_code must stay
--      unchanged — enforced by WITH CHECK.

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- Admins: full update access on any profile
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Non-admins: own row only, safe fields only
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() AND NOT public.is_admin(auth.uid()))
  WITH CHECK (
    id        = auth.uid()
    AND is_admin   = (SELECT p.is_admin   FROM public.profiles p WHERE p.id = auth.uid())
    AND approved   = (SELECT p.approved   FROM public.profiles p WHERE p.id = auth.uid())
    AND store_code = (SELECT p.store_code FROM public.profiles p WHERE p.id = auth.uid())
  );
