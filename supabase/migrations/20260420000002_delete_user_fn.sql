-- Admin-only RPC to fully delete a user from auth.users.
-- The profiles row cascades automatically via FK.
-- The deleted user can sign up again freely with the same email.
CREATE OR REPLACE FUNCTION public.delete_user(user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;
