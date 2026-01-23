'use client';

import React, { useState } from 'react';
import { useToast } from './Toast';
import { clsx } from 'clsx';

interface CopyButtonProps {
    text: string;
    label?: string;
    successMessage?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showIcon?: boolean;
}

const CopyIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export function CopyButton({
    text,
    label = 'Copiar',
    successMessage = 'Copiado!',
    variant = 'secondary',
    size = 'md',
    className,
    showIcon = true
}: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const { addToast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            addToast('success', successMessage);

            setTimeout(() => setCopied(false), 2000);
        } catch {
            addToast('error', 'Erro ao copiar');
        }
    };

    const variantStyles = {
        primary: `
      bg-gradient-to-r from-accent to-accent-secondary text-white
      shadow-md hover:shadow-lg hover:shadow-accent/30
    `,
        secondary: `
      bg-bg-card text-text-primary border border-border
      hover:bg-bg-elevated hover:border-accent/50
    `,
        ghost: `
      bg-transparent text-text-secondary
      hover:bg-bg-card hover:text-text-primary
    `,
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
    };

    return (
        <button
            onClick={handleCopy}
            className={clsx(
                'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
                'transition-all duration-200 cursor-pointer border-none',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                variantStyles[variant],
                sizeStyles[size],
                copied && 'bg-success/20 border-success/30 text-success',
                className
            )}
            aria-label={label}
        >
            {showIcon && (copied ? <CheckIcon /> : <CopyIcon />)}
            <span>{copied ? 'Copiado!' : label}</span>
        </button>
    );
}

// Simpler version for inline use
export function CopyIconButton({
    text,
    successMessage = 'Copiado!',
    className
}: {
    text: string;
    successMessage?: string;
    className?: string;
}) {
    const [copied, setCopied] = useState(false);
    const { addToast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            addToast('success', successMessage);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            addToast('error', 'Erro ao copiar');
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={clsx(
                'p-2 rounded-lg transition-all duration-200',
                'hover:bg-bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                copied ? 'text-success' : 'text-text-muted hover:text-text-primary',
                className
            )}
            aria-label="Copiar"
        >
            {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
    );
}
