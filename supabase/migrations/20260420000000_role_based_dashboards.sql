-- Allow store members to view each other's profiles
-- Required for Manager and role-based dashboards to identify teammates
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.is_admin(auth.uid())
    OR store_code = public.get_my_store_code()
  );

-- Update handle_new_user to capture role selected at signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, store_code, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'store_code', ''))),
    COALESCE(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    COALESCE(TRIM(NEW.raw_user_meta_data->>'role'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    store_code = EXCLUDED.store_code,
    full_name  = EXCLUDED.full_name,
    role       = COALESCE(NULLIF(EXCLUDED.role, ''), profiles.role);
  RETURN NEW;
END;
$$;
