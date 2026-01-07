import { NextRequest, NextResponse } from 'next/server'
import { scribdDownloader } from '@/lib/scribd-dl/service/ScribdDownloader.js'
import path from 'path'
import fs from 'fs/promises'

// IMPORTANT: This route must use Node.js runtime for Puppeteer
export const runtime = 'nodejs'

const DOWNLOAD_DIR = path.join(process.cwd(), 'public/downloads/scribd')

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url')

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 })
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
