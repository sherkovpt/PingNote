import React from 'react';

export const metadata = {
    title: 'Sobre - PingNote',
    description: 'Como funciona o PingNote e informações sobre privacidade',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="py-6 px-4 border-b border-border">
                <div className="container mx-auto max-w-2xl flex items-center justify-between">
                    <a href="/" className="text-2xl font-bold">
                        <span className="gradient-text">Ping</span>
                        <span className="text-text-primary">Note</span>
                    </a>
                    <a
                        href="/"
                        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Criar nota
                    </a>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 py-12 px-4">
                <div className="container mx-auto max-w-2xl">
                    <h1 className="text-3xl font-bold text-text-primary mb-8">
                        Sobre o PingNote
                    </h1>

                    <div className="space-y-8">
                        {/* How it works */}
                        <section className="card">
                            <h2 className="text-xl font-semibold text-text-primary mb-4">
                                Como funciona
                            </h2>
                            <div className="space-y-3 text-text-secondary">
                                <p>
                                    O PingNote permite partilhares texto de forma rápida entre dispositivos:
                                </p>
                                <ol className="list-decimal list-inside space-y-2 ml-2">
                                    <li>Escreves a nota no teu computador ou telemóvel</li>
                                    <li>Recebes um link, código curto ou QR code</li>
                                    <li>Abres no outro dispositivo</li>
                                </ol>
                                <p>
                                    As notas expiram automaticamente após o tempo definido e podem ser
                                    configuradas para leitura única (apagadas após serem lidas).
                                </p>
                            </div>
                        </section>

                        {/* Privacy */}
                        <section className="card">
                            <h2 className="text-xl font-semibold text-text-primary mb-4">
                                Privacidade
                            </h2>
                            <div className="space-y-3 text-text-secondary">
                                <p>
                                    <strong className="text-text-primary">Notas normais:</strong> O conteúdo
                                    é armazenado no servidor de forma temporária e apagado após expiração.
                                </p>
                                <p>
                                    <strong className="text-text-primary">Notas encriptadas (E2EE):</strong> O
                                    conteúdo é encriptado no teu browser antes de ser enviado. O servidor
                                    nunca vê o texto — apenas dados encriptados. A chave de desencriptação
                                    está no link (após o #), que nunca é enviado ao servidor.
                                </p>
                                <p>
                                    <strong className="text-text-primary">Leitura única:</strong> A nota é
                                    apagada permanentemente assim que é visualizada pela primeira vez.
                                </p>
                            </div>
                        </section>

                        {/* Technical */}
                        <section className="card">
                            <h2 className="text-xl font-semibold text-text-primary mb-4">
                                Detalhes técnicos
                            </h2>
                            <div className="space-y-3 text-text-secondary">
                                <ul className="space-y-2">
                                    <li>
                                        <strong className="text-text-primary">Encriptação:</strong> AES-256-GCM
                                        com Web Crypto API
                                    </li>
                                    <li>
                                        <strong className="text-text-primary">Tokens:</strong> 21 caracteres
                                        (~128 bits de entropia)
                                    </li>
                                    <li>
                                        <strong className="text-text-primary">Códigos curtos:</strong> 6
                                        caracteres sem ambiguidade (sem 0/O, 1/I/l)
                                    </li>
                                    <li>
                                        <strong className="text-text-primary">Expiração:</strong> Limpeza
                                        automática de notas expiradas
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Tips */}
                        <section className="card bg-accent/5 border-accent/20">
                            <h2 className="text-xl font-semibold text-accent mb-4">
                                Dicas de utilização
                            </h2>
                            <div className="space-y-3 text-text-secondary">
                                <ul className="space-y-2">
                                    <li>
                                        🔐 Usa <strong>E2EE</strong> para informação sensível como passwords
                                    </li>
                                    <li>
                                        ⏱️ Usa <strong>leitura única</strong> para dados que só devem ser vistos uma vez
                                    </li>
                                    <li>
                                        📱 Usa o <strong>QR code</strong> para transferir rapidamente para telemóvel
                                    </li>
                                    <li>
                                        ⌨️ Usa o <strong>código curto</strong> quando não podes digitalizar QR
                                    </li>
                                </ul>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 px-4 border-t border-border">
                <div className="container mx-auto max-w-2xl text-center text-sm text-text-muted">
                    <a href="/" className="hover:text-accent transition-colors">
                        PingNote
                    </a>
                    {' • '}
                    Partilha de notas instantâneas
                </div>
            </footer>
        </div>
    );
}
