-- =============================================
-- USER APPROVAL SYSTEM - FIXED MIGRATION
-- Run this in your Supabase SQL Editor
-- Handles "already exists" gracefully
-- =============================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  approved boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies on profiles to start fresh
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- 3. Security definer functions (bypass RLS, no recursion)
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((SELECT approved FROM public.profiles WHERE id = _user_id), false) $$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = _user_id), false) $$;

-- 4. Simple RLS on profiles - NO recursion
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 5. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  INSERT INTO public.profiles (id, email, approved, is_admin)
  VALUES (NEW.id, NEW.email, user_count = 0, user_count = 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Update data table RLS policies to require approval
-- ACCOUNTS
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'accounts' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.accounts', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "accounts_select" ON public.accounts FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "accounts_insert" ON public.accounts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "accounts_update" ON public.accounts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "accounts_delete" ON public.accounts FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

-- CONTACTS
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'contacts' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.contacts', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "contacts_select" ON public.contacts FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "contacts_insert" ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "contacts_update" ON public.contacts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "contacts_delete" ON public.contacts FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

-- INTERACTIONS
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'interactions' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.interactions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "interactions_select" ON public.interactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "interactions_insert" ON public.interactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "interactions_update" ON public.interactions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "interactions_delete" ON public.interactions FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

-- FOLLOW_UPS
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'follow_ups' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.follow_ups', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "follow_ups_select" ON public.follow_ups FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "follow_ups_insert" ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "follow_ups_update" ON public.follow_ups FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY "follow_ups_delete" ON public.follow_ups FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

-- 7. Create profiles for ALL existing users
-- First user = approved admin, rest = approved non-admin
INSERT INTO public.profiles (id, email, approved, is_admin)
SELECT id, email, true, true FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (id) DO UPDATE SET approved = true, is_admin = true;

INSERT INTO public.profiles (id, email, approved, is_admin)
SELECT id, email, true, false FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET approved = true;
