import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-chars-min!!'

/**
 * Encrypt a plaintext string using AES-256
 */
export function encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
}

/**
 * Decrypt an AES-256 encrypted string
 */
export function decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
}

/**
 * Mask an API key for display (show first 4 and last 4 chars)
 */
export function maskApiKey(key: string): string {
    if (key.length <= 8) return '••••••••'
    return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 24))}${key.slice(-4)}`
}
