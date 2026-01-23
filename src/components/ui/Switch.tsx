'use client';

import React from 'react';
import { clsx } from 'clsx';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    id?: string;
}

export function Switch({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    id
}: SwitchProps) {
    const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

    return (
        <div className="flex items-start gap-3">
            <button
                type="button"
                role="switch"
                id={switchId}
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={clsx(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                    checked ? 'bg-accent' : 'bg-bg-elevated',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <span
                    className={clsx(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200',
                        checked ? 'translate-x-5' : 'translate-x-0'
                    )}
                />
            </button>
            {(label || description) && (
                <div className="flex flex-col">
                    {label && (
                        <label
                            htmlFor={switchId}
                            className={clsx(
                                'text-sm font-medium cursor-pointer',
                                disabled ? 'text-text-muted' : 'text-text-primary'
                            )}
                        >
                            {label}
                        </label>
                    )}
                    {description && (
                        <span className="text-xs text-text-muted mt-0.5">
                            {description}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
