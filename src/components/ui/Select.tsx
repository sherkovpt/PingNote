'use client';

import React from 'react';
import { clsx } from 'clsx';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    label?: string;
    id?: string;
    className?: string;
}

export function Select({
    value,
    onChange,
    options,
    label,
    id,
    className
}: SelectProps) {
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

    return (
        <div className={clsx('flex flex-col gap-1.5', className)}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="text-sm font-medium text-text-secondary"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    id={selectId}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={clsx(
                        'w-full appearance-none px-3 py-2 pr-10 rounded-lg',
                        'bg-bg-secondary border border-border',
                        'text-text-primary text-sm',
                        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
                        'transition-colors duration-200',
                        'cursor-pointer'
                    )}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

// Segmented control for TTL selection
interface SegmentedControlProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    label?: string;
}

export function SegmentedControl({
    value,
    onChange,
    options,
    label
}: SegmentedControlProps) {
    return (
        <div className="flex flex-col gap-2">
            {label && (
                <span className="text-sm font-medium text-text-secondary">
                    {label}
                </span>
            )}
            <div className="flex bg-bg-secondary rounded-lg p-1 gap-1">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={clsx(
                            'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                            value === option.value
                                ? 'bg-accent text-white shadow-sm'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
