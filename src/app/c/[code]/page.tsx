'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
            } catch (error) {
                router.replace('/c?error=error');
            }
        };

        resolveCode();
    }, [code, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-text-secondary">A abrir nota...</p>
            </div>
        </div>
    );
}
