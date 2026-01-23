import { describe, it, expect } from 'vitest';
import { createToken, createShortCode, isValidToken, isValidShortCode, normalizeShortCode } from './tokens';

describe('Token Generation', () => {
    it('should generate a token with 21 characters', () => {
        const token = createToken();
        expect(token).toHaveLength(21);
    });

    it('should generate unique tokens', () => {
        const tokens = new Set<string>();
        for (let i = 0; i < 100; i++) {
            tokens.add(createToken());
        }
        expect(tokens.size).toBe(100);
    });

    it('should only contain URL-safe characters', () => {
        const token = createToken();
        expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
    });
});

describe('Short Code Generation', () => {
    it('should generate a short code with 6 characters', () => {
        const code = createShortCode();
        expect(code).toHaveLength(6);
    });

    it('should not contain ambiguous characters (0, O, I, l, 1)', () => {
        // Generate many codes to test
        for (let i = 0; i < 50; i++) {
            const code = createShortCode();
            expect(code).not.toMatch(/[0OIl1]/);
        }
    });

    it('should be uppercase', () => {
        const code = createShortCode();
        expect(code).toBe(code.toUpperCase());
    });
});

describe('Token Validation', () => {
    it('should validate correct tokens', () => {
        const token = createToken();
        expect(isValidToken(token)).toBe(true);
    });

    it('should reject invalid tokens', () => {
        expect(isValidToken('')).toBe(false);
        expect(isValidToken('short')).toBe(false);
        expect(isValidToken('this-has-invalid-chars!@#')).toBe(false);
        expect(isValidToken(null as unknown as string)).toBe(false);
        expect(isValidToken(undefined as unknown as string)).toBe(false);
    });
});

describe('Short Code Validation', () => {
    it('should validate correct short codes', () => {
        const code = createShortCode();
        expect(isValidShortCode(code)).toBe(true);
    });

    it('should accept lowercase input', () => {
        // isValidShortCode normalizes to uppercase before validating
        // 'abcdef' -> 'ABCDEF' which are all valid chars (no ambiguous 0,O,I,l,1)
        expect(isValidShortCode('abcdef')).toBe(true);
        expect(isValidShortCode('ABC234')).toBe(true);
        expect(isValidShortCode('abc234')).toBe(true); // case insensitive
    });

    it('should reject invalid short codes', () => {
        expect(isValidShortCode('')).toBe(false);
        expect(isValidShortCode('ABC')).toBe(false); // too short
        expect(isValidShortCode('ABC12345')).toBe(false); // too long
        expect(isValidShortCode('ABC10O')).toBe(false); // contains ambiguous chars
    });
});

describe('Short Code Normalization', () => {
    it('should convert to uppercase', () => {
        expect(normalizeShortCode('abc234')).toBe('ABC234');
        expect(normalizeShortCode('ABC234')).toBe('ABC234');
    });
});
