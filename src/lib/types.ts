/**
 * Note data types and interfaces
 */

export interface NotePayload {
    // Plain text (when not E2EE)
    plaintext?: string;
    // Encrypted payload (when E2EE)
    ciphertext?: string;
    iv?: string;
}

export interface Note {
    id: string;
    token: string;
    shortCode: string;
    createdAt: number; // Unix timestamp ms
    expiresAt: number; // Unix timestamp ms
    oneTime: boolean;
    viewCount: number;
    consumed: boolean; // For one-time notes
    liveMode: boolean;
    e2ee: boolean;
    payload: NotePayload;
    deletedAt?: number | null;
}

export interface CreateNoteInput {
    text: string;
    ttlSeconds: number;
    oneTime: boolean;
    e2ee: boolean;
    liveMode: boolean;
    // For E2EE notes, these come from client
    ciphertext?: string;
    iv?: string;
}

export interface CreateNoteResult {
    token: string;
    shortCode: string;
    expiresAt: number;
}

export interface GetNoteResult {
    note: Note | null;
    error?: 'not_found' | 'expired' | 'consumed' | 'deleted';
}

/**
 * TTL presets in seconds
 */
export const TTL_PRESETS = {
    '5min': 5 * 60,
    '10min': 10 * 60,
    '1h': 60 * 60,
    '24h': 24 * 60 * 60,
} as const;

export type TTLPreset = keyof typeof TTL_PRESETS;
