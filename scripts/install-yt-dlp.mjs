import { createWriteStream } from 'node:fs'
import { access, chmod, mkdir, unlink } from 'node:fs/promises'
import { get as httpGet } from 'node:http'
import { get as httpsGet } from 'node:https'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const targetPath = process.env.YTDLP_BINARY_PATH || path.join(rootDir, 'bin', 'yt-dlp')
const shouldDownload = process.env.YTDLP_DOWNLOAD === '1' || process.env.CI || process.env.VERCEL

function getLinuxAssetName() {
  if (process.arch === 'arm64') return 'yt-dlp_linux_aarch64'
  if (process.arch === 'ia32') return 'yt-dlp_linux_x86'
  return 'yt-dlp_linux'
}

function getDownloadUrl() {
  if (process.env.YTDLP_DOWNLOAD_URL) return process.env.YTDLP_DOWNLOAD_URL

  const assetName = getLinuxAssetName()
  if (process.env.YTDLP_VERSION) {
    return `https://github.com/yt-dlp/yt-dlp/releases/download/${process.env.YTDLP_VERSION}/${assetName}`
  }

  return `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${assetName}`
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function request(url, redirects = 0) {
  if (redirects > 5) {
    throw new Error(`Too many redirects while downloading yt-dlp from ${url}`)
  }

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? httpsGet : httpGet
    const req = client(url, {
      headers: {
        'user-agent': 'allinone-build/1.0',
      },
    }, (res) => {
      const statusCode = res.statusCode || 0

      if ([301, 302, 303, 307, 308].includes(statusCode) && res.headers.location) {
        res.resume()
        const redirectUrl = new URL(res.headers.location, url).toString()
        resolve(request(redirectUrl, redirects + 1))
        return
      }

      if (statusCode < 200 || statusCode >= 300) {
        res.resume()
        reject(new Error(`Failed to download yt-dlp: HTTP ${statusCode}`))
        return
      }

      resolve(res)
    })

    req.setTimeout(60_000, () => {
      req.destroy(new Error('Timed out while downloading yt-dlp'))
    })
    req.on('error', reject)
  })
}

async function main() {
  if (process.env.SKIP_YTDLP_DOWNLOAD === '1') {
    console.log('[yt-dlp] Download skipped by SKIP_YTDLP_DOWNLOAD=1')
    return
  }

  if (await fileExists(targetPath)) {
    await chmod(targetPath, 0o755)
    console.log(`[yt-dlp] Using existing binary at ${targetPath}`)
    return
  }

  if (process.platform !== 'linux') {
    console.log(`[yt-dlp] Skipping standalone binary download on ${process.platform}`)
    return
  }

  if (!shouldDownload) {
    console.log('[yt-dlp] Skipping download outside CI/Vercel. Set YTDLP_DOWNLOAD=1 to force it.')
    return
  }

  const downloadUrl = getDownloadUrl()
  await mkdir(path.dirname(targetPath), { recursive: true })

  console.log(`[yt-dlp] Downloading ${downloadUrl}`)

  try {
    const response = await request(downloadUrl)
    await pipeline(response, createWriteStream(targetPath))
    await chmod(targetPath, 0o755)
    console.log(`[yt-dlp] Installed standalone binary at ${targetPath}`)
  } catch (error) {
    await unlink(targetPath).catch(() => {})
    throw error
  }
}

main().catch((error) => {
  console.error(`[yt-dlp] ${error.message}`)
  process.exit(1)
})
