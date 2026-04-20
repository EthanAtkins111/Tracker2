-- Sales Admin → Rep assignment table
-- Each Sales Admin can assign Sales Reps to themselves within the same store.
-- A rep can appear on multiple admins' dashboards (no restriction).
CREATE TABLE IF NOT EXISTS public.sales_admin_assignments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rep_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_code  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_user_id, rep_user_id)
);

ALTER TABLE public.sales_admin_assignments ENABLE ROW LEVEL SECURITY;

-- Each Sales Admin sees only their own assignments
CREATE POLICY "saa_select" ON public.sales_admin_assignments
  FOR SELECT USING (admin_user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Can only create assignments for yourself, within your store
CREATE POLICY "saa_insert" ON public.sales_admin_assignments
  FOR INSERT WITH CHECK (
    admin_user_id = auth.uid()
    AND store_code = public.get_my_store_code()
  );

-- Can only remove your own assignments
CREATE POLICY "saa_delete" ON public.sales_admin_assignments
  FOR DELETE USING (admin_user_id = auth.uid());
