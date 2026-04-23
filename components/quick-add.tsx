"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { PlusIcon, XIcon, ListTodoIcon, FileTextIcon, BookmarkIcon, BellRingIcon } from "lucide-react";

type QuickType = "task" | "note" | "bookmark" | "reminder";

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QuickType | null>(null);
  const [title, setTitle] = useState("");
  const [extra, setExtra] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (type) setTimeout(() => inputRef.current?.focus(), 50);
  }, [type]);

  const createTask = useMutation({
    mutationFn: async (d: any) => apiFetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const createNote = useMutation({
    mutationFn: async (d: any) => apiFetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });

  const createBookmark = useMutation({
    mutationFn: async (d: any) => apiFetch("/api/bookmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const createReminder = useMutation({
    mutationFn: async (d: any) => apiFetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (type === "task") {
      createTask.mutate({ title, description: extra, priority: "medium", dueDate: today, subtasks: "[]" });
    } else if (type === "note") {
      createNote.mutate({ title, content: extra, tags: "", date: today, category: "default" });
    } else if (type === "bookmark") {
      const url = extra || title;
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      createBookmark.mutate({ title, url: fullUrl, group: "General", tags: "", position: 0 });
    } else if (type === "reminder") {
      const remindAt = extra ? new Date(extra).toISOString() : new Date(Date.now() + 3600_000).toISOString();
      createReminder.mutate({ title, remindAt });
    }

    setTitle("");
    setExtra("");
    setType(null);
    setOpen(false);
  };

  const types: { key: QuickType; label: string; icon: any; color: string }[] = [
    { key: "task", label: "Task", icon: ListTodoIcon, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
    { key: "note", label: "Note", icon: FileTextIcon, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30" },
    { key: "bookmark", label: "Bookmark", icon: BookmarkIcon, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30" },
    { key: "reminder", label: "Reminder", icon: BellRingIcon, color: "text-red-500 bg-red-50 dark:bg-red-950/30" },
  ];

  const extraPlaceholder: Record<QuickType, string> = {
    task: "Description (optional)",
    note: "Content (optional)",
    bookmark: "URL",
    reminder: "Date & time (YYYY-MM-DDTHH:MM)",
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(!open); setType(null); setTitle(""); setExtra(""); }}
        className="fixed bottom-16 right-6 z-[100] w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center"
      >
        {open ? <XIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
      </button>

      {/* Quick add panel */}
      {open && (
        <div className="fixed bottom-32 right-6 z-[100] w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {!type ? (
            <div className="p-3 space-y-1">
              <p className="text-xs font-bold uppercase text-muted-foreground px-2 pb-1">Quick Add</p>
              {types.map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:opacity-80 transition-all ${t.color}`}>
                  <t.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">New {t.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-muted-foreground">New {type}</p>
                <button onClick={() => setType(null)} className="text-muted-foreground hover:text-foreground"><XIcon className="w-4 h-4" /></button>
              </div>
              <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Title" className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              <input value={extra} onChange={e => setExtra(e.target.value)}
                placeholder={extraPlaceholder[type]}
                type={type === "reminder" ? "datetime-local" : "text"}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              <button onClick={handleSubmit} disabled={!title.trim()}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
                Add {type}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
