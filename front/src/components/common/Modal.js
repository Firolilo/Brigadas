import React from 'react';
import Button from './Button';

// Modal base minimalista (inspirado en Dialog de shadcn/ui)
const Modal = ({ open, onClose, title, children, footer }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60"
                role="button"
                tabIndex={0}
                aria-label="Cerrar"
                onClick={onClose}
                onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onClose(); }}
            />
            <div className="relative bg-white text-neutral-900 w-[96vw] max-w-4xl max-h-[85vh] overflow-auto border border-red-100 rounded-xl shadow-lg">
                <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white rounded-t-xl">
                    <h3 className="text-base font-semibold">{title}</h3>
                    <Button variant="secondary" size="sm" onClick={onClose} aria-label="Cerrar">Cerrar</Button>
                </div>
                <div className="p-5">
                    {children}
                </div>
                {footer && (
                    <div className="px-5 py-4 border-t border-red-100 bg-white rounded-b-xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;


