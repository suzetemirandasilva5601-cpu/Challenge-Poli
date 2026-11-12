"use client";

import { useEffect, useRef, useState } from "react";
import { AlertIcon } from "./icons";

/**
 * Janela de confirmação para ações que não têm volta (apagar, revogar).
 * Aparece por cima da tela; Esc ou tocar fora cancela. O foco começa em
 * "Cancelar", para um toque acidental não confirmar nada.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-3 backdrop-blur-sm sm:items-center" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="toast-in w-full max-w-sm rounded-[var(--radius-card)] bg-white p-5 shadow-glass-hover"
        onClick={(e) => e.stopPropagation()}
      >
        {danger && (
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger-100 text-danger-700">
            <AlertIcon width={22} />
          </span>
        )}
        <h2 id="confirm-title" className="font-serif text-xl font-semibold text-ink-900">{title}</h2>
        <div className="mt-2 text-[15px] leading-relaxed text-ink-700">{children}</div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
          <button ref={cancelRef} type="button" className="btn-secondary flex-1" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            className={`btn flex-1 text-white ${danger ? "bg-danger-600 hover:bg-danger-700" : "bg-brand-600 hover:bg-brand-700"}`}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
