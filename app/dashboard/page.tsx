"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { useStore } from "@/lib/store";
import { useReminders } from "@/lib/use-reminders";
import { applyAccentColor } from "@/components/settings-panel";
import Link from "next/link";
import {
  BookmarkIcon, CheckSquareIcon, CalendarDaysIcon, FileTextIcon, BellRingIcon,
  LogOutIcon, CheckIcon, ArrowRightIcon, ClockIcon, TrendingUpIcon, ListTodoIcon, BookOpenIcon,
} from "lucide-react";
import { BackgroundPicker, BackgroundImage } from "@/components/background-picker";
import { signOut, getAuthUser } from "@/components/login-gate";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const { theme, toggleTheme } = useStore();
  const navHidden = useScrollDirection();
  const { active: activeReminders, dueNow, upcoming: upcomingReminders, dismiss } = useReminders();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { setMounted(true); }, []);

  const { data: settings = {} } = useQuery({ queryKey: ["settings"], queryFn: async () => (await apiFetch("/api/settings")).json(), staleTime: Infinity });
  const saveSettings = useMutation({ mutationFn: async (data: Record<string, any>) => apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), onSuccess: (_res, data) => { queryClient.setQueryData(['settings'], (old: any) => ({ ...old, ...data })); } });
  const [dashBgImage, setDashBgImage] = useState('');
  const [dashBgOpacity, setDashBgOpacity] = useState(0.3);
  const [dashBgBlur, setDashBgBlur] = useState(0);
  useEffect(() => {
    if (settings.accentColor) applyAccentColor(settings.accentColor);
    if (settings.dashBgImage !== undefined) setDashBgImage(settings.dashBgImage);
    if (settings.dashBgOpacity !== undefined) setDashBgOpacity(settings.dashBgOpacity);
    if (settings.dashBgBlur !== undefined) setDashBgBlur(settings.dashBgBlur);
  }, [settings]);
  const existingBgs = [settings.tasksBgImage && { label: 'Tasks', url: settings.tasksBgImage }, settings.notesBgImage && { label: 'Notes', url: settings.notesBgImage }, settings.remindersBgImage && { label: 'Reminders', url: settings.remindersBgImage }].filter(Boolean);

  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: async () => (await apiFetch("/api/tasks")).json(), staleTime: 0 });
  const { data: notes = [] } = useQuery({ queryKey: ["notes"], queryFn: async () => (await apiFetch("/api/notes")).json(), staleTime: 0 });
  const { data: bookmarks = [] } = useQuery({ queryKey: ["bookmarks"], queryFn: async () => (await apiFetch("/api/bookmarks")).json() });

  const toggleTask = useMutation({
    mutationFn: async (t: any) => apiFetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, completed: !t.completed }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const today = toDateKey(new Date());
  const now = new Date();
  const greetTime = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const user = getAuthUser();
  const greeting = user?.firstName ? `${greetTime}, ${user.firstName}` : greetTime;

  const todayTasks = useMemo(() => tasks.filter((t: any) => t.dueDate === today && !t.completed), [tasks, today]);
  const overdueTasks = useMemo(() => tasks.filter((t: any) => t.dueDate && t.dueDate < today && !t.completed), [tasks, today]);
  const todayNotes = useMemo(() => notes.filter((n: any) => n.date === today), [notes, today]);
  const recentBookmarks = useMemo(() => [...bookmarks].sort((a: any, b: any) => b.createdAt?.localeCompare(a.createdAt)).slice(0, 5), [bookmarks]);

  const completedToday = useMemo(() => tasks.filter((t: any) => t.completed && t.updatedAt?.startsWith(today)).length, [tasks, today]);
  const totalOpen = tasks.filter((t: any) => !t.completed).length;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundImage url={dashBgImage} opacity={dashBgOpacity} blur={dashBgBlur} />
      {/* Top bar */}
      <div className={`sticky top-0 z-40 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-3 flex items-center gap-3 shadow-sm transition-transform duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200">
          <TrendingUpIcon className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <Link href="/bookmarks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BookmarkIcon className="w-3.5 h-3.5 text-orange-500" /> Bookmarks
        </Link>
        <Link href="/tasks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <CheckSquareIcon className="w-3.5 h-3.5" /> Tasks {totalOpen > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalOpen}</span>}
        </Link>
        <Link href="/calendar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <CalendarDaysIcon className="w-3.5 h-3.5 text-blue-500" /> Diary
        </Link>
        <Link href="/notes" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <FileTextIcon className="w-3.5 h-3.5" /> Notes
        </Link>
        <Link href="/reminders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BellRingIcon className="w-3.5 h-3.5" /> Reminders {activeReminders.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeReminders.length}</span>}
        </Link>
        <Link href="/notebooks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BookOpenIcon className="w-3.5 h-3.5 text-indigo-500" /> Notebooks
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleTheme} className="text-xs px-3 py-1.5 rounded-lg hover:bg-secondary transition-all">
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button onClick={signOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary text-xs text-red-500 transition-all">
            <LogOutIcon className="w-3.5 h-3.5" /> Sign Out
          </button>
          <BackgroundPicker bgImage={dashBgImage} bgOpacity={dashBgOpacity} bgBlur={dashBgBlur} existingBackgrounds={existingBgs}
            onChangeBg={url => { setDashBgImage(url); saveSettings.mutate({ dashBgImage: url }); }}
            onChangeOpacity={v => { setDashBgOpacity(v); saveSettings.mutate({ dashBgOpacity: v }); }}
            onChangeBlur={v => { setDashBgBlur(v); saveSettings.mutate({ dashBgBlur: v }); }} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6 relative z-10">
        {/* Greeting */}
        <div className="rounded-2xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-lg border border-white/30 dark:border-slate-700/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h1 className="text-2xl font-bold drop-shadow-sm">{greeting} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Open Tasks" value={totalOpen} icon={ListTodoIcon} color="text-blue-500" shadow="shadow-[0_4px_20px_rgba(59,130,246,0.15)] dark:shadow-[0_4px_20px_rgba(59,130,246,0.1)]" />
          <StatCard label="Completed Today" value={completedToday} icon={CheckIcon} color="text-green-500" shadow="shadow-[0_4px_20px_rgba(34,197,94,0.15)] dark:shadow-[0_4px_20px_rgba(34,197,94,0.1)]" />
          <StatCard label="Active Reminders" value={activeReminders.length} icon={BellRingIcon} color="text-red-500" shadow="shadow-[0_4px_20px_rgba(239,68,68,0.15)] dark:shadow-[0_4px_20px_rgba(239,68,68,0.1)]" />
          <StatCard label="Total Bookmarks" value={bookmarks.length} icon={BookmarkIcon} color="text-orange-500" shadow="shadow-[0_4px_20px_rgba(249,115,22,0.15)] dark:shadow-[0_4px_20px_rgba(249,115,22,0.1)]" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Overdue tasks */}
            {overdueTasks.length > 0 && (
              <Section title="🔴 Overdue" count={overdueTasks.length} color="text-red-500">
                {overdueTasks.slice(0, 5).map((t: any) => (
                  <TaskRow key={t.id} task={t} onToggle={() => toggleTask.mutate(t)} overdue />
                ))}
                {overdueTasks.length > 5 && <SeeMore href="/tasks" count={overdueTasks.length - 5} />}
              </Section>
            )}

            {/* Today's tasks */}
            <Section title="📌 Today&apos;s Tasks" count={todayTasks.length} color="text-orange-500">
              {todayTasks.length === 0 && <Empty text="No tasks due today" />}
              {todayTasks.slice(0, 5).map((t: any) => (
                <TaskRow key={t.id} task={t} onToggle={() => toggleTask.mutate(t)} />
              ))}
              {todayTasks.length > 5 && <SeeMore href="/tasks" count={todayTasks.length - 5} />}
            </Section>

            {/* Due reminders */}
            {dueNow.length > 0 && (
              <Section title="🔔 Due Reminders" count={dueNow.length} color="text-red-500">
                {dueNow.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-[0_2px_8px_rgba(239,68,68,0.1)] hover:shadow-md transition-all">
                    <BellRingIcon className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.remindAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => dismiss(r)} className="p-1 rounded hover:bg-secondary"><CheckIcon className="w-4 h-4 text-green-500" /></button>
                  </div>
                ))}
              </Section>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Today's notes */}
            <Section title="📝 Today&apos;s Notes" count={todayNotes.length} color="text-purple-500">
              {todayNotes.length === 0 && <Empty text="No notes for today" />}
              {todayNotes.slice(0, 4).map((n: any) => (
                <Link key={n.id} href={`/notes?note=${n.id}`} className="flex items-center gap-3 p-2.5 rounded-xl border hover:bg-secondary/50 hover:shadow-md transition-all">
                  <FileTextIcon className="w-4 h-4 text-purple-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground truncate">{(n.content || "").replace(/<[^>]*>/g, "").slice(0, 60)}</p>
                  </div>
                </Link>
              ))}
              {todayNotes.length > 4 && <SeeMore href="/notes" count={todayNotes.length - 4} />}
            </Section>

            {/* Upcoming reminders */}
            {upcomingReminders.length > 0 && (
              <Section title="⏰ Upcoming Reminders" count={upcomingReminders.length} color="text-muted-foreground">
                {upcomingReminders.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl border hover:shadow-md transition-all">
                    <ClockIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.remindAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Recent bookmarks */}
            <Section title="🔖 Recent Bookmarks" count={recentBookmarks.length} color="text-orange-500">
              {recentBookmarks.length === 0 && <Empty text="No bookmarks yet" />}
              {recentBookmarks.map((b: any) => (
                <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl border border-white/30 dark:border-slate-700/30 bg-white/40 dark:bg-slate-800/30 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-slate-800/50 hover:shadow-md transition-all">
                  {b.icon ? <img src={b.icon} className="w-4 h-4 shrink-0" alt="" /> : <BookmarkIcon className="w-4 h-4 text-orange-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.url}</p>
                  </div>
                </a>
              ))}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, shadow }: { label: string; value: number; icon: any; color: string; shadow: string }) {
  return (
    <div className={`rounded-2xl border border-white/30 dark:border-slate-700/30 p-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-lg ${shadow} hover:scale-[1.03] hover:bg-white/70 dark:hover:bg-slate-900/60 transition-all duration-200`}>
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Section({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/30 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/40 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] backdrop-blur-lg">
      <h2 className={`text-xs font-bold uppercase mb-3 ${color}`}>{title} ({count})</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function TaskRow({ task, onToggle, overdue }: { task: any; onToggle: () => void; overdue?: boolean }) {
  const priorityColor: Record<string, string> = { high: "text-red-500", medium: "text-yellow-500", low: "text-blue-500" };
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all hover:shadow-md ${overdue ? "bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/50 shadow-[0_2px_8px_rgba(239,68,68,0.1)]" : "bg-white/40 dark:bg-slate-800/30 border border-white/30 dark:border-slate-700/30 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-slate-800/50"}`}>
      <button onClick={onToggle} className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 border-slate-300 dark:border-slate-500 hover:border-green-400 transition-colors">
        {task.completed && <CheckIcon className="w-3 h-3 text-white" />}
      </button>
      <Link href={`/tasks?task=${task.id}`} className="flex-1 min-w-0 hover:opacity-80">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <div className="flex gap-2 mt-0.5">
          <span className={`text-[10px] font-medium ${priorityColor[task.priority] || ""}`}>{task.priority}</span>
          {task.dueDate && <span className="text-[10px] text-muted-foreground">{task.dueDate}</span>}
        </div>
      </Link>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground py-3 text-center">{text}</p>;
}

function SeeMore({ href, count }: { href: string; count: number }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs text-primary hover:underline px-2 pt-1">
      +{count} more <ArrowRightIcon className="w-3 h-3" />
    </Link>
  );
}
