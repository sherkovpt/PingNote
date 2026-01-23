import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { isValidShortCode, normalizeShortCode } from '@/lib/tokens';

interface RouteParams {
    params: Promise<{ code: string }>;
}

// GET /api/code/[code] - Resolve short code to token
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { code } = await params;

        // Validate short code format
        if (!isValidShortCode(code)) {
            return NextResponse.json(
                { error: 'Código inválido' },
                { status: 400 }
            );
        }

        const normalizedCode = normalizeShortCode(code);

        const storage = await getStorage();
        const token = await storage.getTokenByShortCode(normalizedCode);

        if (!token) {
            return NextResponse.json(
                { error: 'Código não encontrado ou expirado' },
                { status: 404 }
            );
        }

        // Return the token - client will redirect
        return NextResponse.json({ token });

    } catch (error) {
        console.error('Error resolving code:', error);
        return NextResponse.json(
            { error: 'Erro ao resolver código' },
            { status: 500 }
        );
    }
}
