
// Store active SSE connections per token
// Map<token, Set<controller>>
export const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Helper function to broadcast updates to all connected clients
export function broadcastUpdate(token: string, payload: Record<string, unknown>) {
    const tokenConnections = connections.get(token);
    if (!tokenConnections) return;

    const data = `data: ${JSON.stringify({ type: 'update', payload, timestamp: Date.now() })}\n\n`;
    const encoded = new TextEncoder().encode(data);

    tokenConnections.forEach((controller) => {
        try {
            controller.enqueue(encoded);
        } catch {
            // Connection closed, will be cleaned up by the stream controller
        }
    });
}
