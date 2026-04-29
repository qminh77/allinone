/**
 * Encryption Utilities
 * 
 * AES-256-GCM encryption for sensitive data (SMTP passwords, etc.)
 * ⚠️ Requires ENCRYPTION_KEY environment variable (32 bytes hex)
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes for AES

/**
 * Get encryption key from environment
 * Key must be 32 bytes (256 bits) in hex format
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY?.trim()

    const configError = getEncryptionConfigError()
    if (configError) {
        throw new Error(configError)
    }

    return Buffer.from(key!, 'hex')
}

export function getEncryptionConfigError(): string | null {
    const key = process.env.ENCRYPTION_KEY?.trim()

    if (!key) {
        return 'ENCRYPTION_KEY environment variable is not set'
    }

    if (key === 'your-64-character-hex-key-here') {
        return 'ENCRYPTION_KEY is still the placeholder value. Generate a stable key with: openssl rand -hex 32'
    }

    if (key.length !== 64) { // 32 bytes = 64 hex characters
        return 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'
    }

    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
        return 'ENCRYPTION_KEY must contain only hexadecimal characters'
    }

    return null
}

/**
 * Encrypt text using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted
 */
export function encrypt(text: string): string {
    try {
        const key = getEncryptionKey()
        const iv = crypto.randomBytes(IV_LENGTH)
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        const authTag = cipher.getAuthTag()

        // Format: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (error) {
        console.error('Encryption error:', error)
        throw new Error('Failed to encrypt data')
    }
}

/**
 * Decrypt text using AES-256-GCM
 * @param encryptedData - Encrypted string in format: iv:authTag:encrypted
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
    try {
        const key = getEncryptionKey()
        const parts = encryptedData.split(':')

        if (parts.length !== 3) {
            throw new Error('Stored secret is not in the encrypted format used by this app')
        }

        const [ivHex, authTagHex, encrypted] = parts
        if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(authTagHex) || !/^[0-9a-fA-F]+$/.test(encrypted)) {
            throw new Error('Stored secret contains invalid encrypted data')
        }

        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (error) {
        console.error('Decryption error:', error)
        const message = error instanceof Error ? error.message : 'Failed to decrypt data'
        throw new Error(message)
    }
}

/**
 * Generate a new encryption key
 * Use this to generate ENCRYPTION_KEY for .env.local
 * @returns 64 character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex')
}

/**
 * Test encryption/decryption
 * Use for verification
 */
export function testEncryption(): boolean {
    try {
        const testData = 'test-password-123!@#'
        const encrypted = encrypt(testData)
        const decrypted = decrypt(encrypted)

        return testData === decrypted
    } catch (error) {
        console.error('Encryption test failed:', error)
        return false
    }
}
