-- Add role to profiles and added_by_email to interactions

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text;

ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS added_by_email text;
