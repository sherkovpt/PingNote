'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, useToast } from '@/components/ui';
import { isValidShortCode } from '@/lib/tokens';

export default function EnterCodePage() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedCode = code.trim().toUpperCase();

        if (!trimmedCode) {
            addToast('warning', 'Insere um código');
            return;
        }

        if (!isValidShortCode(trimmedCode)) {
            addToast('error', 'Código inválido. Deve ter 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/code/${trimmedCode}`);
            const data = await response.json();

            if (!response.ok) {
                addToast('error', data.error || 'Código não encontrado');
                setLoading(false);
                return;
            }

            // Redirect to note
            router.push(`/n/${data.token}`);

        } catch (error) {
            console.error('Error resolving code:', error);
            addToast('error', 'Erro ao procurar código');
            setLoading(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow valid characters and uppercase
        const value = e.target.value.toUpperCase().replace(/[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g, '');
        setCode(value.slice(0, 6));
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="py-6 px-4 border-b border-border">
                <div className="container mx-auto max-w-2xl flex items-center justify-between">
                    <a href="/" className="text-2xl font-bold">
                        <span className="gradient-text">Ping</span>
                        <span className="text-text-primary">Note</span>
                    </a>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center py-8 px-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-text-primary mb-2">
                            Abrir com código
                        </h1>
                        <p className="text-text-secondary">
                            Insere o código de 6 caracteres para aceder à nota
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="card">
                        <div className="mb-6">
                            <input
                                ref={inputRef}
                                type="text"
                                value={code}
                                onChange={handleCodeChange}
                                placeholder="ABC123"
                                maxLength={6}
                                className="w-full text-center text-3xl tracking-[0.5em] font-mono font-bold p-4 bg-bg-secondary border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                                disabled={loading}
                                aria-label="Código de acesso"
                                autoComplete="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                            />

                            <p className="text-center text-sm text-text-muted mt-3">
                                {code.length}/6 caracteres
                            </p>
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            size="lg"
                            className="w-full"
                            disabled={code.length !== 6}
                        >
                            Abrir nota
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <a
                            href="/"
                            className="text-sm text-text-secondary hover:text-accent transition-colors"
                        >
                            ← Voltar para criar nota
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
