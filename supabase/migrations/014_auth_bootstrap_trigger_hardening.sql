-- Migration 014: Harden auth profile bootstrap for Supabase Cloud signups
-- Supports registration even when the app uses public Supabase Auth signup.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id uuid;
  admin_role_id uuid;
  target_role_id uuid;
  has_admin boolean;
BEGIN
  -- Prevent two concurrent first signups from both becoming Admin.
  PERFORM pg_advisory_xact_lock(hashtext('allinone_bootstrap_admin'));

  SELECT id INTO default_role_id
  FROM roles
  WHERE name = 'User'
  LIMIT 1;

  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'Admin'
  LIMIT 1;

  SELECT EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE r.name = 'Admin'
  ) INTO has_admin;

  target_role_id := CASE
    WHEN admin_role_id IS NOT NULL AND NOT has_admin THEN admin_role_id
    ELSE default_role_id
  END;

  INSERT INTO user_profiles (id, full_name, role_id, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    target_role_id,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
