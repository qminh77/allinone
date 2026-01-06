'use server'

import crypto from 'crypto'

export async function generateMd5(text: string): Promise<string> {
    if (!text) return ''
    return crypto.createHash('md5').update(text).digest('hex')
}
