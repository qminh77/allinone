-- Migration 003: Performance Indexes
-- Add indexes to optimize query performance

-- ========================================
-- Index for user_profiles JOIN with roles
-- ========================================
-- Speeds up the middleware auth check that JOINs user_profiles with roles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id 
ON user_profiles(role_id);

-- ========================================
-- Indexes for audit_logs queries
-- ========================================
-- Composite index for sorted queries with user filter
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_user 
ON audit_logs(created_at DESC, user_id);

-- Single column index for user_id lookups (already exists from schema)
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- ========================================
-- Index for backups queries
-- ========================================
-- Speeds up sorted backup queries
CREATE INDEX IF NOT EXISTS idx_backups_created_at 
ON backups(created_at DESC);

-- ========================================
-- Index for user_profiles ordering
-- ========================================
-- Speeds up admin users page sorted by created_at
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at 
ON user_profiles(created_at DESC);
