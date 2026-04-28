'use client'

import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type ToolFileKind = 'input' | 'output' | 'temp'

export interface StoredToolFile {
    bucket: string
    storagePath: string
    signedUrl: string
    filename: string
    sizeBytes: number
    expiresIn: number
}

interface UploadToolOutputParams {
    moduleKey: string
    blob: Blob
    filename: string
    mimeType?: string
    kind?: ToolFileKind
}

export interface SaveToolOutputResult {
    stored: boolean
    file?: StoredToolFile
    error?: Error
}

async function readError(response: Response) {
    try {
        const data = await response.json()
        return data?.error || response.statusText
    } catch {
        return response.statusText
    }
}

export async function uploadToolOutput(params: UploadToolOutputParams): Promise<StoredToolFile> {
    const mimeType = params.mimeType || params.blob.type || 'application/octet-stream'

    const uploadUrlResponse = await fetch('/api/tool-files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            moduleKey: params.moduleKey,
            filename: params.filename,
            mimeType,
            sizeBytes: params.blob.size,
            kind: params.kind || 'output',
        }),
    })

    if (!uploadUrlResponse.ok) {
        throw new Error(await readError(uploadUrlResponse))
    }

    const uploadUrlData = await uploadUrlResponse.json()
    const upload = uploadUrlData.upload

    const file = params.blob instanceof File
        ? params.blob
        : new File([params.blob], upload.filename, { type: mimeType })

    const supabase = createClient()
    const { error: uploadError } = await supabase.storage
        .from(upload.bucket)
        .uploadToSignedUrl(upload.storagePath, upload.token, file, {
            contentType: mimeType,
            upsert: false,
        })

    if (uploadError) {
        throw new Error(uploadError.message)
    }

    const completeResponse = await fetch('/api/tool-files/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            moduleKey: params.moduleKey,
            storagePath: upload.storagePath,
            filename: upload.filename,
            mimeType,
            sizeBytes: params.blob.size,
            kind: params.kind || 'output',
        }),
    })

    if (!completeResponse.ok) {
        throw new Error(await readError(completeResponse))
    }

    const completeData = await completeResponse.json()
    return completeData.file
}

export async function saveToolOutput(params: UploadToolOutputParams): Promise<SaveToolOutputResult> {
    try {
        const file = await uploadToolOutput(params)
        saveAs(params.blob, file.filename)
        return { stored: true, file }
    } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error('Upload failed')
        console.warn('Tool output was not uploaded to Supabase Storage:', normalizedError.message)
        saveAs(params.blob, params.filename)
        toast.warning('Không lưu được file lên Supabase Storage. File đã được tải xuống cục bộ.')
        return { stored: false, error: normalizedError }
    }
}
