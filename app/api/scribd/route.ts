import { NextRequest, NextResponse } from 'next/server'
import { scribdDownloader } from '@/lib/scribd-dl/service/ScribdDownloader.js'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, RateLimits } from '@/lib/rate-limit'
import { UrlSchema } from '@/lib/validation'
import { uploadLocalToolFile } from '@/lib/storage/tool-files'

// IMPORTANT: This route must use Node.js runtime for Puppeteer
export const runtime = 'nodejs'

const ALLOWED_HOSTS = ['scribd.com', 'everand.com', 'slideshare.net']

function isAllowedDocumentHost(hostname: string) {
    return ALLOWED_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`))
}

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = req.nextUrl.searchParams.get('url')

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const urlValidation = UrlSchema.safeParse(url)
    if (!urlValidation.success) {
        return NextResponse.json({ error: urlValidation.error.issues[0].message }, { status: 400 })
    }

    const parsedUrl = new URL(urlValidation.data)
    if (!isAllowedDocumentHost(parsedUrl.hostname.toLowerCase())) {
        return NextResponse.json({ error: 'Unsupported document host' }, { status: 400 })
    }

    try {
        await checkRateLimit(
            `scribd:${getClientIdentifier(req, user.id)}`,
            RateLimits.API_STRICT.limit,
            RateLimits.API_STRICT.window
        )
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Too many requests' },
            { status: 429 }
        )
    }

    // Prepare stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }

            const tempDir = path.join(os.tmpdir(), 'allinone', 'scribd', user.id, randomUUID())

            try {
                await fs.mkdir(tempDir, { recursive: true })

                // Execute download with progress callback
                const absolutePath = await scribdDownloader.execute(url, 'DEFAULT', {
                    outputDir: tempDir,
                    filenameMode: 'title',
                    onProgress: (message: string) => {
                        sendEvent({ type: 'progress', message })
                    }
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

                sendEvent({
                    type: 'complete',
                    url: uploaded.signedUrl,
                    filename: uploaded.filename,
                    storagePath: uploaded.storagePath,
                    expiresIn: uploaded.expiresIn,
                })
            } catch (error: any) {
                console.error('[ScribdAPI] Error:', error)
                sendEvent({ type: 'error', message: error.message || 'Unknown error' })
            } finally {
                await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
                controller.close()
            }
        }
    })

    return new NextResponse(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}
