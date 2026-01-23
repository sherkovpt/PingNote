import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from './memory';

describe('Memory Storage', () => {
    let storage: MemoryStorage;

    beforeEach(() => {
        storage = new MemoryStorage();
    });

    describe('createNote', () => {
        it('should create a note and return token and shortCode', async () => {
            const result = await storage.createNote(
                {
                    text: 'Test note',
                    ttlSeconds: 600,
                    oneTime: false,
                    e2ee: false,
                    liveMode: false,
                },
                'test-token-123',
                'ABC123'
            );

            expect(result.token).toBe('test-token-123');
            expect(result.shortCode).toBe('ABC123');
            expect(result.expiresAt).toBeGreaterThan(Date.now());
        });
    });

    describe('getNote', () => {
        it('should retrieve a created note', async () => {
            await storage.createNote(
                {
                    text: 'Test note content',
                    ttlSeconds: 600,
                    oneTime: false,
                    e2ee: false,
                    liveMode: false,
                },
                'token-1',
                'CODE01'
            );

            const result = await storage.getNote('token-1', false);

            expect(result.note).not.toBeNull();
            expect(result.note?.payload.plaintext).toBe('Test note content');
        });

        it('should return not_found for non-existent note', async () => {
            const result = await storage.getNote('non-existent', false);

            expect(result.note).toBeNull();
            expect(result.error).toBe('not_found');
        });

        it('should increment view count when consuming', async () => {
            await storage.createNote(
                {
                    text: 'Test',
                    ttlSeconds: 600,
                    oneTime: false,
                    e2ee: false,
                    liveMode: false,
                },
                'token-view',
                'VIEW01'
            );

            const result1 = await storage.getNote('token-view', true);
            expect(result1.note?.viewCount).toBe(1);

            const result2 = await storage.getNote('token-view', true);
            expect(result2.note?.viewCount).toBe(2);
        });
    });

    describe('one-time notes', () => {
        it('should mark one-time note as consumed after first view', async () => {
            await storage.createNote(
                {
                    text: 'One time secret',
                    ttlSeconds: 600,
                    oneTime: true,
                    e2ee: false,
                    liveMode: false,
                },
                'token-onetime',
                'ONCE01'
            );

            // First view should succeed
            const result1 = await storage.getNote('token-onetime', true);
            expect(result1.note).not.toBeNull();
            expect(result1.note?.payload.plaintext).toBe('One time secret');

            // Second view should fail
            const result2 = await storage.getNote('token-onetime', true);
            expect(result2.note).toBeNull();
            expect(result2.error).toBe('consumed');
        });

        it('should allow peek without consuming', async () => {
            await storage.createNote(
                {
                    text: 'Peek test',
                    ttlSeconds: 600,
                    oneTime: true,
                    e2ee: false,
                    liveMode: false,
                },
                'token-peek',
                'PEEK01'
            );

            // Peek should not consume
            const peek = await storage.getNote('token-peek', false);
            expect(peek.note).not.toBeNull();

            // Consuming view should work
            const consume = await storage.getNote('token-peek', true);
            expect(consume.note).not.toBeNull();

            // Now it should be consumed
            const after = await storage.getNote('token-peek', true);
            expect(after.error).toBe('consumed');
        });
    });

    describe('getTokenByShortCode', () => {
        it('should resolve short code to token', async () => {
            await storage.createNote(
                {
                    text: 'Short code test',
                    ttlSeconds: 600,
                    oneTime: false,
                    e2ee: false,
                    liveMode: false,
                },
                'token-short',
                'SHORT1'
            );

            const token = await storage.getTokenByShortCode('SHORT1');
            expect(token).toBe('token-short');
        });

        it('should be case insensitive', async () => {
            await storage.createNote(
                {
                    text: 'Case test',
                    ttlSeconds: 600,
                    oneTime: false,
                    e2ee: false,
                    liveMode: false,
                },
                'token-case',
                'CASE12'
            );

            const token = await storage.getTokenByShortCode('case12');
            expect(token).toBe('token-case');
        });

        it('should return null for consumed one-time notes', async () => {
            await storage.createNote(
                {
                    text: 'Consumed test',
                    ttlSeconds: 600,
                    oneTime: true,
                    e2ee: false,
                    liveMode: false,
                },
                'token-consumed',
                'CONS01'
            );

            // Consume the note
            await storage.getNote('token-consumed', true);

            // Short code should not resolve
            const token = await storage.getTokenByShortCode('CONS01');
            expect(token).toBeNull();
        });
    });

    describe('deleteNote', () => {
        it('should delete a note', async () => {
            await storage.createNote(
                {
                    text: 'Delete me',
                    ttlSeconds: 600,
                    oneTime: false,
                    e2ee: false,
                    liveMode: false,
                },
                'token-delete',
                'DEL001'
            );

            const deleted = await storage.deleteNote('token-delete');
            expect(deleted).toBe(true);

            const result = await storage.getNote('token-delete', false);
            expect(result.error).toBe('deleted');
        });

        it('should return false for non-existent note', async () => {
            const deleted = await storage.deleteNote('non-existent');
            expect(deleted).toBe(false);
        });
    });

    describe('E2EE notes', () => {
        it('should store ciphertext for E2EE notes', async () => {
            await storage.createNote(
                {
                    text: '',
                    ttlSeconds: 600,
                    oneTime: false,
                    e2ee: true,
                    liveMode: false,
                    ciphertext: 'encrypted-data-here',
                    iv: 'initialization-vector',
                },
                'token-e2ee',
                'E2EE01'
            );

            const result = await storage.getNote('token-e2ee', false);

            expect(result.note?.e2ee).toBe(true);
            expect(result.note?.payload.ciphertext).toBe('encrypted-data-here');
            expect(result.note?.payload.iv).toBe('initialization-vector');
            expect(result.note?.payload.plaintext).toBeUndefined();
        });
    });
});
