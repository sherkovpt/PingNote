'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Switch,
  SegmentedControl,
  QRModal,
  CopyButton,
  useToast
} from '@/components/ui';
import { TTL_PRESETS } from '@/lib/types';
import { generateKey, encrypt } from '@/lib/crypto';

import Link from 'next/link';
import confetti from 'canvas-confetti';

const QRIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

type NoteState = 'empty' | 'creating' | 'ready';

interface NoteResult {
  token: string;
  shortCode: string;
  url: string;
  shortUrl: string;
  expiresAt: number;
  encryptionKey?: string;
}

const TTL_OPTIONS = [
  { value: '5min', label: '5 min' },
  { value: '10min', label: '10 min' },
  { value: '1h', label: '1 hora' },
  { value: '24h', label: '24 horas' },
];

export default function HomePage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [ttl, setTtl] = useState('10min');
  const [oneTime, setOneTime] = useState(false);
  const [e2ee, setE2ee] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [state, setState] = useState<NoteState>('empty');
  const [result, setResult] = useState<NoteResult | null>(null);
  const [showQR, setShowQR] = useState(false);
  const { addToast } = useToast();

  // Auto-focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);



  const handleCreate = async () => {
    if (!text.trim()) {
      addToast('warning', 'Escreve algo para partilhar');
      return;
    }

    setState('creating');

    try {
      const payload: {
        ttlSeconds: number;
        oneTime: boolean;
        e2ee: boolean;
        liveMode: boolean;
        text?: string;
        ciphertext?: string;
        iv?: string;
      } = {
        ttlSeconds: TTL_PRESETS[ttl as keyof typeof TTL_PRESETS],
        oneTime,
        e2ee,
        liveMode,
      };

      let encryptionKey: string | undefined;

      if (e2ee) {
        // Client-side encryption
        encryptionKey = await generateKey();
        const encrypted = await encrypt(text, encryptionKey);
        payload.ciphertext = encrypted.ciphertext;
        payload.iv = encrypted.iv;
        payload.e2ee = true;
      } else {
        payload.text = text;
      }

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar nota');
      }

      const data = await response.json();

      // Build URL with encryption key in fragment if E2EE
      let url = data.url;
      if (e2ee && encryptionKey) {
        url = `${url}#key=${encryptionKey}`;
      }

      setResult({
        ...data,
        url,
        encryptionKey,
      });

      setState('ready');

      // UX Enhancements
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f3ff', '#bd00ff', '#ff0055']
      });

      // Auto-copy link
      try {
        await navigator.clipboard.writeText(url);
        addToast('success', 'Nota criada e link copiado!');
      } catch {
        addToast('success', `Nota criada! Expira em ${TTL_OPTIONS.find(o => o.value === ttl)?.label}`);
      }

    } catch (error: unknown) {
      console.error('Error creating note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar nota';
      addToast('error', errorMessage);
      setState('empty');
    }
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    setState('empty');
    textareaRef.current?.focus();
  };

  const formatExpiry = (timestamp: number) => {
    const diff = timestamp - Date.now();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 border-b border-border">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            <span className="gradient-text-hero">Ping</span>
            <span className="text-text-primary">Note</span>
          </h1>
          <Link
            href="/c"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Inserir código
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-2xl">

          {state !== 'ready' ? (
            <>
              {/* Note editor */}
              <div className="card mb-6">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escreve a tua nota aqui..."
                  className="note-textarea"
                  disabled={state === 'creating'}
                  aria-label="Conteúdo da nota"
                />

                <div className="border-t border-border pt-4 mt-4">
                  <div className="text-xs text-text-muted text-right">
                    {text.length.toLocaleString()} caracteres
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="card mb-6 space-y-5">
                <SegmentedControl
                  label="Expira em"
                  value={ttl}
                  onChange={setTtl}
                  options={TTL_OPTIONS}
                />

                <div className="flex flex-col sm:flex-row gap-4">
                  <Switch
                    checked={oneTime}
                    onChange={setOneTime}
                    label="Leitura única"
                    description="Apaga após ser lida"
                  />

                  <Switch
                    checked={e2ee}
                    onChange={setE2ee}
                    label="Encriptada (E2EE)"
                    description="Servidor não vê o conteúdo"
                  />

                  <Switch
                    checked={liveMode}
                    onChange={setLiveMode}
                    label="Tempo real"
                    description="Atualizações ao vivo"
                  />
                </div>
              </div>

              {/* Create button */}
              <Button
                onClick={handleCreate}
                loading={state === 'creating'}
                size="lg"
                className="w-full"
                icon={<SendIcon />}
              >
                Criar e Partilhar
              </Button>
            </>
          ) : (
            /* Ready state - show share options */
            <div className="animate-fade-in">
              <div className="card mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-success/10 text-success">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Nota criada!</h2>
                    <p className="text-sm text-text-secondary">
                      Expira em {formatExpiry(result!.expiresAt)}
                      {oneTime && ' • Leitura única'}
                      {e2ee && ' • Encriptada'}
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 bg-bg-secondary rounded-lg mb-4 max-h-32 overflow-y-auto">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">
                    {text.length > 200 ? text.substring(0, 200) + '...' : text}
                  </p>
                </div>

                {/* Short code display */}
                <div className="flex items-center justify-center gap-2 p-4 bg-bg-secondary rounded-lg mb-4">
                  <span className="text-text-muted text-sm">Código:</span>
                  <span className="font-mono text-2xl font-bold text-accent tracking-widest">
                    {result!.shortCode}
                  </span>
                </div>

                {/* E2EE warning */}
                {e2ee && (
                  <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg mb-4">
                    <LockIcon />
                    <div className="text-sm">
                      <p className="font-medium text-warning">Nota encriptada</p>
                      <p className="text-text-secondary mt-1">
                        A chave de desencriptação está incluída no link. O servidor não consegue ler o conteúdo.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <CopyButton
                  text={result!.url}
                  label="Copiar link"
                  successMessage="Link copiado!"
                  variant="primary"
                  size="lg"
                  className="sm:col-span-1"
                />

                <CopyButton
                  text={result!.shortCode}
                  label="Copiar código"
                  successMessage="Código copiado!"
                  variant="secondary"
                  size="lg"
                />

                <Button
                  onClick={() => setShowQR(true)}
                  variant="secondary"
                  size="lg"
                  icon={<QRIcon />}
                >
                  QR Code
                </Button>
              </div>

              {/* New note button */}
              <Button
                onClick={handleReset}
                variant="ghost"
                size="lg"
                className="w-full"
              >
                Criar nova nota
              </Button>

              {/* QR Modal */}
              <QRModal
                isOpen={showQR}
                onClose={() => setShowQR(false)}
                url={result!.url}
                shortCode={result!.shortCode}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-border">
        <div className="container mx-auto max-w-2xl text-center text-sm text-text-muted">
          <p>
            Partilha notas de forma rápida e segura.
            {' '}
            <Link href="/about" className="text-accent hover:underline">
              Saber mais
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
