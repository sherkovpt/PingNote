import Database from 'better-sqlite3';
import path from 'path';
import {
    Note,
    CreateNoteInput,
    CreateNoteResult,
    GetNoteResult,
} from '../types';
import { Storage } from './index';

const DB_PATH = path.join(process.cwd(), 'data', 'pingnote.db');

/**
 * SQLite storage implementation
 */
export class SQLiteStorage implements Storage {
    private db: Database.Database;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Ensure data directory exists
        const fs = require('fs');
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(DB_PATH);
        this.db.pragma('journal_mode = WAL');
        this.initSchema();
        this.startCleanupJob();
    }

    private initSchema(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        short_code TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        one_time INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        consumed INTEGER NOT NULL DEFAULT 0,
        live_mode INTEGER NOT NULL DEFAULT 0,
        e2ee INTEGER NOT NULL DEFAULT 0,
        plaintext TEXT,
        ciphertext TEXT,
        iv TEXT,
        deleted_at INTEGER
      );
      
      CREATE INDEX IF NOT EXISTS idx_notes_token ON notes(token);
      CREATE INDEX IF NOT EXISTS idx_notes_short_code ON notes(short_code);
      CREATE INDEX IF NOT EXISTS idx_notes_expires_at ON notes(expires_at);
    `);
    }

    private startCleanupJob(): void {
        // Run cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    async createNote(
        input: CreateNoteInput,
        token: string,
        shortCode: string
    ): Promise<CreateNoteResult> {
        const now = Date.now();
        const expiresAt = now + input.ttlSeconds * 1000;
        const id = crypto.randomUUID();

        const stmt = this.db.prepare(`
      INSERT INTO notes (
        id, token, short_code, created_at, expires_at, one_time,
        live_mode, e2ee, plaintext, ciphertext, iv
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            token,
            shortCode,
            now,
            expiresAt,
            input.oneTime ? 1 : 0,
            input.liveMode ? 1 : 0,
            input.e2ee ? 1 : 0,
            input.e2ee ? null : input.text,
            input.e2ee ? input.ciphertext : null,
            input.e2ee ? input.iv : null
        );

        return { token, shortCode, expiresAt };
    }

    async getNote(token: string, consume: boolean): Promise<GetNoteResult> {
        const now = Date.now();

        // Use transaction for atomic one-time consumption
        const result = this.db.transaction(() => {
            const note = this.db.prepare(`
        SELECT * FROM notes WHERE token = ?
      `).get(token) as any;

            if (!note) {
                return { note: null, error: 'not_found' as const };
            }

            if (note.deleted_at) {
                return { note: null, error: 'deleted' as const };
            }

            if (note.expires_at < now) {
                return { note: null, error: 'expired' as const };
            }

            if (note.one_time && note.consumed) {
                return { note: null, error: 'consumed' as const };
            }

            // Increment view count and mark as consumed if one-time
            if (consume) {
                const updateStmt = this.db.prepare(`
          UPDATE notes 
          SET view_count = view_count + 1,
              consumed = CASE WHEN one_time = 1 THEN 1 ELSE consumed END
          WHERE token = ?
        `);
                updateStmt.run(token);
            }

            const mappedNote: Note = {
                id: note.id,
                token: note.token,
                shortCode: note.short_code,
                createdAt: note.created_at,
                expiresAt: note.expires_at,
                oneTime: !!note.one_time,
                viewCount: note.view_count + (consume ? 1 : 0),
                consumed: consume ? (!!note.one_time) : !!note.consumed,
                liveMode: !!note.live_mode,
                e2ee: !!note.e2ee,
                payload: {
                    plaintext: note.plaintext || undefined,
                    ciphertext: note.ciphertext || undefined,
                    iv: note.iv || undefined,
                },
                deletedAt: note.deleted_at || null,
            };

            return { note: mappedNote };
        })();

        return result;
    }

    async getTokenByShortCode(shortCode: string): Promise<string | null> {
        const now = Date.now();

        const note = this.db.prepare(`
      SELECT token FROM notes 
      WHERE short_code = ? 
        AND deleted_at IS NULL 
        AND expires_at > ?
        AND (one_time = 0 OR consumed = 0)
    `).get(shortCode.toUpperCase(), now) as { token: string } | undefined;

        return note?.token || null;
    }

    async deleteNote(token: string): Promise<boolean> {
        const now = Date.now();

        const result = this.db.prepare(`
      UPDATE notes SET deleted_at = ? WHERE token = ? AND deleted_at IS NULL
    `).run(now, token);

        return result.changes > 0;
    }

    async updateNoteContent(token: string, payload: Note['payload']): Promise<boolean> {
        const result = this.db.prepare(`
      UPDATE notes 
      SET plaintext = ?, ciphertext = ?, iv = ?
      WHERE token = ? AND deleted_at IS NULL
    `).run(
            payload.plaintext || null,
            payload.ciphertext || null,
            payload.iv || null,
            token
        );

        return result.changes > 0;
    }

    async cleanup(): Promise<number> {
        const now = Date.now();

        // Delete expired notes and consumed one-time notes
        const result = this.db.prepare(`
      DELETE FROM notes 
      WHERE expires_at < ? 
         OR (one_time = 1 AND consumed = 1)
         OR deleted_at IS NOT NULL
    `).run(now);

        return result.changes;
    }

    async close(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.db.close();
    }
}
