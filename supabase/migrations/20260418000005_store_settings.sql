CREATE TABLE IF NOT EXISTS public.store_settings (
  store_code text PRIMARY KEY,
  custom_roles text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_my_store_code()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT store_code FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "store_settings_select" ON public.store_settings
  FOR SELECT TO authenticated
  USING (store_code = public.get_my_store_code());

CREATE POLICY "store_settings_upsert" ON public.store_settings
  FOR ALL TO authenticated
  USING (store_code = public.get_my_store_code())
  WITH CHECK (store_code = public.get_my_store_code());
