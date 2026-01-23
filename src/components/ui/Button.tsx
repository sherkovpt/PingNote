'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        children,
        variant = 'primary',
        size = 'md',
        loading = false,
        icon,
        className,
        disabled,
        ...props
    }, ref) => {
        const baseStyles = `
      inline-flex items-center justify-center gap-2 font-medium rounded-lg
      transition-all duration-200 cursor-pointer border-none
      focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    `;

        const variantStyles = {
            primary: 'btn-nebula-primary',
            secondary: 'btn-nebula-secondary',
            ghost: 'hover:bg-white/10 text-text-secondary hover:text-white',
            danger: 'bg-error/10 text-error border border-error/20 hover:bg-error/20 hover:border-error/40 hover:shadow-[0_0_15px_rgba(255,0,85,0.4)]',
        };

        const sizeStyles = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2.5 text-sm',
            lg: 'px-6 py-3 text-base',
        };

        return (
            <button
                ref={ref}
                className={clsx(
                    baseStyles,
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                ) : icon ? (
                    icon
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

// Icon Button variant
export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, size = 'md', ...props }, ref) => {
        const sizeStyles = {
            sm: 'p-1.5',
            md: 'p-2.5',
            lg: 'p-3',
        };

        return (
            <Button
                ref={ref}
                className={clsx('!px-0 aspect-square', sizeStyles[size], className)}
                size={size}
                {...props}
            />
        );
    }
);

IconButton.displayName = 'IconButton';
