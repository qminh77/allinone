'use server'

import crypto from 'crypto'

export interface PasswordOptions {
    lowercase: boolean
    uppercase: boolean
    numbers: boolean
    symbols: boolean
}

export async function generatePassword(length: number, options: PasswordOptions): Promise<string> {
    const charset = {
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    }

    let chars = ''
    if (options.lowercase) chars += charset.lowercase
    if (options.uppercase) chars += charset.uppercase
    if (options.numbers) chars += charset.numbers
    if (options.symbols) chars += charset.symbols

    if (chars === '') return ''

    let password = ''
    // Ensure at least one character from each selected set
    if (options.lowercase) password += charset.lowercase[crypto.randomInt(0, charset.lowercase.length)]
    if (options.uppercase) password += charset.uppercase[crypto.randomInt(0, charset.uppercase.length)]
    if (options.numbers) password += charset.numbers[crypto.randomInt(0, charset.numbers.length)]
    if (options.symbols) password += charset.symbols[crypto.randomInt(0, charset.symbols.length)]

    // Fill the rest
    while (password.length < length) {
        password += chars[crypto.randomInt(0, chars.length)]
    }

    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('')
}
