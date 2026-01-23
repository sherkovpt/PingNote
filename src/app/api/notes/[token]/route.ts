import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { isValidToken } from '@/lib/tokens';

interface RouteParams {
    params: Promise<{ token: string }>;
}

// GET /api/notes/[token] - Get a note by token
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { token } = await params;

        // Validate token format
        if (!isValidToken(token)) {
            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 400 }
            );
        }

        // Check if this is a peek request (don't consume one-time notes)
        const peek = request.nextUrl.searchParams.get('peek') === 'true';

        const storage = await getStorage();
        const result = await storage.getNote(token, !peek);

        if (result.error) {
            const errorMessages: Record<string, { message: string; status: number }> = {
                not_found: { message: 'Nota não encontrada', status: 404 },
                expired: { message: 'Esta nota expirou', status: 410 },
                consumed: { message: 'Esta nota já foi lida e foi apagada', status: 410 },
                deleted: { message: 'Esta nota foi apagada', status: 410 },
            };

            const errorInfo = errorMessages[result.error] || { message: 'Erro desconhecido', status: 500 };

            return NextResponse.json(
                { error: errorInfo.message, code: result.error },
                { status: errorInfo.status }
            );
        }

        const note = result.note!;

        // Don't send internal fields
        return NextResponse.json({
            e2ee: note.e2ee,
            oneTime: note.oneTime,
            liveMode: note.liveMode,
            expiresAt: note.expiresAt,
            viewCount: note.viewCount,
            payload: note.payload,
        });

    } catch (error) {
        console.error('Error getting note:', error);
        return NextResponse.json(
            { error: 'Erro ao obter nota' },
            { status: 500 }
        );
    }
}

// DELETE /api/notes/[token] - Delete a note
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { token } = await params;

        // Validate token format
        if (!isValidToken(token)) {
            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 400 }
            );
        }

        const storage = await getStorage();
        const deleted = await storage.deleteNote(token);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Nota não encontrada ou já apagada' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Nota apagada' });

    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json(
            { error: 'Erro ao apagar nota' },
            { status: 500 }
        );
    }
}
