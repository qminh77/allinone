import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import sanitize from 'sanitize-filename'
import { createAdminClient } from '@/lib/supabase/admin'

export const TOOL_FILES_BUCKET = process.env.SUPABASE_TOOL_FILES_BUCKET || 'tool-files'
export const MAX_TOOL_FILE_SIZE_BYTES = 500 * 1024 * 1024
export const DEFAULT_TOOL_FILE_EXPIRES_IN = 60 * 60

export type ToolFileKind = 'input' | 'output' | 'temp'

interface UploadToolFileParams {
    userId: string
    moduleKey: string
    filename: string
    mimeType: string
    kind?: 'input' | 'output' | 'temp'
    expiresIn?: number
    data: Buffer | Uint8Array | ArrayBuffer
}

interface ToolFileMetadataParams {
    userId: string
    moduleKey: string
    bucket?: string
    storagePath: string
    originalName: string
    resultName?: string
    mimeType?: string
    sizeBytes?: number
    kind?: ToolFileKind
    expiresIn?: number
}

export function safeToolFilename(filename: string) {
    const clean = sanitize(filename).replace(/\s+/g, '-')
    return clean || `file-${Date.now()}`
}

export function buildToolFileStoragePath(userId: string, moduleKey: string, filename: string) {
    const safeName = safeToolFilename(filename)
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
    const filename = safeToolFilename(params.filename)
    const storagePath = buildToolFileStoragePath(params.userId, params.moduleKey, filename)

    const { error: uploadError } = await supabase.storage
        .from(TOOL_FILES_BUCKET)
        .upload(storagePath, buffer, {
            contentType: params.mimeType,
            upsert: false,
        })

    if (uploadError) {
        throw new Error(`Failed to upload file to Supabase Storage: ${uploadError.message}`)
    }

    const expiresIn = params.expiresIn || DEFAULT_TOOL_FILE_EXPIRES_IN
    const { data: signed, error: signedError } = await supabase.storage
        .from(TOOL_FILES_BUCKET)
        .createSignedUrl(storagePath, expiresIn, {
            download: filename,
        })

    if (signedError || !signed?.signedUrl) {
        throw new Error(`Failed to create signed download URL: ${signedError?.message || 'Unknown error'}`)
    }

    const { error: metadataError } = await insertToolFileMetadata({
        userId: params.userId,
        moduleKey: params.moduleKey,
        storagePath,
        originalName: filename,
        resultName: filename,
        mimeType: params.mimeType,
        sizeBytes: buffer.byteLength,
        kind: params.kind || 'output',
        expiresIn,
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

export async function createToolFileSignedUpload(params: Omit<ToolFileMetadataParams, 'storagePath' | 'originalName'> & { filename: string }) {
    const supabase = createAdminClient()
    const filename = safeToolFilename(params.filename)
    const storagePath = buildToolFileStoragePath(params.userId, params.moduleKey, filename)

    const { data, error } = await supabase.storage
        .from(TOOL_FILES_BUCKET)
        .createSignedUploadUrl(storagePath, { upsert: false })

    if (error || !data?.token) {
        throw new Error(`Failed to create signed upload URL: ${error?.message || 'Unknown error'}`)
    }

    return {
        bucket: TOOL_FILES_BUCKET,
        storagePath,
        token: data.token,
        signedUrl: data.signedUrl,
        filename,
        mimeType: params.mimeType || 'application/octet-stream',
        sizeBytes: params.sizeBytes || 0,
        kind: params.kind || 'output',
        expiresIn: params.expiresIn || DEFAULT_TOOL_FILE_EXPIRES_IN,
    }
}

export async function createToolFileSignedDownload(params: {
    storagePath: string
    filename: string
    expiresIn?: number
}) {
    const supabase = createAdminClient()
    const expiresIn = params.expiresIn || DEFAULT_TOOL_FILE_EXPIRES_IN

    const { data: signed, error } = await supabase.storage
        .from(TOOL_FILES_BUCKET)
        .createSignedUrl(params.storagePath, expiresIn, {
            download: safeToolFilename(params.filename),
        })

    if (error || !signed?.signedUrl) {
        throw new Error(`Failed to create signed download URL: ${error?.message || 'Unknown error'}`)
    }

    return {
        signedUrl: signed.signedUrl,
        expiresIn,
    }
}

export async function insertToolFileMetadata(params: ToolFileMetadataParams) {
    const supabase = createAdminClient()
    const expiresIn = params.expiresIn || DEFAULT_TOOL_FILE_EXPIRES_IN
    const filename = safeToolFilename(params.originalName)

    return (supabase.from('tool_files') as any).insert({
        user_id: params.userId,
        module_key: params.moduleKey,
        bucket: params.bucket || TOOL_FILES_BUCKET,
        storage_path: params.storagePath,
        original_name: filename,
        result_name: safeToolFilename(params.resultName || filename),
        mime_type: params.mimeType || null,
        size_bytes: params.sizeBytes || null,
        kind: params.kind || 'output',
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    })
}
