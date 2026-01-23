'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './Modal';
import { CopyButton } from './CopyButton';

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    shortCode?: string;
}

export function QRModal({ isOpen, onClose, url, shortCode }: QRModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="QR Code" size="sm">
            <div className="flex flex-col items-center gap-6">
                {/* QR Code */}
                <div className="p-4 bg-white rounded-xl">
                    <QRCodeSVG
                        value={url}
                        size={200}
                        level="M"
                        includeMargin={false}
                    />
                </div>

                {/* Info */}
                <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">
                        Digitaliza com o telemóvel para abrir a nota
                    </p>

                    {shortCode && (
                        <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-bg-secondary rounded-lg">
                            <span className="text-text-muted text-sm">Código:</span>
                            <span className="font-mono text-lg font-bold text-accent tracking-widest">
                                {shortCode}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full">
                    <CopyButton
                        text={url}
                        label="Copiar link"
                        variant="secondary"
                        className="flex-1"
                    />
                    {shortCode && (
                        <CopyButton
                            text={shortCode}
                            label="Copiar código"
                            variant="secondary"
                            className="flex-1"
                        />
                    )}
                </div>
            </div>
        </Modal>
    );
}

// Inline QR display (not modal)
interface QRDisplayProps {
    url: string;
    size?: number;
    className?: string;
}

export function QRDisplay({ url, size = 160, className }: QRDisplayProps) {
    return (
        <div className={`p-3 bg-white rounded-xl inline-block ${className || ''}`}>
            <QRCodeSVG
                value={url}
                size={size}
                level="M"
                includeMargin={false}
            />
        </div>
    );
}
