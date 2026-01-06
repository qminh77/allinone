'use client'

import { Switch } from '@/components/ui/switch'
import { toggleModuleStatus } from '@/lib/actions/admin'
import { useState } from 'react'
import { toast } from 'sonner'

export function ModuleToggle({ moduleKey, initialEnabled }: { moduleKey: string, initialEnabled: boolean }) {
    const [enabled, setEnabled] = useState(initialEnabled)
    const [loading, setLoading] = useState(false)

    const handleToggle = async (checked: boolean) => {
        setLoading(true)
        // Optimistic update
        setEnabled(checked)

        const res = await toggleModuleStatus(moduleKey, checked)

        if (res.error) {
            toast.error(res.error)
            // Revert
            setEnabled(!checked)
        } else {
            toast.success(checked ? `Module enabled` : `Module disabled`)
        }
        setLoading(false)
    }

    return (
        <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
        />
    )
}
