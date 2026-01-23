import { customAlphabet } from 'nanoid';

// Token for URL - 21 chars, ~128 bits entropy
// Using URL-safe alphabet
const tokenAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const generateToken = customAlphabet(tokenAlphabet, 21);

// Short code - 6 chars, easy to type
// Excluding ambiguous characters: 0, O, I, l, 1
const shortCodeAlphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generateShortCodeRaw = customAlphabet(shortCodeAlphabet, 6);

/**
 * Generate a secure token for note URLs
 * ~128 bits of entropy
 */
export function createToken(): string {
    return generateToken();
}

/**
 * Generate a short code for easy typing
 * 6 characters from unambiguous alphabet
 */
export function createShortCode(): string {
    return generateShortCodeRaw();
}

/**
 * Validate token format
 */
export function isValidToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    if (token.length !== 21) return false;
    return /^[A-Za-z0-9_-]+$/.test(token);
}

/**
 * Validate short code format
 */
export function isValidShortCode(code: string): boolean {
    if (!code || typeof code !== 'string') return false;
    // Accept 6 chars, case insensitive
    const normalized = code.toUpperCase();
    if (normalized.length !== 6) return false;
    return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/.test(normalized);
}

/**
 * Normalize short code to uppercase
 */
export function normalizeShortCode(code: string): string {
    return code.toUpperCase();
}
