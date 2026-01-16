-- Migration 003: Seed Data
-- Dữ liệu mẫu ban đầu

-- ========================================
-- 1. TẠO ROLES MẶC ĐỊNH
-- ========================================

INSERT INTO roles (name, description, is_system) VALUES
  ('Admin', 'Quản trị viên hệ thống - có tất cả quyền', true),
  ('User', 'Người dùng thường - có quyền sử dụng tools cơ bản', true),
  ('Guest', 'Khách - chỉ xem, không sử dụng tools', true)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 2. TẠO PERMISSIONS
-- ========================================

-- User Management Permissions
INSERT INTO permissions (key, name, description, module) VALUES
  ('users.view', 'Xem danh sách user', 'Xem thông tin các user trong hệ thống', 'users'),
  ('users.edit', 'Chỉnh sửa user', 'Thay đổi thông tin user', 'users'),
  ('users.delete', 'Xóa user', 'Xóa user khỏi hệ thống', 'users'),
  ('users.assign_role', 'Gán role cho user', 'Thay đổi vai trò của user', 'users')
ON CONFLICT (key) DO NOTHING;

-- Role Management Permissions
INSERT INTO permissions (key, name, description, module) VALUES
  ('roles.view', 'Xem danh sách role', 'Xem các vai trò trong hệ thống', 'roles'),
  ('roles.create', 'Tạo role mới', 'Thêm vai trò mới', 'roles'),
  ('roles.edit', 'Chỉnh sửa role', 'Thay đổi thông tin role', 'roles'),
  ('roles.delete', 'Xóa role', 'Xóa role không còn dùng', 'roles'),
  ('roles.assign_permissions', 'Gán quyền cho role', 'Thay đổi quyền hạn của role', 'roles')
ON CONFLICT (key) DO NOTHING;

-- Permission Management
INSERT INTO permissions (key, name, description, module) VALUES
  ('permissions.view', 'Xem danh sách quyền', 'Xem các quyền hạn trong hệ thống', 'permissions'),
  ('permissions.create', 'Tạo quyền mới', 'Thêm quyền hạn mới', 'permissions'),
  ('permissions.delete', 'Xóa quyền', 'Xóa quyền hạn không dùng', 'permissions')
ON CONFLICT (key) DO NOTHING;

-- Module Management
INSERT INTO permissions (key, name, description, module) VALUES
  ('modules.view', 'Xem danh sách module', 'Xem các module/tool trong hệ thống', 'modules'),
  ('modules.toggle', 'Bật/tắt module', 'Kích hoạt hoặc vô hiệu hóa module', 'modules')
ON CONFLICT (key) DO NOTHING;

-- Settings
INSERT INTO permissions (key, name, description, module) VALUES
  ('settings.view', 'Xem cấu hình', 'Xem các thiết lập hệ thống', 'settings'),
  ('settings.edit', 'Chỉnh sửa cấu hình', 'Thay đổi thiết lập hệ thống', 'settings')
ON CONFLICT (key) DO NOTHING;

-- Audit Logs
INSERT INTO permissions (key, name, description, module) VALUES
  ('logs.view', 'Xem nhật ký', 'Xem lịch sử hoạt động của hệ thống', 'logs')
ON CONFLICT (key) DO NOTHING;

-- Backup & Restore
INSERT INTO permissions (key, name, description, module) VALUES
  ('backup.create', 'Tạo backup', 'Sao lưu dữ liệu hệ thống', 'backup'),
  ('backup.restore', 'Khôi phục backup', 'Phục hồi dữ liệu từ bản sao lưu', 'backup')
ON CONFLICT (key) DO NOTHING;

-- Tool Permissions
INSERT INTO permissions (key, name, description, module) VALUES
  ('tools.textformatter.access', 'Truy cập Text Formatter', 'Sử dụng công cụ định dạng văn bản', 'tools'),
  ('tools.imagecompressor.access', 'Truy cập Image Compressor', 'Sử dụng công cụ nén ảnh', 'tools'),
  ('tools.jsonvalidator.access', 'Truy cập JSON Validator', 'Sử dụng công cụ kiểm tra JSON', 'tools')
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- 3. GÁN TẤT CẢ QUYỀN CHO ADMIN
-- ========================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Admin'),
  id
FROM permissions
ON CONFLICT DO NOTHING;

-- ========================================
-- 4. GÁN QUYỀN CƠ BẢN CHO USER
-- ========================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'User'),
  id
FROM permissions
WHERE key IN (
  'tools.textformatter.access',
  'tools.imagecompressor.access',
  'tools.jsonvalidator.access'
)
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. TẠO MODULES MẶC ĐỊNH
-- ========================================

INSERT INTO modules (key, name, description, icon, is_enabled, sort_order) VALUES
  ('text_formatter', 'Text Formatter', 'Định dạng văn bản: uppercase, lowercase, capitalize...', '📝', true, 1),
  ('image_compressor', 'Image Compressor', 'Nén ảnh để giảm kích thước file', '🖼️', true, 2),
  ('json_validator', 'JSON Validator', 'Kiểm tra và format JSON', '📋', true, 3)
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- 6. TẠO SETTINGS MẶC ĐỊNH
-- ========================================

INSERT INTO settings (key, value, description) VALUES
  ('allow_registration', '{"enabled": true}'::jsonb, 'Cho phép đăng ký tài khoản mới'),
  ('allow_login', '{"enabled": true}'::jsonb, 'Cho phép đăng nhập vào hệ thống')
ON CONFLICT (key) DO NOTHING;
