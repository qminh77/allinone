'use server'

import crypto from 'crypto'

export async function generateMd5(text: string): Promise<string> {
    if (!text) return ''
    return crypto.createHash('md5').update(text).digest('hex')
}

export async function generateUuid(quantity: number = 1): Promise<string[]> {
    const count = Math.min(Math.max(1, quantity), 50) // Limit 1-50
    return Array.from({ length: count }, () => crypto.randomUUID())
}
