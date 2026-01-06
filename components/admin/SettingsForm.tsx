/**
 * Settings Form - Client Component
 * Interactive form for updating system settings
 */

'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface SettingsFormProps {
    initialSettings: Record<string, boolean>
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [allowRegistration, setAllowRegistration] = useState(initialSettings.allow_registration ?? true)
    const [allowLogin, setAllowLogin] = useState(initialSettings.allow_login ?? true)

    const updateSetting = async (key: string, enabled: boolean) => {
        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: { enabled } }),
            })

            if (!response.ok) throw new Error('Failed to update setting')

            toast.success('Cập nhật thành công')
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra')
        }
    }

    return (
        <>
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
        </>
    )
}
