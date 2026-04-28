import { NextRequest, NextResponse } from 'next/server'
import { scribdDownloader } from '@/lib/scribd-dl/service/ScribdDownloader.js'
import path from 'path'
import fs from 'fs/promises'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, RateLimits } from '@/lib/rate-limit'
import { UrlSchema } from '@/lib/validation'

// IMPORTANT: This route must use Node.js runtime for Puppeteer
export const runtime = 'nodejs'

const DOWNLOAD_DIR = path.join(process.cwd(), 'public/downloads/scribd')
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

            try {
                await fs.mkdir(DOWNLOAD_DIR, { recursive: true })

                // Execute download with progress callback
                const absolutePath = await scribdDownloader.execute(url, 'DEFAULT', {
                    outputDir: DOWNLOAD_DIR,
                    filenameMode: 'title',
                    onProgress: (message: string) => {
                        sendEvent({ type: 'progress', message })
                    }
                })

                const fileName = path.basename(absolutePath)
                const publicUrl = `/downloads/scribd/${fileName}`

                sendEvent({ type: 'complete', url: publicUrl, filename: fileName })
            } catch (error: any) {
                console.error('[ScribdAPI] Error:', error)
                sendEvent({ type: 'error', message: error.message || 'Unknown error' })
            } finally {
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
