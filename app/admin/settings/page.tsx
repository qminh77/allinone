import { SettingsManagement } from '@/components/admin/settings/SettingsManagement'
import { StatsCard } from '@/components/admin/StatsCard'
import { getSettings } from '@/lib/actions/admin/settings'
import { CheckCircle2, Settings, ToggleLeft } from 'lucide-react'

interface SettingRow {
    key: string
    value: Record<string, unknown>
    description: string | null
    updated_at: string | null
    updated_by: string | null
}

export default async function AdminSettingsPage() {
    const settings = (await getSettings()) as SettingRow[]
    const booleanSettings = settings.filter((setting) => typeof setting.value?.enabled === 'boolean')
    const enabledSettings = booleanSettings.filter((setting) => setting.value.enabled === true)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Cấu hình hệ thống</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Quản lý settings dạng JSON, bao gồm bật/tắt đăng ký, đăng nhập và các feature flags khác.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard title="Settings" value={settings.length} description="Tổng cấu hình" icon={Settings} />
                <StatsCard title="Boolean flags" value={booleanSettings.length} description="Có trường enabled" icon={ToggleLeft} />
                <StatsCard title="Đang bật" value={enabledSettings.length} description="Feature flags enabled" icon={CheckCircle2} />
            </div>

            <SettingsManagement settings={settings} />
        </div>
    )
}
