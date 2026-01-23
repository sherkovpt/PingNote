import { describe, it, expect, beforeAll } from 'vitest';

// Mock crypto for Node environment
beforeAll(async () => {
    if (!globalThis.crypto) {
        const { webcrypto } = await import('crypto');
        // @ts-expect-error - Fixing missing type for webcrypto in global context
        globalThis.crypto = webcrypto;
    }
});

describe('Crypto Module', () => {
    it('should generate a key as base64url string', async () => {
        const { generateKey } = await import('./crypto');
        const key = await generateKey();

        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(30); // 256 bits -> ~43 chars in base64
    });

    it('should encrypt and decrypt text correctly', async () => {
        const { generateKey, encrypt, decrypt } = await import('./crypto');
        const originalText = 'Hello, PingNote! This is a secret message.';

        const key = await generateKey();
        const { ciphertext, iv } = await encrypt(originalText, key);

        expect(ciphertext).not.toBe(originalText);
        expect(iv.length).toBeGreaterThan(0);

        const decrypted = await decrypt(ciphertext, iv, key);
        expect(decrypted).toBe(originalText);
    });

    it('should produce different ciphertext for same plaintext', async () => {
        const { generateKey, encrypt } = await import('./crypto');
        const text = 'Same text, different encryption';
        const key = await generateKey();

        const result1 = await encrypt(text, key);
        const result2 = await encrypt(text, key);

        expect(result1.ciphertext).not.toBe(result2.ciphertext);
        expect(result1.iv).not.toBe(result2.iv);
    });

    it('should fail to decrypt with wrong key', async () => {
        const { generateKey, encrypt, decrypt } = await import('./crypto');
        const text = 'Secret message';

        const key1 = await generateKey();
        const key2 = await generateKey();

        const { ciphertext, iv } = await encrypt(text, key1);

        await expect(decrypt(ciphertext, iv, key2)).rejects.toThrow();
    });

    it('should handle unicode text', async () => {
        const { generateKey, encrypt, decrypt } = await import('./crypto');
        const unicodeText = '你好世界 🌍 مرحبا Olá こんにちは';

        const key = await generateKey();
        const { ciphertext, iv } = await encrypt(unicodeText, key);
        const decrypted = await decrypt(ciphertext, iv, key);

        expect(decrypted).toBe(unicodeText);
    });

    it('should handle empty string', async () => {
        const { generateKey, encrypt, decrypt } = await import('./crypto');
        const emptyText = '';

        const key = await generateKey();
        const { ciphertext, iv } = await encrypt(emptyText, key);
        const decrypted = await decrypt(ciphertext, iv, key);

        expect(decrypted).toBe(emptyText);
    });
});
