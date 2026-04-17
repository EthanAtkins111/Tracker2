-- ============================================================
-- Store Code Multi-Tenancy Migration
-- Run once in the Supabase SQL Editor.
-- Migrates all existing data to store_code = 'OW-STC'.
-- ============================================================

-- 1. Add store_code to profiles (nullable first so existing rows don't break)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_code text;
UPDATE public.profiles SET store_code = 'OW-STC' WHERE store_code IS NULL;
ALTER TABLE public.profiles ALTER COLUMN store_code SET NOT NULL;

-- 2. Add store_code to data tables
ALTER TABLE public.accounts     ADD COLUMN IF NOT EXISTS store_code text;
ALTER TABLE public.contacts     ADD COLUMN IF NOT EXISTS store_code text;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS store_code text;
ALTER TABLE public.follow_ups   ADD COLUMN IF NOT EXISTS store_code text;

-- 3. Migrate existing data to OW-STC
UPDATE public.accounts     SET store_code = 'OW-STC' WHERE store_code IS NULL;
UPDATE public.contacts     SET store_code = 'OW-STC' WHERE store_code IS NULL;
UPDATE public.interactions SET store_code = 'OW-STC' WHERE store_code IS NULL;
UPDATE public.follow_ups   SET store_code = 'OW-STC' WHERE store_code IS NULL;

-- 4. Enforce NOT NULL on data tables
ALTER TABLE public.accounts     ALTER COLUMN store_code SET NOT NULL;
ALTER TABLE public.contacts     ALTER COLUMN store_code SET NOT NULL;
ALTER TABLE public.interactions ALTER COLUMN store_code SET NOT NULL;
ALTER TABLE public.follow_ups   ALTER COLUMN store_code SET NOT NULL;

-- 5. Helper function used by all RLS policies
CREATE OR REPLACE FUNCTION public.get_my_store_code()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT store_code FROM public.profiles WHERE id = auth.uid() $$;

-- 6. Update handle_new_user trigger to read store_code from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
  incoming_store_code text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  incoming_store_code := COALESCE(NEW.raw_user_meta_data->>'store_code', 'UNKNOWN');
  INSERT INTO public.profiles (id, email, approved, is_admin, store_code)
  VALUES (
    NEW.id,
    NEW.email,
    user_count = 0,
    user_count = 0,
    incoming_store_code
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 7a. Replace RLS policies on accounts
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'accounts' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.accounts', pol.policyname); END LOOP;
END $$;
CREATE POLICY "accounts_select" ON public.accounts FOR SELECT TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "accounts_insert" ON public.accounts FOR INSERT TO authenticated
  WITH CHECK (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "accounts_update" ON public.accounts FOR UPDATE TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "accounts_delete" ON public.accounts FOR DELETE TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));

-- 7b. Replace RLS policies on contacts
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'contacts' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.contacts', pol.policyname); END LOOP;
END $$;
CREATE POLICY "contacts_select" ON public.contacts FOR SELECT TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "contacts_insert" ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "contacts_update" ON public.contacts FOR UPDATE TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "contacts_delete" ON public.contacts FOR DELETE TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));

-- 7c. Replace RLS policies on interactions
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'interactions' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.interactions', pol.policyname); END LOOP;
END $$;
CREATE POLICY "interactions_select" ON public.interactions FOR SELECT TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "interactions_insert" ON public.interactions FOR INSERT TO authenticated
  WITH CHECK (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "interactions_update" ON public.interactions FOR UPDATE TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "interactions_delete" ON public.interactions FOR DELETE TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));

-- 7d. Replace RLS policies on follow_ups
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'follow_ups' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.follow_ups', pol.policyname); END LOOP;
END $$;
CREATE POLICY "follow_ups_select" ON public.follow_ups FOR SELECT TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "follow_ups_insert" ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "follow_ups_update" ON public.follow_ups FOR UPDATE TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));
CREATE POLICY "follow_ups_delete" ON public.follow_ups FOR DELETE TO authenticated
  USING (store_code = public.get_my_store_code() AND public.is_approved(auth.uid()));

-- 8. Update profiles RLS: admins can only see/manage users in their own store
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname); END LOOP;
END $$;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (public.is_admin(auth.uid()) AND store_code = public.get_my_store_code())
  );
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) AND store_code = public.get_my_store_code());

-- 9. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_store_code      ON public.accounts(store_code);
CREATE INDEX IF NOT EXISTS idx_contacts_store_code      ON public.contacts(store_code);
CREATE INDEX IF NOT EXISTS idx_interactions_store_code  ON public.interactions(store_code);
CREATE INDEX IF NOT EXISTS idx_follow_ups_store_code    ON public.follow_ups(store_code);
