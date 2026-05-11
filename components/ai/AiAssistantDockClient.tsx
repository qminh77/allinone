'use client'

import dynamic from 'next/dynamic'

const AiAssistantDock = dynamic(
    () => import('@/components/ai/AiAssistantDock').then(module => module.AiAssistantDock),
    {
        ssr: false,
        loading: () => null,
    }
)

export function AiAssistantDockClient() {
    return <AiAssistantDock />
}
