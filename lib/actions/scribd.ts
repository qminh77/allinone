'use server'

import { scribdDownloader } from '@/lib/scribd-dl/service/ScribdDownloader.js'
import path from 'path'
import fs from 'fs/promises'

const DOWNLOAD_DIR = path.join(process.cwd(), 'public/downloads/scribd')

export async function downloadScribdDoc(url: string) {
    try {
        if (!url) return { error: 'URL is required' }

        // Ensure download directory exists
        await fs.mkdir(DOWNLOAD_DIR, { recursive: true })

        console.log(`[ScribdAction] Downloading: ${url}`)

        // Execute download
        const absolutePath = await scribdDownloader.execute(url, 'DEFAULT', {
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
