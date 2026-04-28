'use client'

import { useEffect, useState } from 'react'
import { getAiModelOptions } from '@/lib/actions/ai'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type AiModelOption = {
    id: string
    name: string
    modelId: string
    providerName: string
    isDefault: boolean
}

interface AiModelSelectProps {
    value?: string | null
    onChange: (value: string | null) => void
    className?: string
}

export function AiModelSelect({ value, onChange, className }: AiModelSelectProps) {
    const [models, setModels] = useState<AiModelOption[]>([])

    useEffect(() => {
        let mounted = true
        getAiModelOptions().then(options => {
            if (mounted) setModels(options as AiModelOption[])
        }).catch(() => {
            if (mounted) setModels([])
        })

        return () => {
            mounted = false
        }
    }, [])

    return (
        <Select value={value || 'default'} onValueChange={(nextValue) => onChange(nextValue === 'default' ? null : nextValue)}>
            <SelectTrigger className={className}>
                <SelectValue placeholder="Model AI" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="default">Default model</SelectItem>
                {models.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                        {model.providerName} · {model.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
