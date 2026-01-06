'use server'

import bcrypt from 'bcryptjs'

export async function hashPassword(text: string, rounds: number = 10): Promise<string> {
    if (!text) return ''
    const salt = await bcrypt.genSalt(rounds)
    return bcrypt.hash(text, salt)
}

export async function comparePassword(text: string, hash: string): Promise<boolean> {
    if (!text || !hash) return false
    return bcrypt.compare(text, hash)
}
