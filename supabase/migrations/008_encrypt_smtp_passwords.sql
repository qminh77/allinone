-- Migration 007: Encrypt SMTP Passwords
-- Thay thế plain text passwords bằng encrypted passwords

-- ⚠️ BREAKING CHANGE: Users sẽ cần nhập lại SMTP passwords

-- 1. Add encrypted_password column
ALTER TABLE smtp_configs 
ADD COLUMN encrypted_password TEXT;

-- 2. Drop old password column
-- Note: Existing passwords will be lost, users need to re-enter
ALTER TABLE smtp_configs 
DROP COLUMN IF EXISTS password;

-- 3. Add comment for documentation
COMMENT ON COLUMN smtp_configs.encrypted_password IS 
'AES-256-GCM encrypted password. Encryption key stored in app environment (ENCRYPTION_KEY).';

-- 4. Update RLS policies (if needed)
-- smtp_configs already has RLS enabled from previous migrations
-- Policies remain the same: users can only access their own configs
