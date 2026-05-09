const cacheImport = <T,>(loader: () => Promise<T>) => {
    let promise: Promise<T> | null = null

    return () => {
        promise ||= loader()
        return promise
    }
}

export const loadQRCode = cacheImport(() => import('qrcode'))
export const loadJsZip = cacheImport(() => import('jszip'))
export const loadPdfLib = cacheImport(() => import('pdf-lib'))
export const loadPdfJsDist = cacheImport(() => import('pdfjs-dist'))
export const loadMarked = cacheImport(() => import('marked'))
export const loadTurndown = cacheImport(() => import('turndown'))
export const loadSqlFormatter = cacheImport(() => import('sql-formatter'))
export const loadHeic2Any = cacheImport(() => import('heic2any'))
export const loadImageTracer = cacheImport(() => import('imagetracerjs') as Promise<any>)
export const loadOpentype = cacheImport(() => import('opentype.js'))
export const loadFFmpeg = cacheImport(() => import('@ffmpeg/ffmpeg'))
export const loadFFmpegUtil = cacheImport(() => import('@ffmpeg/util'))
export const loadMagickWasm = cacheImport(() => import('@imagemagick/magick-wasm'))
