-- Add full_name to profiles and added_by_name to interactions

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS added_by_name text;

-- Update trigger to capture full_name from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
  incoming_store_code text;
  incoming_full_name text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  incoming_store_code := COALESCE(NEW.raw_user_meta_data->>'store_code', 'UNKNOWN');
  incoming_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NULL);
  INSERT INTO public.profiles (id, email, approved, is_admin, store_code, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_count = 0,
    user_count = 0,
    incoming_store_code,
    incoming_full_name
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
