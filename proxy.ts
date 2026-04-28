/**
 * Next.js Proxy - Authentication & Authorization
 * 
 * File này chạy TRƯỚC KHI vào bất kỳ page nào
 * - Kiểm tra user có đăng nhập không
 * - Bảo vệ admin routes sớm; dashboard auth được xử lý trong layout
 * - Bảo vệ admin routes
 * - Apply security headers
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { applySecurityHeaders } from '@/lib/security-headers'

function getModuleRoute(pathname: string) {
    if (pathname.startsWith('/tools/')) {
        const slug = pathname.split('/')[2]
        if (slug) {
            return { key: slug, href: `/tools/${slug}` }
        }
    }

    const dashboardModules = [
        { prefix: '/dashboard/shortlinks', key: 'shortlinks', href: '/dashboard/shortlinks' },
        { prefix: '/dashboard/mail', key: 'mail-system', href: '/dashboard/mail' },
        { prefix: '/dashboard/quiz', key: 'quiz-system', href: '/dashboard/quiz' },
        { prefix: '/dashboard/flashcards', key: 'flashcard-system', href: '/dashboard/flashcards/library' },
        { prefix: '/dashboard/ai', key: 'ai-assistant', href: '/dashboard/ai' },
    ]

    return dashboardModules.find(moduleItem =>
        pathname === moduleItem.prefix || pathname.startsWith(`${moduleItem.prefix}/`)
    ) || null
}

async function getModuleEnabled(
    supabase: ReturnType<typeof createServerClient>,
    route: { key: string; href: string }
) {
    const { data: byKey, error: keyError } = await supabase
        .from('modules')
        .select('is_enabled')
        .eq('key', route.key)
        .maybeSingle()

    if (!keyError && byKey) {
        return byKey.is_enabled !== false
    }

    const { data: byHref, error: hrefError } = await supabase
        .from('modules')
        .select('is_enabled')
        .eq('href', route.href)
        .maybeSingle()

    if (!hrefError && byHref) {
        return byHref.is_enabled !== false
    }

    return true
}

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const { pathname } = request.nextUrl

    // CSRF protection does not require a Supabase round-trip.
    if (pathname.startsWith('/api') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        const origin = request.headers.get('origin')
        const host = request.headers.get('host')

        if (!origin) {
            return applySecurityHeaders(request, new NextResponse('Forbidden: Missing Origin', { status: 403 }))
        }

        try {
            const originUrl = new URL(origin)
            if (originUrl.host !== host) {
                return applySecurityHeaders(request, new NextResponse('Forbidden: CSRF Check Failed', { status: 403 }))
            }
        } catch {
            return applySecurityHeaders(request, new NextResponse('Forbidden: Invalid Origin', { status: 403 }))
        }
    }

    const moduleRoute = getModuleRoute(pathname)
    const needsAuthContext = pathname.startsWith('/admin') || pathname === '/login' || pathname === '/register'
    const needsSupabaseContext = needsAuthContext || Boolean(moduleRoute)

    if (!needsSupabaseContext) {
        return applySecurityHeaders(request, supabaseResponse)
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    if (moduleRoute) {
        const isEnabled = await getModuleEnabled(supabase, moduleRoute)

        if (!isEnabled) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            url.searchParams.set('module', 'disabled')
            return NextResponse.redirect(url)
        }
    }

    if (!needsAuthContext) {
        return applySecurityHeaders(request, supabaseResponse)
    }

    // Validate the session with Supabase Auth. This costs one auth call, but avoids
    // trusting a stale or tampered cookie for protected and admin routes.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Nếu đã login mà vào trang login/register, redirect về dashboard
    if (user && (pathname === '/login' || pathname === '/register')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Admin routes - kiểm tra role Admin ở proxy để chặn sớm.
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }

        // Optimized: Single query with JOIN to get profile + role in one call
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role:roles(name)')
            .eq('id', user.id)
            .single()

        const role = Array.isArray(profile?.role) ? profile.role[0] : profile?.role
        if (!role || role.name !== 'Admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // ✅ Apply security headers to response
    return applySecurityHeaders(request, supabaseResponse)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt (static files)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
