"use client";

import { useState, useEffect } from "react";
import { XIcon } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Ctrl", "B"], desc: "Focus bookmark search" },
  { keys: ["Ctrl", "K"], desc: "Spotlight search (all data)" },
  { keys: ["Ctrl", "/"], desc: "Show keyboard shortcuts" },
  { keys: ["Escape"], desc: "Close search / modal" },
  { keys: ["Ctrl", "Click"], desc: "Multi-select bookmarks" },
  { keys: ["↑", "↓"], desc: "Navigate spotlight results" },
  { keys: ["Enter"], desc: "Open spotlight result" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Keyboard Shortcuts</h2>
          <button onClick={() => setOpen(false)}><XIcon className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="p-4 space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-slate-600 dark:text-slate-300">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="px-2 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t bg-slate-50 dark:bg-slate-800/50">
          <p className="text-[10px] text-slate-400 text-center">Press <kbd className="px-1 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-700 rounded">Ctrl + /</kbd> to toggle this panel</p>
        </div>
      </div>
    </div>
  );
}
