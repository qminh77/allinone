'use client'

import dynamic from 'next/dynamic'

interface SmtpConfig {
    id: string
    name: string
    from_email: string
}

const SendMailForm = dynamic(
    () => import('@/components/mail/SendMailForm').then(module => module.SendMailForm),
    {
        ssr: false,
        loading: () => <div className="h-96 rounded-lg border bg-muted/20 animate-pulse" />,
    }
)

export function SendMailClient({ configs }: { configs: SmtpConfig[] }) {
    return <SendMailForm configs={configs} />
}
