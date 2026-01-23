import { NextRequest } from 'next/server';
import { getStorage } from '@/lib/storage';
import { isValidToken } from '@/lib/tokens';

interface RouteParams {
    params: Promise<{ token: string }>;
}

// Store active SSE connections per token
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// GET /api/live/[token] - Server-Sent Events for live updates
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    const { token } = await params;

    // Validate token format
    if (!isValidToken(token)) {
        return new Response('Token inválido', { status: 400 });
    }

    // Verify note exists and has liveMode enabled
    const storage = await getStorage();
    const result = await storage.getNote(token, false); // peek, don't consume

    if (result.error || !result.note) {
        return new Response('Nota não encontrada', { status: 404 });
    }

    if (!result.note.liveMode) {
        return new Response('Esta nota não tem modo ao vivo ativado', { status: 400 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
        start(controller) {
            // Add to connections
            if (!connections.has(token)) {
                connections.set(token, new Set());
            }
            connections.get(token)!.add(controller);

            // Send initial connection message
            const data = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                connections.get(token)?.delete(controller);
                if (connections.get(token)?.size === 0) {
                    connections.delete(token);
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

// Helper function to broadcast updates to all connected clients
export function broadcastUpdate(token: string, payload: any) {
    const tokenConnections = connections.get(token);
    if (!tokenConnections) return;

    const data = `data: ${JSON.stringify({ type: 'update', payload, timestamp: Date.now() })}\n\n`;
    const encoded = new TextEncoder().encode(data);

    tokenConnections.forEach((controller) => {
        try {
            controller.enqueue(encoded);
        } catch {
            // Connection closed, will be cleaned up
        }
    });
}

// POST /api/live/[token] - Update note content (for live typing)
export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { token } = await params;
        const body = await request.json();

        if (!isValidToken(token)) {
            return new Response('Token inválido', { status: 400 });
        }

        const storage = await getStorage();
        const result = await storage.getNote(token, false);

        if (result.error || !result.note) {
            return new Response('Nota não encontrada', { status: 404 });
        }

        if (!result.note.liveMode) {
            return new Response('Esta nota não tem modo ao vivo ativado', { status: 400 });
        }

        // Update note content
        const payload = result.note.e2ee
            ? { ciphertext: body.ciphertext, iv: body.iv }
            : { plaintext: body.text };

        await storage.updateNoteContent(token, payload);

        // Broadcast to connected clients
        broadcastUpdate(token, payload);

        return new Response('OK', { status: 200 });

    } catch (error) {
        console.error('Error updating live note:', error);
        return new Response('Erro ao atualizar', { status: 500 });
    }
}
