"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function isEscapeKey(event: { key: string }): boolean {
  return event.key === "Escape" || event.key === "Esc";
}

type ModalProps = {
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
};

export function Modal({ children, title = "Record details", onClose }: ModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [onClose, router]);

  useEffect(() => {
    // Move focus inside the modal dialog on mount
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (isEscapeKey(event)) {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-slate-200 p-6 outline-none my-8"
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900 truncate pr-4">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <span className="text-2xl leading-none font-bold select-none" aria-hidden="true">
              &times;
            </span>
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
