'use client'

import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, TerminalSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/components/workflows/store/useWorkflowStore'
import type { WorkflowExecutionLogRecord } from '@/types/workflow'

const statusClassName = {
    queued: 'bg-muted text-muted-foreground',
    running: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    failed: 'bg-destructive/10 text-destructive',
    cancelled: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
}

const levelClassName = {
    debug: 'text-muted-foreground',
    info: 'text-foreground',
    warn: 'text-amber-600 dark:text-amber-300',
    error: 'text-destructive',
}

function normalizeRealtimeLog(row: Record<string, unknown>): WorkflowExecutionLogRecord {
    return {
        id: String(row.id),
        execution_id: String(row.execution_id),
        workflow_id: String(row.workflow_id),
        user_id: String(row.user_id),
        node_id: row.node_id ? String(row.node_id) : null,
        level: row.level === 'debug' || row.level === 'warn' || row.level === 'error' ? row.level : 'info',
        message: String(row.message || ''),
        payload: row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload) ? row.payload as Record<string, unknown> : null,
        created_at: String(row.created_at),
    }
}

export function ExecutionPanel() {
    const activeExecutionId = useWorkflowStore(state => state.activeExecutionId)
    const executions = useWorkflowStore(state => state.executions)
    const logs = useWorkflowStore(state => state.logs)
    const loadExecutionHistory = useWorkflowStore(state => state.loadExecutionHistory)
    const loadExecutionDetail = useWorkflowStore(state => state.loadExecutionDetail)
    const appendLog = useWorkflowStore(state => state.appendLog)

    useEffect(() => {
        if (!activeExecutionId) return

        const supabase = createClient()
        const channel = supabase
            .channel(`workflow-execution-logs-${activeExecutionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'workflow_execution_logs',
                    filter: `execution_id=eq.${activeExecutionId}`,
                },
                (payload) => appendLog(normalizeRealtimeLog(payload.new))
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [activeExecutionId, appendLog])

    return (
        <Card className="flex h-full min-h-0 flex-1 overflow-hidden py-0">
            <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b p-4">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Executions</p>
                    <CardTitle className="text-base">History & realtime logs</CardTitle>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => void loadExecutionHistory()}>
                    <RefreshCw className="size-4" />
                    <span className="sr-only">Refresh executions</span>
                </Button>
            </CardHeader>

            <ScrollArea className="max-h-44 border-b">
                <CardContent className="space-y-2 p-3">
                    {executions.length === 0 ? (
                        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Chưa có execution.</p>
                    ) : executions.map(execution => (
                        <button
                            key={execution.id}
                            type="button"
                            onClick={() => void loadExecutionDetail(execution.id)}
                            className={cn(
                                'w-full rounded-lg border p-2 text-left text-xs transition-colors hover:bg-muted/60',
                                activeExecutionId === execution.id && 'border-primary bg-primary/5'
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-mono">{execution.id.slice(0, 8)}</span>
                                <Badge variant="secondary" className={cn('h-5 rounded-full px-2 text-[10px]', statusClassName[execution.status])}>
                                    {execution.status}
                                </Badge>
                            </div>
                            <p className="mt-1 text-muted-foreground">
                                {formatDistanceToNow(new Date(execution.created_at), { addSuffix: true })}
                            </p>
                        </button>
                    ))}
                </CardContent>
            </ScrollArea>

            <ScrollArea className="min-h-0 flex-1">
                <CardContent className="space-y-2 p-3">
                    {logs.length === 0 ? (
                        <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                            <TerminalSquare className="size-4" />
                            Logs sẽ xuất hiện realtime khi chạy flow.
                        </div>
                    ) : logs.map(log => (
                        <div key={log.id} className="rounded-lg border bg-background p-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                                <span className={cn('font-medium', levelClassName[log.level])}>{log.level.toUpperCase()}</span>
                                <span className="text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="mt-1">{log.message}</p>
                            {log.node_id && <p className="mt-1 font-mono text-[10px] text-muted-foreground">node: {log.node_id}</p>}
                        </div>
                    ))}
                </CardContent>
            </ScrollArea>
        </Card>
    )
}
