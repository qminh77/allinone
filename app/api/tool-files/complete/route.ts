import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isEnabledModuleKey } from '@/lib/modules/catalog'
import {
    createToolFileSignedDownload,
    insertToolFileMetadata,
    MAX_TOOL_FILE_SIZE_BYTES,
    TOOL_FILES_BUCKET,
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
        const moduleKey = String(body.moduleKey || '')
        const storagePath = String(body.storagePath || '')
        const filename = String(body.filename || '')
        const mimeType = String(body.mimeType || 'application/octet-stream')
        const sizeBytes = Number(body.sizeBytes || 0)
        const kind = String(body.kind || 'output') as ToolFileKind

        if (!await isEnabledModuleKey(moduleKey)) {
            return NextResponse.json({ error: 'Unknown or disabled module key' }, { status: 400 })
        }

        if (!filename || !storagePath) {
            return NextResponse.json({ error: 'Missing file metadata' }, { status: 400 })
        }

        if (!storagePath.startsWith(`${user.id}/${moduleKey}/`)) {
            return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 })
        }

        if (!VALID_KINDS.includes(kind)) {
            return NextResponse.json({ error: 'Invalid file kind' }, { status: 400 })
        }

        if (!Number.isFinite(sizeBytes) || sizeBytes < 0 || sizeBytes > MAX_TOOL_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: 'File is too large' }, { status: 413 })
        }

        const adminClient = createAdminClient()
        const { data: objectInfo, error: objectInfoError } = await adminClient.storage
            .from(TOOL_FILES_BUCKET)
            .info(storagePath)

        if (objectInfoError || !objectInfo) {
            return NextResponse.json({ error: 'Uploaded file was not found in storage' }, { status: 400 })
        }

        const actualSize = typeof objectInfo.size === 'number' ? objectInfo.size : sizeBytes
        if (actualSize > MAX_TOOL_FILE_SIZE_BYTES) {
            await adminClient.storage.from(TOOL_FILES_BUCKET).remove([storagePath]).catch(() => undefined)
            return NextResponse.json({ error: 'File is too large' }, { status: 413 })
        }

        const { error: metadataError } = await insertToolFileMetadata({
            userId: user.id,
            moduleKey,
            bucket: TOOL_FILES_BUCKET,
            storagePath,
            originalName: filename,
            resultName: filename,
            mimeType,
            sizeBytes: actualSize,
            kind,
        })

        if (metadataError) {
            return NextResponse.json({ error: metadataError.message }, { status: 500 })
        }

        const signed = await createToolFileSignedDownload({
            storagePath,
            filename,
        })

        return NextResponse.json({
            success: true,
            file: {
                bucket: TOOL_FILES_BUCKET,
                storagePath,
                signedUrl: signed.signedUrl,
                filename,
                sizeBytes: actualSize,
                expiresIn: signed.expiresIn,
            },
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to complete upload' },
            { status: 500 }
        )
    }
}
