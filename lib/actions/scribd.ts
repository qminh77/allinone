'use server'

import { scribdDownloader } from '@/lib/scribd-dl/service/ScribdDownloader.js'
import path from 'path'
import fs from 'fs/promises'
import { requireAuthenticated } from '@/lib/auth/authorization-middleware'
import { UrlSchema } from '@/lib/validation'

const DOWNLOAD_DIR = path.join(process.cwd(), 'public/downloads/scribd')
const ALLOWED_HOSTS = ['scribd.com', 'everand.com', 'slideshare.net']

function isAllowedDocumentHost(hostname: string) {
    return ALLOWED_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`))
}

export async function downloadScribdDoc(url: string) {
    try {
        await requireAuthenticated()
        if (!url) return { error: 'URL is required' }

        const urlValidation = UrlSchema.safeParse(url)
        if (!urlValidation.success) {
            return { error: urlValidation.error.issues[0].message }
        }

        const parsedUrl = new URL(urlValidation.data)
        if (!isAllowedDocumentHost(parsedUrl.hostname.toLowerCase())) {
            return { error: 'Unsupported document host' }
        }

        // Ensure download directory exists
        await fs.mkdir(DOWNLOAD_DIR, { recursive: true })

        console.log(`[ScribdAction] Downloading: ${urlValidation.data}`)

        // Execute download
        const absolutePath = await scribdDownloader.execute(urlValidation.data, 'DEFAULT', {
            outputDir: DOWNLOAD_DIR,
            filenameMode: 'title'
        })

        // Convert absolute path to public URL
        const fileName = path.basename(absolutePath)
        const publicUrl = `/downloads/scribd/${fileName}`

        return { success: true, url: publicUrl, filename: fileName }

    } catch (error: any) {
        console.error('[ScribdAction] Error:', error)
        return { error: `Download failed: ${error.message}` }
    }
}
