/**
 * Password Policy Utilities
 * 
 * Enforces strong password requirements using zxcvbn
 */

export type PasswordStrengthResult = {
    score: number // 0-4
    feedback: {
        warning: string
        suggestions: string[]
    }
    isValid: boolean
    errors: string[]
}

const MIN_LENGTH = 8
const MIN_SCORE = 3 // 0-4, 3 is "safe"

let zxcvbnPromise: Promise<any> | null = null

async function loadZxcvbn(): Promise<any> {
    zxcvbnPromise ||= import('zxcvbn') as Promise<any>
    return zxcvbnPromise
}

/**
 * Validate password strength
 */
export async function validatePasswordStrength(password: string): Promise<PasswordStrengthResult> {
    const zxcvbnModule = await loadZxcvbn()
    const zxcvbn = zxcvbnModule.default || zxcvbnModule
    const result = zxcvbn(password)
    const errors: string[] = []

    if (password.length < MIN_LENGTH) {
        errors.push(`Password must be at least ${MIN_LENGTH} characters long`)
    }

    // Custom complexity checks (optional, zxcvbn covers most)
    // if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase')
    // if (!/[0-9]/.test(password)) errors.push('Must contain number')

    const isValid = result.score >= MIN_SCORE && password.length >= MIN_LENGTH

    if (result.score < MIN_SCORE) {
        errors.push('Password is too weak. Please add more complexity.')
    }

    return {
        score: result.score,
        feedback: result.feedback,
        isValid,
        errors
    }
}
