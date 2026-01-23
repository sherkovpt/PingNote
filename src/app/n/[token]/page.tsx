'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, CopyButton, useToast } from '@/components/ui';
import { decrypt } from '@/lib/crypto';

// Icons
const LockIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const WarningIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

type NoteState = 'loading' | 'ready' | 'error' | 'decrypting' | 'expired' | 'consumed' | 'deleted';

interface NoteData {
    content: string;
    e2ee: boolean;
    oneTime: boolean;
    expiresAt: number;
    viewCount: number;
}

export default function ViewNotePage() {
    const params = useParams();
    const token = params.token as string;
    const [state, setState] = useState<NoteState>('loading');
    const [note, setNote] = useState<NoteData | null>(null);
    const [error, setError] = useState<string>('');
    const { addToast } = useToast();

    // Wrap loadNote in useCallback to fix exhaustive-deps
    const loadNote = useCallback(async () => {
        try {
            setState('loading');

            const response = await fetch(`/api/notes/${token}`);
            const data = await response.json();

            if (!response.ok) {
                // Handle specific error codes
                if (data.code === 'expired') {
                    setState('expired');
                } else if (data.code === 'consumed') {
                    setState('consumed');
                } else if (data.code === 'deleted') {
                    setState('deleted');
                } else {
                    setError(data.error || 'Nota não encontrada');
                    setState('error');
                }
                return;
            }

            let content = data.payload.plaintext || '';

            // Decrypt if E2EE
            if (data.e2ee) {
                setState('decrypting');

                // Get key from URL fragment
                const hash = window.location.hash;
                const keyMatch = hash.match(/key=([^&]+)/);

                if (!keyMatch) {
                    setError('Chave de desencriptação não encontrada no link');
                    setState('error');
                    return;
                }

                try {
                    content = await decrypt(
                        data.payload.ciphertext,
                        data.payload.iv,
                        keyMatch[1]
                    );
                } catch {
                    setError('Erro ao desencriptar. Chave inválida?');
                    setState('error');
                    return;
                }
            }

            setNote({
                content,
                e2ee: data.e2ee,
                oneTime: data.oneTime,
                expiresAt: data.expiresAt,
                viewCount: data.viewCount,
            });

            setState('ready');

            if (data.oneTime) {
                addToast('warning', 'Esta nota foi apagada após esta leitura', 5000);
            }

        } catch (error) {
            console.error('Error loading note:', error);
            setError('Erro ao carregar nota');
            setState('error');
        }
    }, [token, addToast]); // Added dependencies

    useEffect(() => {
        loadNote();
    }, [loadNote]);

    const handleDelete = async () => {
        if (!confirm('Apagar esta nota? Esta ação não pode ser revertida.')) {
            return;
        }

        try {
            const response = await fetch(`/api/notes/${token}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                addToast('success', 'Nota apagada');
                setState('deleted');
            } else {
                addToast('error', 'Erro ao apagar nota');
            }
        } catch {
            addToast('error', 'Erro ao apagar nota');
        }
    };

    const formatExpiry = (timestamp: number) => {
        const diff = timestamp - Date.now();
        if (diff < 0) return 'Expirada';

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `Expira em ${hours}h ${minutes % 60}min`;
        }
        return `Expira em ${minutes} min`;
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="py-6 px-4 border-b border-border">
                <div className="container mx-auto max-w-2xl flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold">
                        <span className="gradient-text">Ping</span>
                        <span className="text-text-primary">Note</span>
                    </Link>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 py-8 px-4">
                <div className="container mx-auto max-w-2xl">

                    {/* Loading */}
                    {(state === 'loading' || state === 'decrypting') && (
                        <div className="card text-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-text-secondary">
                                {state === 'decrypting' ? 'A desencriptar...' : 'A carregar nota...'}
                            </p>
                        </div>
                    )}

                    {/* Error states */}
                    {(state === 'error' || state === 'expired' || state === 'consumed' || state === 'deleted') && (
                        <div className="card text-center py-12">
                            <div className="p-4 rounded-full bg-error/10 text-error inline-block mb-4">
                                <WarningIcon />
                            </div>
                            <h2 className="text-xl font-semibold text-text-primary mb-2">
                                {state === 'expired' && 'Nota expirada'}
                                {state === 'consumed' && 'Nota já foi lida'}
                                {state === 'deleted' && 'Nota apagada'}
                                {state === 'error' && 'Nota não encontrada'}
                            </h2>
                            <p className="text-text-secondary mb-6">
                                {state === 'expired' && 'Esta nota ultrapassou o tempo de validade.'}
                                {state === 'consumed' && 'Esta nota era de leitura única e já foi visualizada.'}
                                {state === 'deleted' && 'Esta nota foi apagada pelo criador.'}
                                {state === 'error' && (error || 'Verifica o link e tenta novamente.')}
                            </p>
                            <Button onClick={() => window.location.href = '/'}>
                                Criar nova nota
                            </Button>
                        </div>
                    )}

                    {/* Note ready */}
                    {state === 'ready' && note && (
                        <div className="animate-fade-in">
                            {/* Metadata bar */}
                            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-text-secondary">
                                {note.e2ee && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 text-success rounded-lg">
                                        <LockIcon />
                                        <span>Encriptada E2EE</span>
                                    </div>
                                )}

                                {note.oneTime && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-warning/10 text-warning rounded-lg">
                                        <WarningIcon />
                                        <span>Leitura única - Apagada</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-1.5 text-text-muted">
                                    <ClockIcon />
                                    <span>{formatExpiry(note.expiresAt)}</span>
                                </div>
                            </div>

                            {/* Note content */}
                            <div className="card mb-6">
                                <div className="note-textarea whitespace-pre-wrap break-words">
                                    {note.content}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3">
                                <CopyButton
                                    text={note.content}
                                    label="Copiar conteúdo"
                                    successMessage="Conteúdo copiado!"
                                    variant="primary"
                                    size="lg"
                                />

                                {!note.oneTime && (
                                    <Button
                                        onClick={handleDelete}
                                        variant="danger"
                                        size="lg"
                                        icon={<TrashIcon />}
                                    >
                                        Apagar nota
                                    </Button>
                                )}

                                <Button
                                    onClick={() => window.location.href = '/'}
                                    variant="ghost"
                                    size="lg"
                                >
                                    Criar nova nota
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 px-4 border-t border-border">
                <div className="container mx-auto max-w-2xl text-center text-sm text-text-muted">
                    <Link href="/" className="hover:text-accent transition-colors">
                        PingNote
                    </Link>
                    {' • '}
                    Partilha de notas instantâneas
                </div>
            </footer>
        </div>
    );
}
