-- Migration 017: Complete admin CRUD permissions

INSERT INTO permissions (key, name, description, module) VALUES
  ('permissions.edit', 'Chỉnh sửa quyền', 'Cập nhật key, tên, mô tả và module của permission', 'permissions'),
  ('backup.delete', 'Xóa backup', 'Xóa metadata và file backup khỏi storage', 'backup')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE name = 'Admin'),
  id
FROM permissions
WHERE key IN ('permissions.edit', 'backup.delete')
ON CONFLICT DO NOTHING;
