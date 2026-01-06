-- Migration 002 FIX: Row Level Security Policies (Fixed Circular Dependencies)
-- Fixes the circular dependency issue in admin check policies

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;

DROP POLICY IF EXISTS "Anyone can view permissions" ON permissions;
DROP POLICY IF EXISTS "Only admins can modify permissions" ON permissions;

DROP POLICY IF EXISTS "Anyone can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Only admins can modify role permissions" ON role_permissions;

DROP POLICY IF EXISTS "Anyone can view modules" ON modules;
DROP POLICY IF EXISTS "Only admins can modify modules" ON modules;

DROP POLICY IF EXISTS "Anyone can view settings" ON settings;
DROP POLICY IF EXISTS "Only admins can modify settings" ON settings;

DROP POLICY IF EXISTS "Users can view own logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON audit_logs;

DROP POLICY IF EXISTS "Only admins can view backups" ON backups;
DROP POLICY IF EXISTS "Only admins can create and delete backups" ON backups;

-- ========================================
-- HELPER FUNCTION: Check if user is admin
-- This function uses SECURITY DEFINER to bypass RLS
-- ========================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid() AND r.name = 'Admin'
  );
$$;

-- ========================================
-- RLS cho USER_PROFILES
-- ========================================

-- Policy: User chỉ xem được profile của mình
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: User có thể update profile của mình
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Admin xem được tất cả profiles (using helper function)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin());

-- Policy: Admin có thể update tất cả profiles (using helper function)
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (is_admin());

-- ========================================
-- RLS cho ROLES
-- ========================================

-- Tất cả user đều có thể đọc roles (để hiển thị UI)
CREATE POLICY "Anyone can view roles"
  ON roles FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify roles"
  ON roles FOR ALL
  USING (is_admin());

-- ========================================
-- RLS cho PERMISSIONS
-- ========================================

-- Tất cả user đều có thể đọc permissions
CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify permissions"
  ON permissions FOR ALL
  USING (is_admin());

-- ========================================
-- RLS cho ROLE_PERMISSIONS
-- ========================================

-- Tất cả user đều có thể đọc (để check quyền)
CREATE POLICY "Anyone can view role permissions"
  ON role_permissions FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/DELETE
CREATE POLICY "Only admins can modify role permissions"
  ON role_permissions FOR ALL
  USING (is_admin());

-- ========================================
-- RLS cho MODULES
-- ========================================

-- Tất cả user đều có thể đọc modules
CREATE POLICY "Anyone can view modules"
  ON modules FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify modules"
  ON modules FOR ALL
  USING (is_admin());

-- ========================================
-- RLS cho SETTINGS
-- ========================================

-- Tất cả user đều có thể đọc settings
CREATE POLICY "Anyone can view settings"
  ON settings FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify settings"
  ON settings FOR ALL
  USING (is_admin());

-- ========================================
-- RLS cho AUDIT_LOGS
-- ========================================

-- User chỉ xem được logs của mình
CREATE POLICY "Users can view own logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Admin xem được tất cả logs
CREATE POLICY "Admins can view all logs"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- ========================================
-- RLS cho BACKUPS
-- ========================================

-- Chỉ Admin mới xem được backups
CREATE POLICY "Only admins can view backups"
  ON backups FOR SELECT
  USING (is_admin());

-- Chỉ Admin mới được tạo/xóa backups
CREATE POLICY "Only admins can create and delete backups"
  ON backups FOR INSERT
  WITH CHECK (is_admin());
