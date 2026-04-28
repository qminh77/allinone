-- Migration 011: Security hardening for existing databases
-- Keeps cloud/local databases safe even if earlier migrations already ran.

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can create and delete backups" ON backups;
DROP POLICY IF EXISTS "Only admins can create backups" ON backups;
DROP POLICY IF EXISTS "Only admins can delete backups" ON backups;

CREATE POLICY "Only admins can create backups"
  ON backups FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete backups"
  ON backups FOR DELETE
  USING (is_admin());
