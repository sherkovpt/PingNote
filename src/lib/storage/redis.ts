import Redis from 'ioredis';
import {
    Note,
    CreateNoteInput,
    CreateNoteResult,
    GetNoteResult,
} from '../types';
import { Storage } from './index';

/**
 * Redis storage implementation
 * Uses Redis for persistent storage with native TTL support
 */
export class RedisStorage implements Storage {
    private redis: Redis;

    constructor(redisUrl: string) {
        this.redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
        });

        this.redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });
    }

    private noteKey(token: string): string {
        return `note:${token}`;
    }

    private shortCodeKey(shortCode: string): string {
        return `code:${shortCode.toUpperCase()}`;
    }

    async createNote(
        input: CreateNoteInput,
        token: string,
        shortCode: string
    ): Promise<CreateNoteResult> {
        const now = Date.now();
        const expiresAt = now + input.ttlSeconds * 1000;
        const id = crypto.randomUUID();

        const note = {
            id,
            token,
            shortCode,
            createdAt: now,
            expiresAt,
            oneTime: input.oneTime,
            viewCount: 0,
            consumed: false,
            liveMode: input.liveMode,
            e2ee: input.e2ee,
            plaintext: input.e2ee ? null : input.text,
            ciphertext: input.e2ee ? input.ciphertext : null,
            iv: input.e2ee ? input.iv : null,
            deletedAt: null,
        };

        const pipeline = this.redis.pipeline();

        // Store note with TTL
        pipeline.set(
            this.noteKey(token),
            JSON.stringify(note),
            'PX',
            input.ttlSeconds * 1000
        );

        // Store short code mapping with same TTL
        pipeline.set(
            this.shortCodeKey(shortCode),
            token,
            'PX',
            input.ttlSeconds * 1000
        );

        await pipeline.exec();

        return { token, shortCode, expiresAt };
    }

    async getNote(token: string, consume: boolean): Promise<GetNoteResult> {
        const key = this.noteKey(token);

        if (consume) {
            // Use Lua script for atomic read-and-update
            const luaScript = `
        local data = redis.call('GET', KEYS[1])
        if not data then
          return nil
        end
        
        local note = cjson.decode(data)
        
        if note.deletedAt then
          return cjson.encode({error = 'deleted'})
        end
        
        if note.oneTime and note.consumed then
          return cjson.encode({error = 'consumed'})
        end
        
        -- Update view count and consumed flag
        note.viewCount = note.viewCount + 1
        if note.oneTime then
          note.consumed = true
        end
        
        -- Get remaining TTL
        local ttl = redis.call('PTTL', KEYS[1])
        if ttl > 0 then
          redis.call('SET', KEYS[1], cjson.encode(note), 'PX', ttl)
        end
        
        return cjson.encode({note = note})
      `;

            const result = await this.redis.eval(luaScript, 1, key) as string | null;

            if (!result) {
                return { note: null, error: 'not_found' };
            }

            const parsed = JSON.parse(result);

            if (parsed.error) {
                return { note: null, error: parsed.error };
            }

            return { note: this.mapNote(parsed.note) };
        } else {
            // Simple read without consuming
            const data = await this.redis.get(key);

            if (!data) {
                return { note: null, error: 'not_found' };
            }

            const stored = JSON.parse(data);

            if (stored.deletedAt) {
                return { note: null, error: 'deleted' };
            }

            if (stored.oneTime && stored.consumed) {
                return { note: null, error: 'consumed' };
            }

            return { note: this.mapNote(stored) };
        }
    }

    private mapNote(stored: Record<string, unknown>): Note {
        return {
            id: stored.id as string,
            token: stored.token as string,
            shortCode: stored.shortCode as string,
            createdAt: stored.createdAt as number,
            expiresAt: stored.expiresAt as number,
            oneTime: stored.oneTime as boolean,
            viewCount: stored.viewCount as number,
            consumed: stored.consumed as boolean,
            liveMode: stored.liveMode as boolean,
            e2ee: stored.e2ee as boolean,
            payload: {
                plaintext: (stored.plaintext as string) || undefined,
                ciphertext: (stored.ciphertext as string) || undefined,
                iv: (stored.iv as string) || undefined,
            },
            deletedAt: (stored.deletedAt as number) || null,
        };
    }

    async getTokenByShortCode(shortCode: string): Promise<string | null> {
        const token = await this.redis.get(this.shortCodeKey(shortCode));

        if (!token) {
            return null;
        }

        // Verify the note still exists and is valid
        const result = await this.getNote(token, false);
        if (result.error) {
            return null;
        }

        return token;
    }

    async deleteNote(token: string): Promise<boolean> {
        const key = this.noteKey(token);
        const data = await this.redis.get(key);

        if (!data) {
            return false;
        }

        const note = JSON.parse(data);
        note.deletedAt = Date.now();

        // Update with short TTL for cleanup
        await this.redis.set(key, JSON.stringify(note), 'PX', 60000); // 1 minute

        // Delete short code mapping
        await this.redis.del(this.shortCodeKey(note.shortCode));

        return true;
    }

    async updateNoteContent(token: string, payload: Note['payload']): Promise<boolean> {
        const key = this.noteKey(token);
        const data = await this.redis.get(key);

        if (!data) {
            return false;
        }

        const note = JSON.parse(data);

        if (note.deletedAt) {
            return false;
        }

        if (payload.plaintext !== undefined) note.plaintext = payload.plaintext;
        if (payload.ciphertext !== undefined) note.ciphertext = payload.ciphertext;
        if (payload.iv !== undefined) note.iv = payload.iv;

        // Keep remaining TTL
        const ttl = await this.redis.pttl(key);
        if (ttl > 0) {
            await this.redis.set(key, JSON.stringify(note), 'PX', ttl);
        }

        return true;
    }

    async close(): Promise<void> {
        await this.redis.quit();
    }
}
