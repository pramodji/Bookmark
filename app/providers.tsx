"use client";

import { QueryClient, QueryClientProvider, useIsMutating } from "@tanstack/react-query";
import { useStore, loadStoreFromDb } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

const queryClient = new QueryClient();

function SavingIndicator() {
  const mutating = useIsMutating() > 0;
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasSaving = useRef(false);

  useEffect(() => {
    if (mutating) {
      if (timerRef.current) clearTimeout(timerRef.current);
      wasSaving.current = true;
      setState("saving");
    } else if (wasSaving.current) {
      wasSaving.current = false;
      setState("saved");
      timerRef.current = setTimeout(() => setState("idle"), 1500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [mutating]);

  if (state === "idle") return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-2.5 text-sm font-medium pl-4 pr-5 py-2.5 rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-300 ${
        state === "saving"
          ? "bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          : "bg-emerald-50/90 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
      }`}
      style={{ animation: "modal-slide-up 0.25s ease-out" }}
    >
      {state === "saving" ? (
        <>
          <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-500 border-t-primary rounded-full animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </>
      )}
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useStore((state) => state.theme);
  const ready = useStore((state) => state.ready);

  useEffect(() => { loadStoreFromDb(); }, []);

  useEffect(() => {
    if (ready) {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme, ready]);

  return (
    <QueryClientProvider client={queryClient}>
      {!ready ? <AppLoadingScreen /> : children}
      {ready && <SavingIndicator />}
    </QueryClientProvider>
  );
}

function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
