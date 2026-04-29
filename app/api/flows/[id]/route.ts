/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeWorkflowRow } from '@/lib/workflows/db'
import { WorkflowSaveInputSchema } from '@/types/workflow'

type RouteContext = {
    params: Promise<{ id: string }>
}

async function requireUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return { supabase, user }
}

function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status })
}

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params
        const { supabase, user } = await requireUser()
        if (!user) return jsonError('Unauthorized', 401)
        const db = supabase as any

        const { data, error } = await db
            .from('workflows')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error || !data) return jsonError(error?.message || 'Workflow not found.', 404)

        return NextResponse.json({ workflow: normalizeWorkflowRow(data) })
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Failed to load workflow.', 500)
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params
        const { supabase, user } = await requireUser()
        if (!user) return jsonError('Unauthorized', 401)
        const db = supabase as any

        const body = await request.json().catch(() => null)
        const parsed = WorkflowSaveInputSchema.safeParse(body)
        if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400)

        const { data, error } = await db
            .from('workflows')
            .update({
                name: parsed.data.name,
                description: parsed.data.description || null,
                status: parsed.data.status,
                schedule_cron: parsed.data.scheduleCron || null,
                definition: parsed.data.definition,
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error || !data) return jsonError(error?.message || 'Workflow not found.', 404)

        return NextResponse.json({ workflow: normalizeWorkflowRow(data) })
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Failed to update workflow.', 500)
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params
        const { supabase, user } = await requireUser()
        if (!user) return jsonError('Unauthorized', 401)
        const db = supabase as any

        const { error } = await db
            .from('workflows')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) return jsonError(error.message, 500)

        return NextResponse.json({ success: true })
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Failed to delete workflow.', 500)
    }
}
