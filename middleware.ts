/**
 * Next.js Middleware - Authentication & Authorization
 * 
 * File này chạy TRƯỚC KHI vào bất kỳ page nào
 * - Kiểm tra user có đăng nhập không
 * - Redirect về login nếu cần
 * - Bảo vệ admin routes
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

    const {
        data: { user },
    } = await supabase.auth.getUser()

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

    // Admin routes - kiểm tra role Admin
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }

        // Kiểm tra role (cần query database)
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role:roles(name)')
            .eq('id', user.id)
            .single()

        // @ts-ignore - Type checking phức tạp
        if (!profile || profile.role?.name !== 'Admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
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
