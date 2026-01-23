/**
 * Client-side E2EE encryption using Web Crypto API
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM
const SALT_LENGTH = 16;

/**
 * Generate a random encryption key and return as base64url
 */
export async function generateKey(): Promise<string> {
    const key = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
    return arrayBufferToBase64Url(key);
}

/**
 * Encrypt text with a key
 * Returns { ciphertext, iv } as base64url strings
 */
export async function encrypt(
    plaintext: string,
    keyBase64: string
): Promise<{ ciphertext: string; iv: string }> {
    const keyBytes = base64UrlToArrayBuffer(keyBase64);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: ALGORITHM },
        false,
        ['encrypt']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        cryptoKey,
        data
    );

    return {
        ciphertext: arrayBufferToBase64Url(new Uint8Array(encrypted)),
        iv: arrayBufferToBase64Url(iv),
    };
}

/**
 * Decrypt ciphertext with key and iv
 */
export async function decrypt(
    ciphertextBase64: string,
    ivBase64: string,
    keyBase64: string
): Promise<string> {
    const keyBytes = base64UrlToArrayBuffer(keyBase64);
    const iv = base64UrlToArrayBuffer(ivBase64);
    const ciphertext = base64UrlToArrayBuffer(ciphertextBase64);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: ALGORITHM },
        false,
        ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        cryptoKey,
        ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Convert ArrayBuffer to base64url string
 */
function arrayBufferToBase64Url(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Convert base64url string to Uint8Array
 */
function base64UrlToArrayBuffer(base64url: string): Uint8Array {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64 + padding);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Check if Web Crypto API is available
 */
export function isCryptoSupported(): boolean {
    return typeof crypto !== 'undefined' &&
        typeof crypto.subtle !== 'undefined' &&
        typeof crypto.getRandomValues !== 'undefined';
}
