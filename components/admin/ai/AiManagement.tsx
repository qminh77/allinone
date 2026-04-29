'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Edit, Loader2, Plus, Radio, Search, Sparkles, Trash2, XCircle } from 'lucide-react'
import {
    createAiModel,
    createAiProvider,
    deleteAiModel,
    deleteAiProvider,
    setDefaultAiModel,
    testAiModel,
    toggleAiModel,
    toggleAiProvider,
    updateAiModel,
    updateAiProvider,
} from '@/lib/actions/admin/ai'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

type AiProviderRow = {
    id: string
    name: string
    slug: string
    adapter: 'openai_responses' | 'openai_chat' | 'openai_compatible' | 'gemini' | 'anthropic'
    base_url: string
    docs_url: string | null
    api_key_label: string | null
    has_api_key: boolean
    is_enabled: boolean
    sort_order: number
    updated_at: string
}

type AiModelRow = {
    id: string
    provider_id: string
    name: string
    model_id: string
    description: string | null
    capabilities: string[]
    context_window: number | null
    input_price_per_million: number | null
    output_price_per_million: number | null
    currency: string
    request_defaults: Record<string, unknown>
    is_enabled: boolean
    is_default: boolean
    sort_order: number
    updated_at: string
    ai_providers?: {
        id: string
        name: string
        slug: string
    } | null
}

type AiUsageLogRow = {
    id: string
    feature_key: string
    status: 'success' | 'failed'
    prompt_tokens: number | null
    completion_tokens: number | null
    total_tokens: number | null
    error_message: string | null
    created_at: string
    ai_providers?: { name: string } | null
    ai_models?: { name: string; model_id: string } | null
}

interface AiManagementProps {
    providers: AiProviderRow[]
    models: AiModelRow[]
    usageLogs: AiUsageLogRow[]
}

const adapters = [
    { value: 'openai_responses', label: 'OpenAI Responses' },
    { value: 'openai_chat', label: 'OpenAI Chat' },
    { value: 'openai_compatible', label: 'OpenAI Compatible' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'anthropic', label: 'Anthropic' },
] as const

function providerStatus(provider: AiProviderRow) {
    if (!provider.is_enabled) return <Badge variant="outline">Tắt</Badge>
    if (!provider.has_api_key) return <Badge variant="destructive">Thiếu key</Badge>
    return <Badge variant="secondary">Sẵn sàng</Badge>
}

function formatNumber(value: number | null | undefined) {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('vi-VN').format(value)
}

function requestDefaultsText(value: Record<string, unknown> | null | undefined) {
    return JSON.stringify(value || {}, null, 2)
}

function ProviderForm({
    provider,
    onSubmit,
    isPending,
}: {
    provider: AiProviderRow | null
    onSubmit: (formData: FormData) => void
    isPending: boolean
}) {
    const [enabled, setEnabled] = useState(provider?.is_enabled ?? false)
    const [adapter, setAdapter] = useState(provider?.adapter || 'openai_responses')
    const [clearKey, setClearKey] = useState(false)

    return (
        <form action={onSubmit} className="space-y-4">
            <input type="hidden" name="is_enabled" value={enabled ? 'true' : 'false'} />
            <input type="hidden" name="clear_api_key" value={clearKey ? 'true' : 'false'} />
            <input type="hidden" name="adapter" value={adapter} />

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="provider-name">Tên provider</Label>
                    <Input id="provider-name" name="name" defaultValue={provider?.name || ''} placeholder="OpenAI" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="provider-slug">Slug</Label>
                    <Input id="provider-slug" name="slug" defaultValue={provider?.slug || ''} placeholder="openai" required />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Adapter</Label>
                    <Select value={adapter} onValueChange={(value) => setAdapter(value as AiProviderRow['adapter'])}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {adapters.map(item => (
                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="provider-sort">Thứ tự</Label>
                    <Input id="provider-sort" name="sort_order" type="number" defaultValue={provider?.sort_order ?? 0} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="provider-base-url">Base URL</Label>
                <Input id="provider-base-url" name="base_url" defaultValue={provider?.base_url || ''} placeholder="https://api.openai.com/v1" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="provider-docs">Docs URL</Label>
                    <Input id="provider-docs" name="docs_url" defaultValue={provider?.docs_url || ''} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="provider-key-label">Tên key</Label>
                    <Input id="provider-key-label" name="api_key_label" defaultValue={provider?.api_key_label || ''} placeholder="OPENAI_API_KEY" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="provider-api-key">{provider?.has_api_key ? 'Thay API key' : 'API key'}</Label>
                <Input id="provider-api-key" name="api_key" type="password" placeholder={provider?.has_api_key ? 'Để trống nếu giữ key hiện tại' : 'sk-...'} />
            </div>

            {provider?.has_api_key && (
                <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                        <p className="text-sm font-medium">Xóa key hiện tại</p>
                        <p className="text-xs text-muted-foreground">Provider sẽ không gọi được AI cho đến khi nhập key mới.</p>
                    </div>
                    <Switch checked={clearKey} onCheckedChange={setClearKey} />
                </div>
            )}

            <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                    <p className="text-sm font-medium">Bật provider</p>
                    <p className="text-xs text-muted-foreground">Chỉ provider bật và có key mới được hệ thống sử dụng.</p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="size-4 animate-spin" />}
                    {provider ? 'Lưu provider' : 'Tạo provider'}
                </Button>
            </div>
        </form>
    )
}

function ModelForm({
    model,
    providers,
    onSubmit,
    isPending,
}: {
    model: AiModelRow | null
    providers: AiProviderRow[]
    onSubmit: (formData: FormData) => void
    isPending: boolean
}) {
    const [providerId, setProviderId] = useState(model?.provider_id || providers[0]?.id || '')
    const [enabled, setEnabled] = useState(model?.is_enabled ?? true)
    const [isDefault, setIsDefault] = useState(model?.is_default ?? false)

    return (
        <form action={onSubmit} className="space-y-4">
            <input type="hidden" name="provider_id" value={providerId} />
            <input type="hidden" name="is_enabled" value={enabled ? 'true' : 'false'} />
            <input type="hidden" name="is_default" value={isDefault ? 'true' : 'false'} />

            <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={providerId} onValueChange={setProviderId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn provider" />
                    </SelectTrigger>
                    <SelectContent>
                        {providers.map(provider => (
                            <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="model-name">Tên hiển thị</Label>
                    <Input id="model-name" name="name" defaultValue={model?.name || ''} placeholder="GPT-5.2" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="model-id">Model ID</Label>
                    <Input id="model-id" name="model_id" defaultValue={model?.model_id || ''} placeholder="gpt-4.1-mini" required />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="model-description">Mô tả</Label>
                <Textarea id="model-description" name="description" defaultValue={model?.description || ''} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="model-capabilities">Capabilities</Label>
                    <Input id="model-capabilities" name="capabilities" defaultValue={(model?.capabilities || ['text', 'json']).join(', ')} placeholder="text, json, reasoning" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="model-context">Context</Label>
                    <Input id="model-context" name="context_window" type="number" defaultValue={model?.context_window || ''} placeholder="1000000" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="model-sort">Thứ tự</Label>
                    <Input id="model-sort" name="sort_order" type="number" defaultValue={model?.sort_order ?? 0} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="model-input-price">Input / 1M</Label>
                    <Input id="model-input-price" name="input_price_per_million" type="number" step="0.0001" defaultValue={model?.input_price_per_million || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="model-output-price">Output / 1M</Label>
                    <Input id="model-output-price" name="output_price_per_million" type="number" step="0.0001" defaultValue={model?.output_price_per_million || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="model-currency">Tiền tệ</Label>
                    <Input id="model-currency" name="currency" defaultValue={model?.currency || 'USD'} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="model-defaults">Request defaults</Label>
                <Textarea id="model-defaults" name="request_defaults" defaultValue={requestDefaultsText(model?.request_defaults)} rows={5} className="font-mono text-xs" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                        <p className="text-sm font-medium">Bật model</p>
                        <p className="text-xs text-muted-foreground">Model bật mới có thể được chọn.</p>
                    </div>
                    <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                        <p className="text-sm font-medium">Default</p>
                        <p className="text-xs text-muted-foreground">Dùng khi user không chọn model.</p>
                    </div>
                    <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isPending || providers.length === 0}>
                    {isPending && <Loader2 className="size-4 animate-spin" />}
                    {model ? 'Lưu model' : 'Tạo model'}
                </Button>
            </div>
        </form>
    )
}

export function AiManagement({ providers, models, usageLogs }: AiManagementProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState('')
    const [providerDialogOpen, setProviderDialogOpen] = useState(false)
    const [modelDialogOpen, setModelDialogOpen] = useState(false)
    const [selectedProvider, setSelectedProvider] = useState<AiProviderRow | null>(null)
    const [selectedModel, setSelectedModel] = useState<AiModelRow | null>(null)
    const [testingModelId, setTestingModelId] = useState<string | null>(null)

    const filteredModels = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return models

        return models.filter(model =>
            model.name.toLowerCase().includes(query) ||
            model.model_id.toLowerCase().includes(query) ||
            (model.description || '').toLowerCase().includes(query) ||
            (model.ai_providers?.name || '').toLowerCase().includes(query)
        )
    }, [models, search])

    function submitProvider(formData: FormData) {
        startTransition(async () => {
            try {
                const result = selectedProvider
                    ? await updateAiProvider(selectedProvider.id, formData)
                    : await createAiProvider(formData)

                if (result.error) {
                    toast.error(result.error)
                    return
                }

                toast.success(selectedProvider ? 'Đã cập nhật provider' : 'Đã tạo provider')
                setProviderDialogOpen(false)
                setSelectedProvider(null)
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể lưu provider')
            }
        })
    }

    function submitModel(formData: FormData) {
        startTransition(async () => {
            try {
                const result = selectedModel
                    ? await updateAiModel(selectedModel.id, formData)
                    : await createAiModel(formData)

                if (result.error) {
                    toast.error(result.error)
                    return
                }

                toast.success(selectedModel ? 'Đã cập nhật model' : 'Đã tạo model')
                setModelDialogOpen(false)
                setSelectedModel(null)
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể lưu model')
            }
        })
    }

    function openProvider(provider: AiProviderRow | null) {
        setSelectedProvider(provider)
        setProviderDialogOpen(true)
    }

    function openModel(model: AiModelRow | null) {
        setSelectedModel(model)
        setModelDialogOpen(true)
    }

    function handleProviderToggle(provider: AiProviderRow, enabled: boolean) {
        startTransition(async () => {
            try {
                const result = await toggleAiProvider(provider.id, enabled)
                if (result.error) toast.error(result.error)
                else {
                    toast.success('Đã cập nhật provider')
                    router.refresh()
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể cập nhật provider')
            }
        })
    }

    function handleModelToggle(model: AiModelRow, enabled: boolean) {
        startTransition(async () => {
            try {
                const result = await toggleAiModel(model.id, enabled)
                if (result.error) toast.error(result.error)
                else {
                    toast.success('Đã cập nhật model')
                    router.refresh()
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể cập nhật model')
            }
        })
    }

    function handleSetDefault(model: AiModelRow) {
        startTransition(async () => {
            try {
                const result = await setDefaultAiModel(model.id)
                if (result.error) toast.error(result.error)
                else {
                    toast.success('Đã đặt model mặc định')
                    router.refresh()
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể đặt model mặc định')
            }
        })
    }

    function handleDeleteProvider(provider: AiProviderRow) {
        if (!confirm(`Xóa provider "${provider.name}" và toàn bộ model bên trong?`)) return
        startTransition(async () => {
            try {
                const result = await deleteAiProvider(provider.id)
                if (result.error) toast.error(result.error)
                else {
                    toast.success('Đã xóa provider')
                    router.refresh()
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể xóa provider')
            }
        })
    }

    function handleDeleteModel(model: AiModelRow) {
        if (!confirm(`Xóa model "${model.name}"?`)) return
        startTransition(async () => {
            try {
                const result = await deleteAiModel(model.id)
                if (result.error) toast.error(result.error)
                else {
                    toast.success('Đã xóa model')
                    router.refresh()
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể xóa model')
            }
        })
    }

    function handleTestModel(model: AiModelRow) {
        setTestingModelId(model.id)
        startTransition(async () => {
            try {
                const result = await testAiModel(model.id)
                if (result.error) {
                    toast.error(result.error)
                    return
                }
                toast.success(result.text || 'Kết nối thành công')
                router.refresh()
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Không thể test model')
            } finally {
                setTestingModelId(null)
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Providers</CardTitle>
                        <CardDescription>{providers.length} cấu hình</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Models</CardTitle>
                        <CardDescription>{models.length} model đã khai báo</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Ready</CardTitle>
                        <CardDescription>{providers.filter(provider => provider.is_enabled && provider.has_api_key).length} provider có thể gọi</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>AI Providers</CardTitle>
                            <CardDescription>Quản lý endpoint, adapter và API key mã hóa.</CardDescription>
                        </div>
                        <Button onClick={() => openProvider(null)}>
                            <Plus className="size-4" />
                            Thêm provider
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Adapter</TableHead>
                                    <TableHead>Endpoint</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {providers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Chưa có provider</TableCell>
                                    </TableRow>
                                )}
                                {providers.map(provider => (
                                    <TableRow key={provider.id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{provider.name}</p>
                                                    {provider.has_api_key ? <CheckCircle2 className="size-4 text-green-600" /> : <XCircle className="size-4 text-muted-foreground" />}
                                                </div>
                                                <p className="font-mono text-xs text-muted-foreground">{provider.slug}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{provider.adapter}</Badge></TableCell>
                                        <TableCell className="max-w-sm truncate font-mono text-xs">{provider.base_url}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Switch checked={provider.is_enabled} onCheckedChange={(checked) => handleProviderToggle(provider, checked)} disabled={isPending} />
                                                {providerStatus(provider)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon-sm" onClick={() => openProvider(provider)} title="Sửa">
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteProvider(provider)} title="Xóa">
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>AI Models</CardTitle>
                            <CardDescription>Model ID, giá tham khảo, context và request defaults đều chỉnh được.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm model..." className="w-56 pl-9" />
                            </div>
                            <Button onClick={() => openModel(null)} disabled={providers.length === 0}>
                                <Plus className="size-4" />
                                Thêm model
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Capabilities</TableHead>
                                    <TableHead>Context</TableHead>
                                    <TableHead>Giá / 1M</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredModels.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Không có model phù hợp</TableCell>
                                    </TableRow>
                                )}
                                {filteredModels.map(model => (
                                    <TableRow key={model.id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">{model.name}</p>
                                                    {model.is_default && <Badge>Default</Badge>}
                                                </div>
                                                <p className="font-mono text-xs text-muted-foreground">{model.model_id}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{model.ai_providers?.name || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex max-w-xs flex-wrap gap-1">
                                                {(model.capabilities || []).map(capability => (
                                                    <Badge key={capability} variant="outline">{capability}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatNumber(model.context_window)}</TableCell>
                                        <TableCell className="text-xs">
                                            {formatNumber(model.input_price_per_million)} / {formatNumber(model.output_price_per_million)} {model.currency}
                                        </TableCell>
                                        <TableCell>
                                            <Switch checked={model.is_enabled} onCheckedChange={(checked) => handleModelToggle(model, checked)} disabled={isPending} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon-sm" onClick={() => handleSetDefault(model)} disabled={model.is_default} title="Đặt default">
                                                    <Radio className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon-sm" onClick={() => handleTestModel(model)} disabled={testingModelId === model.id} title="Test">
                                                    {testingModelId === model.id ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon-sm" onClick={() => openModel(model)} title="Sửa">
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteModel(model)} title="Xóa">
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>AI Usage Logs</CardTitle>
                    <CardDescription>30 lượt gọi gần nhất.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead>Feature</TableHead>
                                    <TableHead>Provider / Model</TableHead>
                                    <TableHead>Tokens</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usageLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Chưa có usage log</TableCell>
                                    </TableRow>
                                )}
                                {usageLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString('vi-VN')}</TableCell>
                                        <TableCell className="font-mono text-xs">{log.feature_key}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">{log.ai_providers?.name || '-'}</div>
                                            <div className="font-mono text-xs text-muted-foreground">{log.ai_models?.model_id || '-'}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">{formatNumber(log.total_tokens)}</TableCell>
                                        <TableCell>
                                            {log.status === 'success'
                                                ? <Badge variant="secondary">success</Badge>
                                                : <Badge variant="destructive" title={log.error_message || ''}>failed</Badge>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedProvider ? 'Chỉnh sửa provider' : 'Thêm provider'}</DialogTitle>
                        <DialogDescription>API key chỉ được dùng ở server và lưu dưới dạng mã hóa.</DialogDescription>
                    </DialogHeader>
                    <ProviderForm
                        key={selectedProvider?.id || 'new-provider'}
                        provider={selectedProvider}
                        onSubmit={submitProvider}
                        isPending={isPending}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedModel ? 'Chỉnh sửa model' : 'Thêm model'}</DialogTitle>
                        <DialogDescription>Model ID là giá trị gửi tới provider, nên có thể chỉnh khi nhà cung cấp đổi alias.</DialogDescription>
                    </DialogHeader>
                    <ModelForm
                        key={selectedModel?.id || 'new-model'}
                        model={selectedModel}
                        providers={providers}
                        onSubmit={submitModel}
                        isPending={isPending}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
