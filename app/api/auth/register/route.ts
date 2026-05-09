/**
 * API Route: Register
 * POST /api/auth/register
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin'
import { createAuditLog, getRequestInfo } from '@/lib/audit/log'
import { sanitizeErrorMessage, logError } from '@/lib/error-handling'
import { validatePasswordStrength } from '@/lib/password-policy'
import { checkRateLimit, getClientIdentifier, RateLimits } from '@/lib/rate-limit'
import { resolveBootstrapRoleId } from '@/lib/auth/bootstrap'

export async function POST(request: Request) {
    try {
        await checkRateLimit(
            `register:${getClientIdentifier(request)}`,
            RateLimits.REGISTER.limit,
            RateLimits.REGISTER.window
        )

        const { email, password, fullName } = await request.json()

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email và mật khẩu là bắt buộc' },
                { status: 400 }
            )
        }

        // ✅ Validate Password Strength
        const passwordCheck = await validatePasswordStrength(password)
        if (!passwordCheck.isValid) {
            return NextResponse.json(
                {
                    error: 'Password too weak: ' + passwordCheck.errors.join('. '),
                    feedback: passwordCheck.feedback
                },
                { status: 400 }
            )
        }

        // Kiểm tra setting allow_registration
        const supabase = await createClient()
        const { data: setting } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'allow_registration')
            .single() as { data: any }

        if (setting && !setting.value?.enabled) {
            return NextResponse.json(
                { error: 'Đăng ký tạm thời đóng' },
                { status: 403 }
            )
        }

        if (!isAdminClientConfigured()) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName || undefined,
                    },
                },
            })

            if (signUpError) {
                if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already been registered')) {
                    return NextResponse.json(
                        { error: 'Email này đã được sử dụng. Vui lòng đăng nhập.' },
                        { status: 400 }
                    )
                }

                return NextResponse.json(
                    { error: signUpError.message || 'Không thể tạo tài khoản' },
                    { status: 400 }
                )
            }

            const { ipAddress, userAgent } = getRequestInfo(request)
            await createAuditLog({
                userId: signUpData.user?.id,
                action: 'register',
                metadata: { email, full_name: fullName, role: 'trigger-managed' },
                ipAddress,
                userAgent,
            })

            return NextResponse.json({
                success: true,
                message: 'Đăng ký thành công. Nếu Supabase bật xác thực email, vui lòng kiểm tra hộp thư trước khi đăng nhập.',
                requiresEmailConfirmation: !signUpData.session,
            })
        }

        // Tạo user trong Supabase Auth bằng service role để auto-confirm.
        const adminClient = createAdminClient()

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password,
            user_metadata: {
                full_name: fullName || undefined,
            },
            email_confirm: true, // Auto confirm email
        })

        if (authError || !authData.user) {
            console.error('Supabase Auth Create Error:', authError)

            // Handle "User already registered" specifically
            if (authError?.code === 'email_exists' || authError?.message?.includes('already been registered')) {
                return NextResponse.json(
                    { error: 'Email này đã được sử dụng. Vui lòng đăng nhập.' },
                    { status: 400 }
                )
            }

            return NextResponse.json(
                { error: authError?.message || 'Không thể tạo tài khoản' },
                { status: 400 }
            )
        }

        const { roleId, roleName } = await resolveBootstrapRoleId(adminClient as any, email)

        // Tạo profile trong user_profiles
        const { error: profileError } = await adminClient
            .from('user_profiles')
            .upsert({
                id: authData.user.id,
                full_name: fullName || null,
                role_id: roleId || null,
                is_active: true,
            } as any, { onConflict: 'id' })

        if (profileError) {
            console.error('Error creating profile:', profileError)
            // User đã được tạo trong auth, nhưng profile lỗi
            // Có thể xử lý rollback hoặc để user tự hoàn thiện profile
        }

        // Ghi audit log
        const { ipAddress, userAgent } = getRequestInfo(request)
        await createAuditLog({
            userId: authData.user.id,
            action: 'register',
            metadata: { email, full_name: fullName, role: roleName },
            ipAddress,
            userAgent,
        })

        return NextResponse.json({
            success: true,
            message: 'Đăng ký thành công',
        })
    } catch (error: any) {
        if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
            return NextResponse.json(
                { error: error.message },
                { status: 429 }
            )
        }
        logError(error, { action: 'register' })
        return NextResponse.json(
            { error: sanitizeErrorMessage(error) },
            { status: 500 }
        )
    }
}
