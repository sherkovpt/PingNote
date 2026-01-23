import {
    Note,
    CreateNoteInput,
    CreateNoteResult,
    GetNoteResult,
} from '../types';

/**
 * Storage interface - implemented by Memory and Redis backends
 */
export interface Storage {
    /**
     * Create a new note
     */
    createNote(input: CreateNoteInput, token: string, shortCode: string): Promise<CreateNoteResult>;

    /**
     * Get a note by token
     * For one-time notes, this also marks them as consumed (atomic operation)
     */
    getNote(token: string, consume: boolean): Promise<GetNoteResult>;

    /**
     * Get token by short code
     */
    getTokenByShortCode(shortCode: string): Promise<string | null>;

    /**
     * Delete a note
     */
    deleteNote(token: string): Promise<boolean>;

    /**
     * Update note content (for live mode)
     */
    updateNoteContent(token: string, payload: Note['payload']): Promise<boolean>;

    /**
     * Cleanup expired notes
     */
    cleanup?(): Promise<number>;

    /**
     * Close connection
     */
    close?(): Promise<void>;
}

// Singleton storage instance
let storageInstance: Storage | null = null;

/**
 * Get the storage instance (lazy initialization)
 * Uses Redis if REDIS_URL is set, otherwise falls back to in-memory storage
 */
export async function getStorage(): Promise<Storage> {
    if (storageInstance) {
        return storageInstance;
    }

    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
        // Use Redis for production
        console.log('Using Redis storage');
        const { RedisStorage } = await import('./redis');
        storageInstance = new RedisStorage(redisUrl);
    } else {
        // Use in-memory for development
        console.log('Using in-memory storage (data will not persist)');
        const { MemoryStorage } = await import('./memory');
        storageInstance = new MemoryStorage();
    }

    return storageInstance;
}

/**
 * Reset storage (for testing)
 */
export function resetStorage(): void {
    storageInstance = null;
}
