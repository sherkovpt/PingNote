import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { createToken, createShortCode } from '@/lib/tokens';
import { TTL_PRESETS } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, ttlSeconds, oneTime, e2ee, liveMode, ciphertext, iv } = body;

        // Validate required fields
        if (e2ee) {
            if (!ciphertext || !iv) {
                return NextResponse.json(
                    { error: 'Campos ciphertext e iv são obrigatórios para notas E2EE' },
                    { status: 400 }
                );
            }
        } else {
            if (!text || typeof text !== 'string') {
                return NextResponse.json(
                    { error: 'O campo texto é obrigatório' },
                    { status: 400 }
                );
            }

            if (text.length > 50000) {
                return NextResponse.json(
                    { error: 'Texto demasiado longo (máximo 50000 caracteres)' },
                    { status: 400 }
                );
            }
        }

        // Validate TTL
        const ttl = typeof ttlSeconds === 'number' && ttlSeconds > 0
            ? Math.min(ttlSeconds, 24 * 60 * 60) // Max 24h
            : TTL_PRESETS['10min']; // Default 10min

        // Generate token and short code
        const token = createToken();
        const shortCode = createShortCode();

        // Store note
        const storage = await getStorage();
        const result = await storage.createNote(
            {
                text: e2ee ? '' : text,
                ttlSeconds: ttl,
                oneTime: !!oneTime,
                e2ee: !!e2ee,
                liveMode: !!liveMode,
                ciphertext: e2ee ? ciphertext : undefined,
                iv: e2ee ? iv : undefined,
            },
            token,
            shortCode
        );

        // Build response
        const baseUrl = getBaseUrl(request);

        return NextResponse.json({
            token: result.token,
            shortCode: result.shortCode,
            expiresAt: result.expiresAt,
            url: `${baseUrl}/n/${result.token}`,
            shortUrl: `${baseUrl}/c/${result.shortCode}`,
        });

    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json(
            { error: 'Erro ao criar nota' },
            { status: 500 }
        );
    }
}

function getBaseUrl(request: NextRequest): string {
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    return `${protocol}://${host}`;
}
