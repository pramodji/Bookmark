"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import { SearchIcon, XIcon, BookmarkIcon, ListTodoIcon, FileTextIcon, BellRingIcon } from "lucide-react";

const typeIcons: Record<string, any> = {
  bookmark: BookmarkIcon,
  task: ListTodoIcon,
  note: FileTextIcon,
  reminder: BellRingIcon,
};

const typeColors: Record<string, string> = {
  bookmark: "text-orange-500",
  task: "text-blue-500",
  note: "text-purple-500",
  reminder: "text-red-500",
};

export function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
        setResults(await res.json());
        setSelected(0);
      } catch { setResults([]); }
      setLoading(false);
    }, 200);
  }, []);

  const navigate = (result: any) => {
    setOpen(false);
    if (result.type === "bookmark" && result.subtitle?.startsWith("http")) {
      window.open(result.subtitle, "_blank");
    } else {
      router.push(result.url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) navigate(results[selected]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <SearchIcon className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); search(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder="Search bookmarks, tasks, notes, reminders…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {query && <button onClick={() => { setQuery(""); setResults([]); }}><XIcon className="w-4 h-4 text-muted-foreground" /></button>}
          <kbd className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map((r, i) => {
              const Icon = typeIcons[r.type] || SearchIcon;
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => navigate(r)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${i === selected ? "bg-primary/10" : "hover:bg-secondary"}`}
                  onMouseEnter={() => setSelected(i)}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${typeColors[r.type] || ""}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full capitalize">{r.type}</span>
                </button>
              );
            })}
          </div>
        )}

        {query && !loading && results.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">No results found</div>
        )}

        {loading && (
          <div className="p-4 text-center text-xs text-muted-foreground">Searching…</div>
        )}

        {!query && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Type to search across all your data • <kbd className="bg-secondary px-1 py-0.5 rounded font-mono">↑↓</kbd> navigate • <kbd className="bg-secondary px-1 py-0.5 rounded font-mono">Enter</kbd> open
          </div>
        )}
      </div>
    </div>
  );
}
