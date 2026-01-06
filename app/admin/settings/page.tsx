/**
 * Admin Settings Page
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
    const supabase = createClient()
    const [allowRegistration, setAllowRegistration] = useState(true)
    const [allowLogin, setAllowLogin] = useState(true)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        const { data: settings } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', ['allow_registration', 'allow_login'])

        settings?.forEach((setting) => {
            if (setting.key === 'allow_registration') {
                setAllowRegistration(setting.value?.enabled || false)
            }
            if (setting.key === 'allow_login') {
                setAllowLogin(setting.value?.enabled || false)
            }
        })

        setLoading(false)
    }

    const updateSetting = async (key: string, enabled: boolean) => {
        try {
            const { error } = await supabase
                .from('settings')
                .update({
                    value: { enabled },
                    updated_at: new Date().toISOString(),
                })
                .eq('key', key)

            if (error) throw error

            toast.success('Cập nhật thành công')

            // Log audit
            await fetch('/api/audit/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'settings.update',
                    metadata: { key, value: { enabled } },
                }),
            })
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra')
        }
    }

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cấu hình hệ thống</CardTitle>
                <CardDescription>
                    Quản lý các thiết lập chung của website
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Cho phép đăng ký</Label>
                        <p className="text-sm text-muted-foreground">
                            Người dùng mới có thể tạo tài khoản
                        </p>
                    </div>
                    <Switch
                        checked={allowRegistration}
                        onCheckedChange={(checked) => {
                            setAllowRegistration(checked)
                            updateSetting('allow_registration', checked)
                        }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Cho phép đăng nhập</Label>
                        <p className="text-sm text-muted-foreground">
                            Người dùng có thể đăng nhập vào hệ thống
                        </p>
                    </div>
                    <Switch
                        checked={allowLogin}
                        onCheckedChange={(checked) => {
                            setAllowLogin(checked)
                            updateSetting('allow_login', checked)
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
