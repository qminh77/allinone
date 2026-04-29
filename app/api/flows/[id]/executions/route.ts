/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeExecutionRow } from '@/lib/workflows/db'

type RouteContext = {
    params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status })
}

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return jsonError('Unauthorized', 401)
        const db = supabase as any

        const { data, error } = await db
            .from('workflow_executions')
            .select('*')
            .eq('workflow_id', id)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30)

        if (error) return jsonError(error.message, 500)

        return NextResponse.json({ executions: (data || []).map(normalizeExecutionRow) })
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Failed to load executions.', 500)
    }
}
