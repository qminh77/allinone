'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { checkRateLimit, RateLimits } from '@/lib/rate-limit'
import { randomBytes } from 'crypto'
import { UrlSchema, SlugSchema } from '@/lib/validation'
import type { Database } from '@/types/database'

type ShortlinkRow = Database['public']['Tables']['shortlinks']['Row']
type ShortlinkInsert = Database['public']['Tables']['shortlinks']['Insert']
type PublicShortlink = Pick<ShortlinkRow, 'id' | 'target_url' | 'password_hash' | 'expires_at'>
type PasswordShortlink = Pick<ShortlinkRow, 'id' | 'target_url' | 'password_hash'>

const RESERVED_SLUGS = [
    'admin', 'admincp', 'dashboard', 'auth', 'api', 'tools', 'settings',
    'login', 'register', 'profile', 'static', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
    'public', 'assets', 'monitoring', 'health', 'system', 'root'
]

export async function createShortlink(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const targetUrl = formData.get('target_url') as string
    let slug = formData.get('slug') as string
    const password = formData.get('password') as string
    const expiresAt = formData.get('expires_at') as string

    if (!targetUrl) return { error: 'Target URL is required' }

    // ✅ Validate URL to prevent SSRF
    const urlValidation = UrlSchema.safeParse(targetUrl)
    if (!urlValidation.success) {
        return { error: 'Invalid URL: ' + urlValidation.error.issues[0].message }
    }

    // ✅ Auto-generate slug with cryptographically secure random
    if (!slug || !slug.trim()) {
        slug = randomBytes(4).toString('base64url') // Secure random
    }
    slug = slug.trim().toLowerCase()

    // ✅ Validate slug format
    const slugValidation = SlugSchema.safeParse(slug)
    if (!slugValidation.success) {
        return { error: 'Invalid slug: ' + slugValidation.error.issues[0].message }
    }

    slug = slugValidation.data

    // 1. Reserved Check
    if (RESERVED_SLUGS.includes(slug)) {
        return { error: `Slug "${slug}" is reserved by the system.` }
    }
    // Check regex (optional: limit special chars)
    if (!/^[a-z0-9-_]+$/.test(slug)) {
        return { error: 'Slug can only contain letters, numbers, hyphens, and underscores.' }
    }

    // 2. Duplicate Check - OPTIMIZED: Reliance on DB unique constraint to save 1 RTT
    // The insert below will fail if slug exists.
    // skipped manual select.

    // 3. Password Hashing
    let passwordHash: string | null = null
    if (password && password.trim()) {
        passwordHash = await bcrypt.hash(password.trim(), 10)
    }

    // 4. Insert
    const insertPayload: ShortlinkInsert = {
        user_id: user.id,
        slug,
        target_url: targetUrl,
        password_hash: passwordHash,
        expires_at: expiresAt || null
    }

    const { error } = await supabase.from('shortlinks').insert(insertPayload as never)

    if (error) {
        // Handle unique constraint violation (duplicate slug)
        if (error.code === '23505') {
            return { error: `Slug "${slug}" is already taken.` }
        }
        return { error: error.message }
    }

    revalidatePath('/dashboard/shortlinks')
    return { success: true, slug }
}

export async function deleteShortlink(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('shortlinks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/shortlinks')
    return { success: true }
}

export async function getShortlinks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('shortlinks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return data || []
}

// Logic for Public Redirect [slug] page
// ✅ Use admin client to bypass RLS (controlled access)
export async function getPublicShortlink(slug: string) {
    const supabase = createAdminClient()

    const { data } = await supabase
        .from('shortlinks')
        .select('id, target_url, password_hash, expires_at')
        .eq('slug', slug)
        .single()

    return data as PublicShortlink | null
}

// ✅ Use secure function to increment clicks
export async function incrementClicks(id: string) {
    const supabase = createAdminClient()
    // Call the SECURITY DEFINER function from migration
    await supabase.rpc('increment_shortlink_clicks', { shortlink_id: id } as never)
}

export async function verifyShortlinkPassword(slug: string, passwordInput: string) {
    // ✅ Rate limit password attempts
    try {
        await checkRateLimit(
            `shortlink:verify:${slug}`,
            RateLimits.SHORTLINK_PASSWORD_VERIFY.limit,
            RateLimits.SHORTLINK_PASSWORD_VERIFY.window
        )
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Too many attempts' }
    }

    const supabase = createAdminClient()
    const { data } = await supabase
        .from('shortlinks')
        .select('id, target_url, password_hash')
        .eq('slug', slug)
        .single()

    const shortlink = data as PasswordShortlink | null

    if (!shortlink?.password_hash) {
        // ✅ Add delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { error: 'Invalid link' }
    }

    const isValid = await bcrypt.compare(passwordInput, shortlink.password_hash)

    if (!isValid) {
        // ✅ Add delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { error: 'Incorrect Password' }
    }

    await incrementClicks(shortlink.id)
    return { success: true, url: shortlink.target_url }
}
