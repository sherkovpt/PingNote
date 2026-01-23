import {
    Note,
    CreateNoteInput,
    CreateNoteResult,
    GetNoteResult,
} from '../types';
import { Storage } from './index';

/**
 * In-memory storage implementation
 * Simple Map-based storage for development
 * Data is lost when the server restarts
 */

interface StoredNote {
    id: string;
    token: string;
    shortCode: string;
    createdAt: number;
    expiresAt: number;
    oneTime: boolean;
    viewCount: number;
    consumed: boolean;
    liveMode: boolean;
    e2ee: boolean;
    plaintext?: string;
    ciphertext?: string;
    iv?: string;
    deletedAt?: number | null;
}

// In-memory storage
const notes = new Map<string, StoredNote>();
const shortCodeIndex = new Map<string, string>(); // shortCode -> token

// Cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
    if (cleanupInterval) return;

    cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [token, note] of notes.entries()) {
            if (note.expiresAt < now || note.deletedAt || (note.oneTime && note.consumed)) {
                notes.delete(token);
                shortCodeIndex.delete(note.shortCode);
            }
        }
    }, 60000); // Every minute
}

export class MemoryStorage implements Storage {
    constructor() {
        startCleanup();
    }

    async createNote(
        input: CreateNoteInput,
        token: string,
        shortCode: string
    ): Promise<CreateNoteResult> {
        const now = Date.now();
        const expiresAt = now + input.ttlSeconds * 1000;
        const id = crypto.randomUUID();

        const note: StoredNote = {
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
            plaintext: input.e2ee ? undefined : input.text,
            ciphertext: input.e2ee ? input.ciphertext : undefined,
            iv: input.e2ee ? input.iv : undefined,
            deletedAt: null,
        };

        notes.set(token, note);
        shortCodeIndex.set(shortCode, token);

        return { token, shortCode, expiresAt };
    }

    async getNote(token: string, consume: boolean): Promise<GetNoteResult> {
        const now = Date.now();
        const stored = notes.get(token);

        if (!stored) {
            return { note: null, error: 'not_found' };
        }

        if (stored.deletedAt) {
            return { note: null, error: 'deleted' };
        }

        if (stored.expiresAt < now) {
            return { note: null, error: 'expired' };
        }

        if (stored.oneTime && stored.consumed) {
            return { note: null, error: 'consumed' };
        }

        // Consume if needed
        if (consume) {
            stored.viewCount++;
            if (stored.oneTime) {
                stored.consumed = true;
            }
        }

        const note: Note = {
            id: stored.id,
            token: stored.token,
            shortCode: stored.shortCode,
            createdAt: stored.createdAt,
            expiresAt: stored.expiresAt,
            oneTime: stored.oneTime,
            viewCount: stored.viewCount,
            consumed: stored.consumed,
            liveMode: stored.liveMode,
            e2ee: stored.e2ee,
            payload: {
                plaintext: stored.plaintext,
                ciphertext: stored.ciphertext,
                iv: stored.iv,
            },
            deletedAt: stored.deletedAt,
        };

        return { note };
    }

    async getTokenByShortCode(shortCode: string): Promise<string | null> {
        const normalized = shortCode.toUpperCase();
        const token = shortCodeIndex.get(normalized);

        if (!token) return null;

        const note = notes.get(token);
        if (!note) return null;

        const now = Date.now();
        if (note.deletedAt || note.expiresAt < now || (note.oneTime && note.consumed)) {
            return null;
        }

        return token;
    }

    async deleteNote(token: string): Promise<boolean> {
        const note = notes.get(token);
        if (!note || note.deletedAt) return false;

        note.deletedAt = Date.now();
        return true;
    }

    async updateNoteContent(token: string, payload: Note['payload']): Promise<boolean> {
        const note = notes.get(token);
        if (!note || note.deletedAt) return false;

        if (payload.plaintext !== undefined) note.plaintext = payload.plaintext;
        if (payload.ciphertext !== undefined) note.ciphertext = payload.ciphertext;
        if (payload.iv !== undefined) note.iv = payload.iv;

        return true;
    }

    async cleanup(): Promise<number> {
        const now = Date.now();
        let count = 0;

        for (const [token, note] of notes.entries()) {
            if (note.expiresAt < now || note.deletedAt || (note.oneTime && note.consumed)) {
                notes.delete(token);
                shortCodeIndex.delete(note.shortCode);
                count++;
            }
        }

        return count;
    }
}
