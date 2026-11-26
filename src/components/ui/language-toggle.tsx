"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/app/actions/i18n";
import type { Language } from "@/server/i18n";

export function LanguageToggle({
  current = "en",
  className = "",
}: {
  current?: Language;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const nextLang: Language = current === "en" ? "hi" : "en";
  const label = current === "en" ? "हिंदी" : "English";

  const handleToggle = () => {
    startTransition(async () => {
      const res = await setLanguage(nextLang);
      if (res.ok) {
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`btn btn-secondary btn-small text-xs font-semibold py-1 px-3 rounded border border-slate-300 hover:border-slate-400 bg-white text-slate-800 transition-colors ${className}`}
      title={current === "en" ? "हिंदी में देखें (Switch to Hindi)" : "Switch to English"}
      aria-label={current === "en" ? "Switch language to Hindi" : "Switch language to English"}
    >
      {isPending ? "…" : label}
    </button>
  );
}
