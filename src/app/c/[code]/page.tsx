'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResolveCodePage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    useEffect(() => {
        const resolveCode = async () => {
            try {
                const response = await fetch(`/api/code/${code}`);
                const data = await response.json();

                if (response.ok && data.token) {
                    router.replace(`/n/${data.token}`);
                } else {
                    // Redirect to code entry page with error
                    router.replace('/c?error=not_found');
                }
            } catch {
                router.replace('/c?error=error');
            }
        };

        resolveCode();
    }, [code, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-card-light hover:bg-card-hover border border-white/10 rounded-lg transition-colors text-text-primary font-medium"
            >
                Criar nova nota
            </Link>
        </div>
    );
}
