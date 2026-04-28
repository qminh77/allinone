import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isEnabledModuleKey } from '@/lib/modules/catalog'
import {
    createToolFileSignedUpload,
    MAX_TOOL_FILE_SIZE_BYTES,
    type ToolFileKind,
} from '@/lib/storage/tool-files'

export const runtime = 'nodejs'

const VALID_KINDS: ToolFileKind[] = ['input', 'output', 'temp']

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const filename = String(body.filename || '')
        const moduleKey = String(body.moduleKey || '')
        const mimeType = String(body.mimeType || 'application/octet-stream')
        const sizeBytes = Number(body.sizeBytes || 0)
        const kind = String(body.kind || 'output') as ToolFileKind

        if (!filename) {
            return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
        }

        if (!await isEnabledModuleKey(moduleKey)) {
            return NextResponse.json({ error: 'Unknown or disabled module key' }, { status: 400 })
        }

        if (!VALID_KINDS.includes(kind)) {
            return NextResponse.json({ error: 'Invalid file kind' }, { status: 400 })
        }

        if (!Number.isFinite(sizeBytes) || sizeBytes < 0 || sizeBytes > MAX_TOOL_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: 'File is too large' }, { status: 413 })
        }

        const upload = await createToolFileSignedUpload({
            userId: user.id,
            moduleKey,
            filename,
            mimeType,
            sizeBytes,
            kind,
        })

        return NextResponse.json({
            success: true,
            upload,
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create upload URL' },
            { status: 500 }
        )
    }
}
