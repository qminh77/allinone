import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToolFile } from '@/lib/storage/tool-files'
import { modules } from '@/config/modules'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const moduleKey = String(formData.get('moduleKey') || '')
    const kind = String(formData.get('kind') || 'output')

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    if (!modules.some(moduleItem => moduleItem.key === moduleKey)) {
        return NextResponse.json({ error: 'Unknown module key' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File is too large' }, { status: 413 })
    }

    if (!['input', 'output', 'temp'].includes(kind)) {
        return NextResponse.json({ error: 'Invalid file kind' }, { status: 400 })
    }

    try {
        const uploaded = await uploadToolFile({
            userId: user.id,
            moduleKey,
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            kind: kind as 'input' | 'output' | 'temp',
            data: await file.arrayBuffer(),
        })

        return NextResponse.json({
            success: true,
            file: uploaded,
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        )
    }
}
