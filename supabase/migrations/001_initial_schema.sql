-- Migration 001: Initial Schema
-- Tạo các bảng cơ bản cho hệ thống

-- ========================================
-- 1. BẢNG ROLES (Vai trò)
-- ========================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- true = không thể xóa (Admin, User...)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. BẢNG USER_PROFILES (Hồ sơ người dùng)
-- ========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. BẢNG PERMISSIONS (Quyền hạn)
-- ========================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'users.view', 'users.edit', 'tool_a.access'
  name TEXT NOT NULL,
  description TEXT,
  module TEXT, -- 'users', 'tools', 'settings'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. BẢNG ROLE_PERMISSIONS (Gán quyền cho role)
-- ========================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- ========================================
-- 5. BẢNG MODULES (Danh sách module/tool)
-- ========================================
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'text_formatter', 'image_compressor'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- URL hoặc tên icon
  is_enabled BOOLEAN DEFAULT true, -- Admin có thể tắt module
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 6. BẢNG SETTINGS (Cấu hình hệ thống)
-- ========================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY, -- 'allow_registration', 'allow_login'
  value JSONB NOT NULL, -- { "enabled": true }
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ========================================
-- 7. BẢNG AUDIT_LOGS (Nhật ký hệ thống)
-- ========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'role.update', 'module.disable'
  resource_type TEXT, -- 'user', 'role', 'module'
  resource_id UUID,
  metadata JSONB, -- Chi tiết thêm (old_value, new_value...)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes cho audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ========================================
-- 8. BẢNG BACKUPS (Metadata của backup)
-- ========================================
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  type TEXT NOT NULL, -- 'database', 'code'
  size_bytes BIGINT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  storage_path TEXT -- Đường dẫn trong Supabase Storage
);

-- ========================================
-- TRIGGERS: Auto-update updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
