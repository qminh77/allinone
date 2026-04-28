-- Migration 020: Admin RLS stability
-- Keep admin CRUD working under RLS for databases that do not use service-role
-- writes, and harden the SECURITY DEFINER admin check search path.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = auth.uid() AND r.name = 'Admin'
  );
$$;

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;

CREATE POLICY "Admins can insert profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (public.is_admin());
