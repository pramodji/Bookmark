"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { XIcon, Undo2Icon } from "lucide-react";

interface UndoItem {
  id: string;
  label: string;
  onUndo: () => void;
  timer: ReturnType<typeof setTimeout>;
}

let _addToast: ((label: string, onUndo: () => void) => void) | null = null;

export function showUndoToast(label: string, onUndo: () => void) {
  _addToast?.(label, onUndo);
}

export function UndoToastContainer() {
  const [items, setItems] = useState<UndoItem[]>([]);

  const add = useCallback((label: string, onUndo: () => void) => {
    const id = Date.now().toString();
    const timer = setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, 6000);
    setItems(prev => [...prev, { id, label, onUndo, timer }]);
  }, []);

  useEffect(() => { _addToast = add; return () => { _addToast = null; }; }, [add]);

  const dismiss = (item: UndoItem) => {
    clearTimeout(item.timer);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const undo = (item: UndoItem) => {
    clearTimeout(item.timer);
    item.onUndo();
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  if (!items.length) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 pl-4 pr-2 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-200">
          <span className="truncate max-w-[240px]">{item.label}</span>
          <button onClick={() => undo(item)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 dark:bg-black/10 hover:bg-white/30 dark:hover:bg-black/20 text-xs font-semibold transition-colors">
            <Undo2Icon className="w-3 h-3" /> Undo
          </button>
          <button onClick={() => dismiss(item)} className="p-1 hover:bg-white/20 dark:hover:bg-black/10 rounded">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
