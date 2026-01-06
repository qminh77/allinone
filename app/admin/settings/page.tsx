/**
 * Admin Settings Page - Server Component
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/admin/SettingsForm'

export default async function AdminSettingsPage() {
    const supabase = await createClient()

    // Optimized: Fetch only the settings we need
    const { data: settings } = (await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['allow_registration', 'allow_login'])) as { data: any[] | null }

    // Transform to easy-to-use object
    const settingsMap = settings?.reduce((acc, setting) => {
        acc[setting.key] = setting.value?.enabled || false
        return acc
    }, {} as Record<string, boolean>) || {}

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cấu hình hệ thống</CardTitle>
                <CardDescription>
                    Quản lý các thiết lập chung của website
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <SettingsForm initialSettings={settingsMap} />
            </CardContent>
        </Card>
    )
}
