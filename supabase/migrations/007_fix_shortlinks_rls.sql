-- Migration 006: Fix Shortlinks RLS Policy
-- Giới hạn public access để không leak sensitive data

-- 1. Drop overly permissive policy
DROP POLICY IF EXISTS "Public can look up shortlinks" ON shortlinks;

-- 2. Create restricted public view (only safe columns)
CREATE OR REPLACE VIEW public_shortlinks AS
SELECT 
    id,
    slug,
    target_url,
    expires_at,
    CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as is_protected,
    clicks
FROM shortlinks;

-- 3. Grant public access to view only
GRANT SELECT ON public_shortlinks TO anon, authenticated;

-- 4. New policy: Only authenticated users can see their own shortlinks
-- Public lookups will use admin client in server actions
CREATE POLICY "Users can manage own shortlinks"
    ON shortlinks FOR ALL
    USING (auth.uid() = user_id);

-- 5. Create function for incrementing clicks (public can call)
CREATE OR REPLACE FUNCTION increment_shortlink_clicks(shortlink_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
BEGIN
    UPDATE shortlinks 
    SET clicks = clicks + 1 
    WHERE id = shortlink_id;
END;
$$;

-- Grant execute to public
GRANT EXECUTE ON FUNCTION increment_shortlink_clicks(UUID) TO anon, authenticated;

-- 6. Add index for performance
CREATE INDEX IF NOT EXISTS idx_shortlinks_slug ON shortlinks(slug);
CREATE INDEX IF NOT EXISTS idx_shortlinks_user_id ON shortlinks(user_id);
CREATE INDEX IF NOT EXISTS idx_shortlinks_expires_at ON shortlinks(expires_at);
