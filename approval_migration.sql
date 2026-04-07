-- =============================================
-- USER APPROVAL SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create profiles table with approved flag
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  approved boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. RLS: Users can read their own profile; admins can read all
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 3. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, approved, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    -- First user is auto-approved and admin
    (SELECT COUNT(*) = 0 FROM public.profiles),
    (SELECT COUNT(*) = 0 FROM public.profiles)
  );
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Security definer function to check approval (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND approved = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND is_admin = true
  )
$$;

-- 5. Update RLS on data tables to require approval
-- Accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

CREATE POLICY "Approved users can view own accounts"
  ON public.accounts FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can insert own accounts"
  ON public.accounts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can update own accounts"
  ON public.accounts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can delete own accounts"
  ON public.accounts FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

-- Contacts
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;

CREATE POLICY "Approved users can view own contacts"
  ON public.contacts FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can insert own contacts"
  ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can update own contacts"
  ON public.contacts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can delete own contacts"
  ON public.contacts FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

-- Interactions
DROP POLICY IF EXISTS "Users can view own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can insert own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can update own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can delete own interactions" ON public.interactions;

CREATE POLICY "Approved users can view own interactions"
  ON public.interactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can insert own interactions"
  ON public.interactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can update own interactions"
  ON public.interactions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can delete own interactions"
  ON public.interactions FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

-- Follow-ups
DROP POLICY IF EXISTS "Users can view own follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can insert own follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can update own follow_ups" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can delete own follow_ups" ON public.follow_ups;

CREATE POLICY "Approved users can view own follow_ups"
  ON public.follow_ups FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can insert own follow_ups"
  ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can update own follow_ups"
  ON public.follow_ups FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

CREATE POLICY "Approved users can delete own follow_ups"
  ON public.follow_ups FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_approved(auth.uid()));

-- 6. Create profile for existing users (if any)
INSERT INTO public.profiles (id, email, approved, is_admin)
SELECT id, email, true, true FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ORDER BY created_at ASC
LIMIT 1;

-- Add remaining existing users as approved (non-admin)
INSERT INTO public.profiles (id, email, approved, is_admin)
SELECT id, email, true, false FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
