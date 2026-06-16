'use client';

import React, { useEffect, useRef } from 'react';

interface ConfirmationDialogProps {
       open: boolean;
       title: string;
       description?: string;
       confirmLabel?: string;
       cancelLabel?: string;
       onConfirm: () => Promise<void> | void;
       onCancel: () => void;
}

export default function ConfirmationDialog({
       open,
       title,
       description,
       confirmLabel = 'Confirm',
       cancelLabel = 'Cancel',
       onConfirm,
       onCancel,
}: ConfirmationDialogProps) {
       const dialogRef = useRef<HTMLDivElement | null>(null);
       const firstButtonRef = useRef<HTMLButtonElement | null>(null);

       useEffect(() => {
              if (!open) return;
              const prevActive = document.activeElement as HTMLElement | null;
              // focus the confirm button when opened
              setTimeout(() => firstButtonRef.current?.focus(), 0);

              const handleKey = (e: KeyboardEvent) => {
                     if (e.key === 'Escape') onCancel();
                     if (e.key === 'Tab') {
                            // basic focus trap
                            const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                            if (!focusable || focusable.length === 0) return;
                            const first = focusable[0];
                            const last = focusable[focusable.length - 1];
                            if (e.shiftKey && document.activeElement === first) {
                                   e.preventDefault();
                                   (last as HTMLElement).focus();
                            } else if (!e.shiftKey && document.activeElement === last) {
                                   e.preventDefault();
                                   (first as HTMLElement).focus();
                            }
                     }
              };

              document.addEventListener('keydown', handleKey);
              document.body.style.overflow = 'hidden';
              return () => {
                     document.removeEventListener('keydown', handleKey);
                     document.body.style.overflow = '';
                     prevActive?.focus();
              };
       }, [open, onCancel]);

       if (!open) return null;

       return (
              <div className="fixed inset-0 z-[2600] flex items-center justify-center p-6" role="presentation" aria-hidden={!open}>
                     <div className="fixed inset-0 bg-black/50" aria-hidden />
                     <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="confirm-dialog-title"
                            aria-describedby="confirm-dialog-desc"
                            ref={dialogRef}
                            className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 z-[2601]"
                     >
                            <h3 id="confirm-dialog-title" className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{title}</h3>
                            {description && (
                                   <p id="confirm-dialog-desc" className="text-neutral-600 dark:text-neutral-300 mb-4">{description}</p>
                            )}
                            <div className="flex items-center justify-end gap-3">
                                   <button onClick={onCancel} className="px-4 py-2 rounded-md bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700">{cancelLabel}</button>
                                   <button ref={firstButtonRef} onClick={() => void onConfirm()} className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm">{confirmLabel}</button>
                            </div>
                     </div>
              </div>
       );
}