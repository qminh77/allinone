/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeExecutionRow, normalizeWorkflowRow } from '@/lib/workflows/db'
import { executeWorkflow } from '@/lib/workflows/execution'
import { WorkflowRunInputSchema } from '@/types/workflow'

type RouteContext = {
    params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return jsonError('Unauthorized', 401)
        const db = supabase as any

        const body = await request.json().catch(() => ({}))
        const parsed = WorkflowRunInputSchema.safeParse(body)
        if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400)

        const { data: workflowRow, error: workflowError } = await db
            .from('workflows')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (workflowError || !workflowRow) return jsonError(workflowError?.message || 'Workflow not found.', 404)

        const workflow = normalizeWorkflowRow(workflowRow)
        const { data: executionRow, error: executionError } = await db
            .from('workflow_executions')
            .insert({
                workflow_id: workflow.id,
                user_id: user.id,
                status: 'running',
                trigger_type: parsed.data.triggerType,
                input: parsed.data.input,
                started_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (executionError || !executionRow) return jsonError(executionError?.message || 'Failed to start execution.', 500)

        const result = await executeWorkflow({
            supabase,
            workflow,
            executionId: executionRow.id,
            userId: user.id,
            input: parsed.data.input,
        })

        const { data: refreshedExecution } = await db
            .from('workflow_executions')
            .select('*')
            .eq('id', executionRow.id)
            .eq('user_id', user.id)
            .single()

        return NextResponse.json({
            success: result.status === 'success',
            execution: refreshedExecution ? normalizeExecutionRow(refreshedExecution) : normalizeExecutionRow(executionRow),
            output: result.status === 'success' ? result.output : null,
            error: result.status === 'failed' ? result.error : null,
            logs: result.logs,
        })
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Failed to run workflow.', 500)
    }
}
