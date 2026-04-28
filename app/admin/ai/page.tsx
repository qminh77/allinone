import { BrainCircuit } from 'lucide-react'
import { StatsCard } from '@/components/admin/StatsCard'
import { AiManagement } from '@/components/admin/ai/AiManagement'
import { getAiAdminData } from '@/lib/actions/admin/ai'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminAiPage() {
    const { providers, models, usageLogs, configurationError } = await getAiAdminData()
    const readyProviders = providers.filter((provider: any) => provider.is_enabled && provider.has_api_key).length
    const enabledModels = models.filter((model: any) => model.is_enabled).length
    const failedCalls = usageLogs.filter((log: any) => log.status === 'failed').length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">AI Control Center</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Quản lý provider, API key, endpoint, model ID và theo dõi lượt gọi AI trong hệ thống.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard title="Providers" value={providers.length} description={`${readyProviders} sẵn sàng`} icon={BrainCircuit} />
                <StatsCard title="Models" value={models.length} description={`${enabledModels} đang bật`} icon={BrainCircuit} />
                <StatsCard title="Usage logs" value={usageLogs.length} description="30 lượt gọi gần nhất" icon={BrainCircuit} />
                <StatsCard title="Failed" value={failedCalls} description="Trong log gần nhất" icon={BrainCircuit} />
            </div>

            {configurationError && (
                <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="py-4 text-sm text-destructive">
                        {configurationError}
                    </CardContent>
                </Card>
            )}

            <AiManagement providers={providers as any} models={models as any} usageLogs={usageLogs as any} />
        </div>
    )
}
