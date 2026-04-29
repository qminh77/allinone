/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeWorkflowRow } from '@/lib/workflows/db'

type RouteContext = {
    params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status })
}

export async function POST(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return jsonError('Unauthorized', 401)
        const db = supabase as any

        const { data: source, error: loadError } = await db
            .from('workflows')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (loadError || !source) return jsonError(loadError?.message || 'Workflow not found.', 404)

        const { data, error } = await db
            .from('workflows')
            .insert({
                user_id: user.id,
                name: `${source.name} (Copy)`.slice(0, 160),
                description: source.description,
                status: 'draft',
                schedule_cron: null,
                definition: source.definition,
            })
            .select()
            .single()

        if (error || !data) return jsonError(error?.message || 'Failed to duplicate workflow.', 500)

        return NextResponse.json({ workflow: normalizeWorkflowRow(data) }, { status: 201 })
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Failed to duplicate workflow.', 500)
    }
}
