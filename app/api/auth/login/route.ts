import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email và mật khẩu là bắt buộc' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: loginSetting, error: settingError } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'allow_login')
            .maybeSingle()
        const loginSettingWithValue = loginSetting as { value?: { enabled?: boolean } | null } | null

        if (!settingError && loginSettingWithValue && loginSettingWithValue.value?.enabled === false) {
            return NextResponse.json({ error: 'Đăng nhập đang tạm thời đóng' }, { status: 403 })
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error || !data.user) {
            return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 })
        }

        return NextResponse.json({ success: true, userId: data.user.id })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Đã có lỗi xảy ra' },
            { status: 500 }
        )
    }
}
