'use server'

import { Buffer } from 'buffer'

export async function toBase64(text: string): Promise<string> {
    if (!text) return ''
    return Buffer.from(text).toString('base64')
}

export async function fromBase64(base64: string): Promise<string> {
    if (!base64) return ''
    try {
        return Buffer.from(base64, 'base64').toString('utf-8')
    } catch (e) {
        return 'Invalid Base64 string'
    }
}
