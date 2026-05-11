'use client'

import dynamic from 'next/dynamic'

interface WorkflowBuilderClientProps {
    workflowId?: string
}

const WorkflowBuilder = dynamic(
    () => import('@/components/workflows/WorkflowBuilder').then(module => module.WorkflowBuilder),
    {
        ssr: false,
        loading: () => <WorkflowBuilderLoading />,
    }
)

function WorkflowBuilderLoading() {
    return (
        <div className="flex h-full min-h-[620px] flex-col overflow-hidden bg-background">
            <div className="shrink-0 border-b bg-card/95 px-4 py-3 shadow-sm">
                <div className="space-y-3">
                    <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
                    <div className="grid gap-2 lg:grid-cols-[180px_minmax(0,1fr)]">
                        <div className="h-9 animate-pulse rounded-md bg-muted" />
                        <div className="h-9 animate-pulse rounded-md bg-muted" />
                    </div>
                </div>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 bg-muted/30 lg:grid-cols-[300px_minmax(0,1fr)_420px]">
                <div className="hidden border-r bg-card/80 p-4 lg:block">
                    <div className="space-y-3">
                        <div className="h-9 animate-pulse rounded-md bg-muted" />
                        <div className="h-20 animate-pulse rounded-xl bg-muted" />
                        <div className="h-20 animate-pulse rounded-xl bg-muted" />
                    </div>
                </div>
                <div className="grid min-h-[560px] place-items-center border-y bg-background/70 text-sm text-muted-foreground lg:min-h-0 lg:border-y-0">
                    Đang tải Flow builder...
                </div>
                <div className="hidden border-l bg-card/90 p-4 lg:block">
                    <div className="space-y-3">
                        <div className="h-9 animate-pulse rounded-md bg-muted" />
                        <div className="h-24 animate-pulse rounded-xl bg-muted" />
                        <div className="h-24 animate-pulse rounded-xl bg-muted" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function WorkflowBuilderClient(props: WorkflowBuilderClientProps) {
    return <WorkflowBuilder {...props} />
}
