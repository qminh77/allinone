/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeExecutionLogRow, normalizeExecutionRow } from '@/lib/workflows/db'

type RouteContext = {
    params: Promise<{ executionId: string }>
}

function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status })
}

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { executionId } = await context.params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return jsonError('Unauthorized', 401)
        const db = supabase as any

        const [{ data: execution, error: executionError }, { data: logs, error: logsError }] = await Promise.all([
            db
                .from('workflow_executions')
                .select('*')
                .eq('id', executionId)
                .eq('user_id', user.id)
                .single(),
            db
                .from('workflow_execution_logs')
                .select('*')
                .eq('execution_id', executionId)
                .eq('user_id', user.id)
                .order('created_at', { ascending: true }),
        ])

        if (executionError || !execution) return jsonError(executionError?.message || 'Execution not found.', 404)
        if (logsError) return jsonError(logsError.message, 500)

        return NextResponse.json({
            execution: normalizeExecutionRow(execution),
            logs: (logs || []).map(normalizeExecutionLogRow),
        })
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Failed to load execution.', 500)
    }
}
