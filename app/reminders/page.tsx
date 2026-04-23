"use client";

import { useState, useEffect, useMemo } from "react";
import { useReminders } from "@/lib/use-reminders";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { applyAccentColor } from "@/components/settings-panel";
import { BellRingIcon, PlusIcon, CheckIcon, RepeatIcon, Trash2Icon, XIcon, ListTodoIcon, CheckSquareIcon, BookmarkIcon, CalendarDaysIcon, LogOutIcon, FileTextIcon, FileIcon, TrendingUpIcon } from "lucide-react";
import { BackgroundPicker, BackgroundImage } from "@/components/background-picker";
import Link from "next/link";
import { signOut } from "@/components/login-gate";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RemindersPage() {
  const navHidden = useScrollDirection();
  const { dueNow, upcoming, reminders, active, create, dismiss, remove } = useReminders();
  const dismissed = reminders.filter((r: any) => r.dismissed);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [repeat, setRepeat] = useState("");
  const { theme, toggleTheme } = useStore();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings = {} } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await apiFetch("/api/settings")).json(),
    staleTime: Infinity,
  });
  const saveSettings = useMutation({ mutationFn: async (data: Record<string, any>) => apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), onSuccess: (_res, data) => { queryClient.setQueryData(['settings'], (old: any) => ({ ...old, ...data })); } });
  const [remindersBgImage, setRemindersBgImage] = useState('');
  const [remindersBgOpacity, setRemindersBgOpacity] = useState(0.3);
  const [remindersBgBlur, setRemindersBgBlur] = useState(0);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await apiFetch("/api/tasks")).json(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => (await apiFetch("/api/notes")).json(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const toggleTask = useMutation({
    mutationFn: async (t: any) => apiFetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, completed: !t.completed }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (settings.accentColor) applyAccentColor(settings.accentColor);
    if (settings.remindersBgImage !== undefined) setRemindersBgImage(settings.remindersBgImage);
    if (settings.remindersBgOpacity !== undefined) setRemindersBgOpacity(settings.remindersBgOpacity);
    if (settings.remindersBgBlur !== undefined) setRemindersBgBlur(settings.remindersBgBlur);
  }, [settings]);
  const existingBgs = [settings.dashBgImage && { label: 'Dashboard', url: settings.dashBgImage }, settings.tasksBgImage && { label: 'Tasks', url: settings.tasksBgImage }, settings.notesBgImage && { label: 'Notes', url: settings.notesBgImage }].filter(Boolean);

  const today = toDateKey(new Date());

  const dueTasks = useMemo(() => {
    return tasks.filter((t: any) => t.dueDate && !t.completed);
  }, [tasks]);

  const overdueTasks = dueTasks.filter((t: any) => t.dueDate < today);
  const todayTasks = dueTasks.filter((t: any) => t.dueDate === today);
  const upcomingTasks = dueTasks.filter((t: any) => t.dueDate > today);

  const todayNotes = useMemo(() => {
    return notes.filter((n: any) => n.date === today);
  }, [notes, today]);

  const handleAdd = () => {
    if (!title || !remindAt) return;
    create.mutate({ title, description, remindAt: new Date(remindAt).toISOString(), repeat });
    setTitle(""); setDescription(""); setRemindAt(""); setRepeat(""); setAdding(false);
  };

  const priorityStyle: Record<string, string> = {
    high: "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20",
    medium: "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20",
    low: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20",
  };

  const priorityBadge: Record<string, string> = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundImage url={remindersBgImage} opacity={remindersBgOpacity} blur={remindersBgBlur} />
      {/* Top bar */}
      <div className={`sticky top-0 z-40 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-3 flex items-center gap-3 shadow-sm transition-transform duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <TrendingUpIcon className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <Link href="/bookmarks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BookmarkIcon className="w-3.5 h-3.5 text-orange-500" /> Bookmarks
        </Link>
        <Link href="/tasks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <CheckSquareIcon className="w-3.5 h-3.5" /> Tasks
        </Link>
        <Link href="/calendar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <CalendarDaysIcon className="w-3.5 h-3.5 text-blue-500" /> Diary
        </Link>
        <Link href="/notes" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <FileTextIcon className="w-3.5 h-3.5" /> Notes
        </Link>
        <Link href="/reminders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200">
          <BellRingIcon className="w-3.5 h-3.5" /> Reminders {active.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{active.length}</span>}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleTheme} className="text-xs px-3 py-1.5 rounded-lg hover:bg-secondary transition-all">
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button onClick={signOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary text-xs text-red-500 transition-all">
            <LogOutIcon className="w-3.5 h-3.5" /> Sign Out
          </button>
          <BackgroundPicker bgImage={remindersBgImage} bgOpacity={remindersBgOpacity} bgBlur={remindersBgBlur} existingBackgrounds={existingBgs}
            onChangeBg={url => { setRemindersBgImage(url); saveSettings.mutate({ remindersBgImage: url }); }}
            onChangeOpacity={v => { setRemindersBgOpacity(v); saveSettings.mutate({ remindersBgOpacity: v }); }}
            onChangeBlur={v => { setRemindersBgBlur(v); saveSettings.mutate({ remindersBgBlur: v }); }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BellRingIcon className="w-5 h-5 text-orange-500" /> Reminders & Due Tasks
          </h1>
          <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all">
            {adding ? <XIcon className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
            {adding ? "Cancel" : "New Reminder"}
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div className="border rounded-xl p-4 space-y-3 bg-secondary/30">
            <input placeholder="Reminder title" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm" autoFocus onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm" />
            <div className="flex gap-2">
              <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)}
                className="flex-1 h-9 rounded-lg border bg-background px-3 text-sm" />
              <select value={repeat} onChange={(e) => setRepeat(e.target.value)} className="h-9 rounded-lg border bg-background px-3 text-sm">
                <option value="">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button onClick={handleAdd} disabled={!title || !remindAt}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">Add</button>
            </div>
          </div>
        )}

        {/* Today's Notes */}
        {todayNotes.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase text-purple-500 mb-2">📝 Today&apos;s Notes ({todayNotes.length})</h2>
            <div className="space-y-2">
              {todayNotes.map((n: any) => (
                <NoteCard key={n.id} note={n} />
              ))}
            </div>
          </section>
        )}

        {/* Overdue section — reminders + tasks */}
        {(dueNow.length > 0 || overdueTasks.length > 0) && (
          <section>
            <h2 className="text-xs font-bold uppercase text-red-500 mb-2">🔴 Overdue ({dueNow.length + overdueTasks.length})</h2>
            <div className="space-y-2">
              {dueNow.map((r: any) => (
                <ReminderCard key={r.id} reminder={r} onDismiss={() => dismiss(r)} onDelete={() => remove.mutate(r.id)} isDue />
              ))}
              {overdueTasks.map((t: any) => (
                <TaskCard key={t.id} task={t} onToggle={() => toggleTask.mutate(t)} priorityStyle={priorityStyle} priorityBadge={priorityBadge} isDue />
              ))}
            </div>
          </section>
        )}

        {/* Today tasks */}
        {todayTasks.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase text-orange-500 mb-2">📌 Due Today ({todayTasks.length})</h2>
            <div className="space-y-2">
              {todayTasks.map((t: any) => (
                <TaskCard key={t.id} task={t} onToggle={() => toggleTask.mutate(t)} priorityStyle={priorityStyle} priorityBadge={priorityBadge} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming section — reminders + tasks */}
        {(upcoming.length > 0 || upcomingTasks.length > 0) && (
          <section>
            <h2 className="text-xs font-bold uppercase text-muted-foreground mb-2">⏰ Upcoming ({upcoming.length + upcomingTasks.length})</h2>
            <div className="space-y-2">
              {upcoming.map((r: any) => (
                <ReminderCard key={r.id} reminder={r} onDismiss={() => dismiss(r)} onDelete={() => remove.mutate(r.id)} />
              ))}
              {upcomingTasks.map((t: any) => (
                <TaskCard key={t.id} task={t} onToggle={() => toggleTask.mutate(t)} priorityStyle={priorityStyle} priorityBadge={priorityBadge} />
              ))}
            </div>
          </section>
        )}

        {/* Dismissed */}
        {dismissed.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase text-muted-foreground mb-2">✅ Dismissed ({dismissed.length})</h2>
            <div className="space-y-2 opacity-60">
              {dismissed.map((r: any) => (
                <ReminderCard key={r.id} reminder={r} onDelete={() => remove.mutate(r.id)} dismissed />
              ))}
            </div>
          </section>
        )}

        {reminders.length === 0 && dueTasks.length === 0 && todayNotes.length === 0 && !adding && (
          <p className="text-center text-muted-foreground text-sm py-12">No reminders, due tasks, or notes for today. You&apos;re all caught up!</p>
        )}
      </div>
    </div>
  );
}

function ReminderCard({ reminder, onDismiss, onDelete, isDue, dismissed }: {
  reminder: any; onDismiss?: () => void; onDelete: () => void; isDue?: boolean; dismissed?: boolean;
}) {
  const dt = new Date(reminder.remindAt);
  const timeStr = dt.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${isDue ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : "bg-background"}`}>
      <BellRingIcon className={`w-4 h-4 shrink-0 ${isDue ? "text-red-500" : "text-orange-400"}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${dismissed ? "line-through text-muted-foreground" : ""}`}>{reminder.title}</p>
        {reminder.description && <p className="text-xs text-muted-foreground mt-0.5">{reminder.description}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${isDue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>{timeStr}</span>
          {reminder.repeat && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 bg-secondary px-1.5 py-0.5 rounded-full">
              <RepeatIcon className="w-2.5 h-2.5" />{reminder.repeat}
            </span>
          )}
          <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-1.5 py-0.5 rounded-full font-medium">Reminder</span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {onDismiss && (
          <button onClick={onDismiss} title={reminder.repeat ? "Snooze to next" : "Dismiss"} className="p-1.5 rounded-lg hover:bg-secondary">
            <CheckIcon className="w-4 h-4 text-green-500" />
          </button>
        )}
        <button onClick={onDelete} title="Delete" className="p-1.5 rounded-lg hover:bg-secondary">
          <Trash2Icon className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, priorityStyle, priorityBadge, isDue }: {
  task: any; onToggle: () => void; priorityStyle: Record<string, string>; priorityBadge: Record<string, string>; isDue?: boolean;
}) {
  const dueStr = task.dueDate ? new Date(task.dueDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "";

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${isDue ? priorityStyle[task.priority] || priorityStyle.medium : "bg-background"}`}>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${task.completed ? "bg-green-500 border-green-500" : "border-slate-300 dark:border-slate-500 hover:border-green-400"}`}>
        {task.completed && <CheckIcon className="w-3 h-3 text-white" />}
      </button>
      <Link href={`/tasks?task=${task.id}`} className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity">
        <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
        {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${isDue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>{dueStr}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityBadge[task.priority] || priorityBadge.medium}`}>{task.priority}</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
            <ListTodoIcon className="w-2.5 h-2.5" />Task
          </span>
        </div>
      </Link>
    </div>
  );
}

function NoteCard({ note }: { note: any }) {
  const plainText = note.content ? note.content.replace(/<[^>]*>/g, "").slice(0, 120) : "";

  return (
    <Link href={`/notes?note=${note.id}`} className="flex items-center gap-3 rounded-xl border p-3 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:opacity-80 cursor-pointer block">
      <FileTextIcon className="w-4 h-4 shrink-0 text-purple-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{note.title || "Untitled"}</p>
        {plainText && <p className="text-xs text-muted-foreground mt-0.5 truncate">{plainText}</p>}
        <div className="flex items-center gap-2 mt-1">
          {note.category && note.category !== "default" && (
            <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-medium">{note.category}</span>
          )}
          <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
            <FileTextIcon className="w-2.5 h-2.5" />Note
          </span>
        </div>
      </div>
    </Link>
  );
}
