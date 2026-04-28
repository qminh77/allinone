'use client'

import { Switch } from '@/components/ui/switch'
import { toggleModuleStatus } from '@/lib/actions/admin'
import { useState } from 'react'
import { toast } from 'sonner'

export function ModuleToggle({
    moduleKey,
    initialEnabled,
    onChange,
}: {
    moduleKey: string
    initialEnabled: boolean
    onChange?: (enabled: boolean) => void
}) {
    const [enabled, setEnabled] = useState(initialEnabled)
    const [loading, setLoading] = useState(false)

    const handleToggle = async (checked: boolean) => {
        setLoading(true)
        // Optimistic update
        setEnabled(checked)

        try {
            const res = await toggleModuleStatus(moduleKey, checked)

            if (res.error) {
                toast.error(res.error)
                // Revert
                setEnabled(!checked)
            } else {
                toast.success(checked ? `Module enabled` : `Module disabled`)
                onChange?.(checked)
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Không thể cập nhật module')
            setEnabled(!checked)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
        />
    )
}
