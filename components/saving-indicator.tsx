"use client";
import { useIsMutating } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

export function SavingIndicator() {
  const mutating = useIsMutating();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (mutating > 0) {
      clearTimeout(timer.current);
      setState("saving");
    } else if (state === "saving") {
      setState("saved");
      timer.current = setTimeout(() => setState("idle"), 1500);
    }
    return () => clearTimeout(timer.current);
  }, [mutating]);

  if (state === "idle") return null;

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-2 text-xs font-medium pl-3 pr-4 py-2 rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-300 ${
      state === "saving"
        ? "bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 translate-y-0 opacity-100"
        : "bg-emerald-50/90 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 translate-y-0 opacity-100"
    }`}
      style={{ animation: state === "saved" ? "none" : "modal-slide-up 0.25s ease-out" }}
    >
      {state === "saving" ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-slate-300 dark:border-slate-500 border-t-primary rounded-full animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </>
      )}
    </div>
  );
}
