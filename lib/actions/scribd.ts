'use server'

import { scribdDownloader } from '@/lib/scribd-dl/service/ScribdDownloader.js'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import { randomUUID } from 'crypto'
import { requireAuthenticated } from '@/lib/auth/authorization-middleware'
import { UrlSchema } from '@/lib/validation'
import { uploadLocalToolFile } from '@/lib/storage/tool-files'

const ALLOWED_HOSTS = ['scribd.com', 'everand.com', 'slideshare.net']

function isAllowedDocumentHost(hostname: string) {
    return ALLOWED_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`))
}

export async function downloadScribdDoc(url: string) {
    let tempDir: string | null = null

    try {
        const user = await requireAuthenticated()
        if (!url) return { error: 'URL is required' }

        const urlValidation = UrlSchema.safeParse(url)
        if (!urlValidation.success) {
            return { error: urlValidation.error.issues[0].message }
        }

        const parsedUrl = new URL(urlValidation.data)
        if (!isAllowedDocumentHost(parsedUrl.hostname.toLowerCase())) {
            return { error: 'Unsupported document host' }
        }

        tempDir = path.join(os.tmpdir(), 'allinone', 'scribd', user.id, randomUUID())
        await fs.mkdir(tempDir, { recursive: true })

        console.log(`[ScribdAction] Downloading: ${urlValidation.data}`)

        // Execute download
        const absolutePath = await scribdDownloader.execute(urlValidation.data, 'DEFAULT', {
            outputDir: tempDir,
            filenameMode: 'title'
        })

        const fileName = path.basename(absolutePath)
        const uploaded = await uploadLocalToolFile({
            userId: user.id,
            moduleKey: 'scribd-downloader',
            localPath: absolutePath,
            filename: fileName,
            mimeType: 'application/pdf',
            kind: 'output',
            expiresIn: 60 * 60,
        })

        return { success: true, url: uploaded.signedUrl, filename: uploaded.filename, storagePath: uploaded.storagePath }

    } catch (error: any) {
        console.error('[ScribdAction] Error:', error)
        return { error: `Download failed: ${error.message}` }
    } finally {
        if (tempDir) {
            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
        }
    }
}
