/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeWorkflowRow } from '@/lib/workflows/db'
import { WorkflowSaveInputSchema } from '@/types/workflow'

async function requireUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return { supabase, user }
}

function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
    try {
        const { supabase, user } = await requireUser()
        if (!user) return jsonError('Unauthorized', 401)
        const db = supabase as any

        const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 80)
        let dbQuery = db
            .from('workflows')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        if (query) {
            dbQuery = dbQuery.ilike('name', `%${query.replace(/[%_]/g, '')}%`)
        }

        const { data, error } = await dbQuery
        if (error) return jsonError(error.message, 500)

        return NextResponse.json({ workflows: (data || []).map(normalizeWorkflowRow) })
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Failed to load workflows.', 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const { supabase, user } = await requireUser()
        if (!user) return jsonError('Unauthorized', 401)
        const db = supabase as any

        const body = await request.json().catch(() => null)
        const parsed = WorkflowSaveInputSchema.safeParse(body)
        if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400)

        const { data, error } = await db
            .from('workflows')
            .insert({
                user_id: user.id,
                name: parsed.data.name,
                description: parsed.data.description || null,
                status: parsed.data.status,
                schedule_cron: parsed.data.scheduleCron || null,
                definition: parsed.data.definition,
            })
            .select()
            .single()

        if (error) return jsonError(error.message, 500)

        return NextResponse.json({ workflow: normalizeWorkflowRow(data) }, { status: 201 })
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Failed to create workflow.', 500)
    }
}
