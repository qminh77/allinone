-- Migration 002: Row Level Security Policies
-- Cấu hình bảo mật ở mức database

-- ========================================
-- RLS cho USER_PROFILES
-- ========================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: User chỉ xem được profile của mình
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: User có thể update profile của mình
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Admin xem được tất cả profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- Policy: Admin có thể update tất cả profiles
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- ========================================
-- RLS cho ROLES
-- ========================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Tất cả user đều có thể đọc roles (để hiển thị UI)
CREATE POLICY "Anyone can view roles"
  ON roles FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify roles"
  ON roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- ========================================
-- RLS cho PERMISSIONS
-- ========================================
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Tất cả user đều có thể đọc permissions
CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify permissions"
  ON permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- ========================================
-- RLS cho ROLE_PERMISSIONS
-- ========================================
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Tất cả user đều có thể đọc (để check quyền)
CREATE POLICY "Anyone can view role permissions"
  ON role_permissions FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/DELETE
CREATE POLICY "Only admins can modify role permissions"
  ON role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- ========================================
-- RLS cho MODULES
-- ========================================
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Tất cả user đều có thể đọc modules
CREATE POLICY "Anyone can view modules"
  ON modules FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify modules"
  ON modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- ========================================
-- RLS cho SETTINGS
-- ========================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Tất cả user đều có thể đọc settings
CREATE POLICY "Anyone can view settings"
  ON settings FOR SELECT
  USING (true);

-- Chỉ Admin mới được INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can modify settings"
  ON settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- ========================================
-- RLS cho AUDIT_LOGS
-- ========================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User chỉ xem được logs của mình
CREATE POLICY "Users can view own logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Admin xem được tất cả logs
CREATE POLICY "Admins can view all logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- Không cho phép user tự tạo/sửa/xóa logs (chỉ service_role)
-- Logs sẽ được tạo từ API routes dùng admin client

-- ========================================
-- RLS cho BACKUPS
-- ========================================
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Chỉ Admin mới xem được backups
CREATE POLICY "Only admins can view backups"
  ON backups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- Chỉ Admin mới được tạo/xóa backups
CREATE POLICY "Only admins can create and delete backups"
  ON backups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );
