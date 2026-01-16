/**
 * Next.js Middleware - Authentication & Authorization
 * 
 * File này chạy TRƯỚC KHI vào bất kỳ page nào
 * - Kiểm tra user có đăng nhập không
 * - Redirect về login nếu cần
 * - Bảo vệ admin routes
 * - Apply security headers
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { applySecurityHeaders } from '@/lib/security-headers'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
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

    // OPTIMIZATION: Use getSession() instead of getUser() for performance (saves ~200-500ms)
    // getUser() is safer (validates token with server) but slower.
    // getSession() just parses the cookie.
    const {
        data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user

    const { pathname } = request.nextUrl

    // Các route public (không cần login)
    const publicRoutes = ['/', '/login', '/register']
    const isPublicRoute = publicRoutes.some(route => pathname === route)

    // Nếu chưa login và đang truy cập route cần auth
    if (!user && !isPublicRoute && pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    // Nếu đã login mà vào trang login/register, redirect về dashboard
    if (user && (pathname === '/login' || pathname === '/register')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // ✅ CSRF Protection for API routes (state-changing requests)
    if (pathname.startsWith('/api') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        const origin = request.headers.get('origin')
        const host = request.headers.get('host')

        // Skip check if no origin (e.g. server-to-server or non-browser)
        // STRICT MODE: Uncomment following line to enforce origin presence
        // if (!origin) return new NextResponse('Forbidden: Missing Origin', { status: 403 })

        if (origin) {
            try {
                const originUrl = new URL(origin)
                // Allow requests from same host
                if (originUrl.host !== host) {
                    return new NextResponse('Forbidden: CSRF Check Failed', { status: 403 })
                }
            } catch {
                return new NextResponse('Forbidden: Invalid Origin', { status: 403 })
            }
        }
    }

    // Admin routes - kiểm tra role Admin
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

        // @ts-ignore - role is a joined object
        if (!profile?.role || profile.role.name !== 'Admin') {
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
