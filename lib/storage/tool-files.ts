import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import sanitize from 'sanitize-filename'
import { createAdminClient } from '@/lib/supabase/admin'

export const TOOL_FILES_BUCKET = process.env.SUPABASE_TOOL_FILES_BUCKET || 'tool-files'

interface UploadToolFileParams {
    userId: string
    moduleKey: string
    filename: string
    mimeType: string
    kind?: 'input' | 'output' | 'temp'
    expiresIn?: number
    data: Buffer | Uint8Array | ArrayBuffer
}

function safeFilename(filename: string) {
    const clean = sanitize(filename).replace(/\s+/g, '-')
    return clean || `file-${Date.now()}`
}

function buildStoragePath(userId: string, moduleKey: string, filename: string) {
    const safeName = safeFilename(filename)
    const date = new Date().toISOString().slice(0, 10)
    return `${userId}/${moduleKey}/${date}/${randomUUID()}-${safeName}`
}

function toBuffer(data: Buffer | Uint8Array | ArrayBuffer) {
    if (Buffer.isBuffer(data)) return data
    if (data instanceof ArrayBuffer) return Buffer.from(data)
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
}

export async function uploadToolFile(params: UploadToolFileParams) {
    const supabase = createAdminClient()
    const buffer = toBuffer(params.data)
    const filename = safeFilename(params.filename)
    const storagePath = buildStoragePath(params.userId, params.moduleKey, filename)

    const { error: uploadError } = await supabase.storage
        .from(TOOL_FILES_BUCKET)
        .upload(storagePath, buffer, {
            contentType: params.mimeType,
            upsert: false,
        })

    if (uploadError) {
        throw new Error(`Failed to upload file to Supabase Storage: ${uploadError.message}`)
    }

    const expiresIn = params.expiresIn || 60 * 60
    const { data: signed, error: signedError } = await supabase.storage
        .from(TOOL_FILES_BUCKET)
        .createSignedUrl(storagePath, expiresIn, {
            download: filename,
        })

    if (signedError || !signed?.signedUrl) {
        throw new Error(`Failed to create signed download URL: ${signedError?.message || 'Unknown error'}`)
    }

    const { error: metadataError } = await (supabase.from('tool_files') as any).insert({
        user_id: params.userId,
        module_key: params.moduleKey,
        bucket: TOOL_FILES_BUCKET,
        storage_path: storagePath,
        original_name: filename,
        result_name: filename,
        mime_type: params.mimeType,
        size_bytes: buffer.byteLength,
        kind: params.kind || 'output',
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    })

    if (metadataError) {
        await supabase.storage.from(TOOL_FILES_BUCKET).remove([storagePath]).catch(() => undefined)
        throw new Error(`Failed to store file metadata: ${metadataError.message}`)
    }

    return {
        bucket: TOOL_FILES_BUCKET,
        storagePath,
        signedUrl: signed.signedUrl,
        filename,
        sizeBytes: buffer.byteLength,
        expiresIn,
    }
}

export async function uploadLocalToolFile(params: Omit<UploadToolFileParams, 'data'> & { localPath: string }) {
    const data = await fs.readFile(params.localPath)
    return uploadToolFile({
        userId: params.userId,
        moduleKey: params.moduleKey,
        filename: params.filename || path.basename(params.localPath),
        mimeType: params.mimeType,
        kind: params.kind,
        expiresIn: params.expiresIn,
        data,
    })
}
