'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

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

    // Auto-generate slug if empty (simple random 6 chars)
    if (!slug || !slug.trim()) {
        slug = Math.random().toString(36).substring(2, 8)
    }
    slug = slug.trim().toLowerCase()

    // 1. Reserved Check
    if (RESERVED_SLUGS.includes(slug)) {
        return { error: `Slug "${slug}" is reserved by the system.` }
    }
    // Check regex (optional: limit special chars)
    if (!/^[a-z0-9-_]+$/.test(slug)) {
        return { error: 'Slug can only contain letters, numbers, hyphens, and underscores.' }
    }

    // 2. Duplicate Check
    const { data: existing } = await supabase
        .from('shortlinks' as any)
        .select('slug')
        .eq('slug', slug)
        .single()

    if (existing) {
        return { error: `Slug "${slug}" is already taken.` }
    }

    // 3. Password Hashing
    let passwordHash = null
    if (password && password.trim()) {
        passwordHash = await bcrypt.hash(password.trim(), 10)
    }

    // 4. Insert
    const { error } = await supabase.from('shortlinks' as any).insert({
        user_id: user.id,
        slug,
        target_url: targetUrl,
        password_hash: passwordHash,
        expires_at: expiresAt || null
    } as any)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/shortlinks')
    return { success: true }
}

export async function deleteShortlink(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('shortlinks' as any)
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
        .from('shortlinks' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return data || []
}

// Logic for Public Redirect [slug] page
export async function getPublicShortlink(slug: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('shortlinks' as any)
        .select('id, target_url, password_hash, expires_at, clicks')
        .eq('slug', slug)
        .single()

    return data
}

export async function incrementClicks(id: string) {
    const supabase = await createClient()
    await supabase.rpc('increment_clicks' as any, { row_id: id } as any)
    // Need RPC or just update? Update is easier if RLS allows public update (unsafe).
    // Better: use direct update with service role OR just ignore click count for now 
    // since public policy is SELECT only.
    // Let's rely on a separate RPC call or admin client later.
    // For now, let's try a direct update but it might fail due to RLS if user is anon.
    // If fail, just ignore.
}

export async function verifyShortlinkPassword(slug: string, passwordInput: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('shortlinks' as any)
        .select('target_url, password_hash')
        .eq('slug', slug)
        .single()

    if (!data || !(data as any).password_hash) return { error: 'Invalid link' }

    const isValid = await bcrypt.compare(passwordInput, (data as any).password_hash)
    if (!isValid) return { error: 'Incorrect Password' }

    return { success: true, url: (data as any).target_url }
}
