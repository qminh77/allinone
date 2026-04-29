import type { Database } from '@/types/database'
import type { WorkflowExecutionLogRecord, WorkflowExecutionRecord, WorkflowRecord } from '@/types/workflow'
import { parseWorkflowDefinition } from '@/types/workflow'

type WorkflowRow = Database['public']['Tables']['workflows']['Row']
type ExecutionRow = Database['public']['Tables']['workflow_executions']['Row']
type LogRow = Database['public']['Tables']['workflow_execution_logs']['Row']

function toRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {}
}

export function normalizeWorkflowRow(row: WorkflowRow): WorkflowRecord {
    return {
        ...row,
        definition: parseWorkflowDefinition(row.definition),
    }
}

export function normalizeExecutionRow(row: ExecutionRow): WorkflowExecutionRecord {
    return {
        ...row,
        input: toRecord(row.input),
        output: row.output ? toRecord(row.output) : null,
    }
}

export function normalizeExecutionLogRow(row: LogRow): WorkflowExecutionLogRecord {
    return {
        ...row,
        payload: row.payload ? toRecord(row.payload) : null,
    }
}
