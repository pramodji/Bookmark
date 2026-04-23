"use client";


import { apiFetch } from "@/lib/api-fetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, TrashIcon, CheckIcon, Edit2Icon, XIcon, GripVerticalIcon, BookmarkIcon, BookOpenIcon, ListTodoIcon, FileTextIcon, CopyIcon, SettingsIcon, LogOutIcon, BellIcon, RepeatIcon, TrendingUpIcon } from "lucide-react";
import { BackgroundPicker, BackgroundImage } from "@/components/background-picker";
import { applyAccentColor } from "@/components/settings-panel";
import { useStore } from "@/lib/store";
import { showUndoToast } from "@/components/undo-toast";
import { useLoading } from "@/components/loading-provider";
import { isAuthenticated, signOut } from "@/components/login-gate";
import { useReminders } from "@/lib/use-reminders";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-red-500/10 text-red-500",
};
const priorityBorderColors: Record<string, string> = {
  low: "#3b82f6",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function TasksPage() {
  const { theme } = useStore();
  const { setLoading } = useLoading();
  const { create: reminderCreate, active: activeReminders } = useReminders();
  const admin = typeof window !== "undefined" ? isAuthenticated() : false;
  const navHidden = useScrollDirection();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tags, setTags] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [repeat, setRepeat] = useState("");
  const [editModal, setEditModal] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editTags, setEditTags] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editRepeat, setEditRepeat] = useState("");
  const [editSubtasks, setEditSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings = {} } = useQuery({ queryKey: ['settings'], queryFn: async () => (await apiFetch('/api/settings')).json(), staleTime: Infinity });
  const saveSettings = useMutation({ mutationFn: async (data: Record<string, any>) => apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), onSuccess: (_res, data) => { queryClient.setQueryData(['settings'], (old: any) => ({ ...old, ...data })); } });
  const [tasksBgImage, setTasksBgImage] = useState('');
  const [tasksBgOpacity, setTasksBgOpacity] = useState(0.3);
  const [tasksBgBlur, setTasksBgBlur] = useState(0);
  useEffect(() => {
    if (settings?.accentColor) applyAccentColor(settings.accentColor);
    if (settings.tasksBgImage !== undefined) setTasksBgImage(settings.tasksBgImage);
    if (settings.tasksBgOpacity !== undefined) setTasksBgOpacity(settings.tasksBgOpacity);
    if (settings.tasksBgBlur !== undefined) setTasksBgBlur(settings.tasksBgBlur);
  }, [settings]);
  const existingBgs = [settings.dashBgImage && { label: 'Dashboard', url: settings.dashBgImage }, settings.notesBgImage && { label: 'Notes', url: settings.notesBgImage }, settings.remindersBgImage && { label: 'Reminders', url: settings.remindersBgImage }].filter(Boolean);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await apiFetch("/api/tasks")).json(),
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Hide loading when data is loaded
  useEffect(() => {
    if (!tasksLoading && mounted) {
      setLoading(false);
    }
  }, [tasksLoading, mounted, setLoading]);

  // Auto-open task from URL param ?task=<id>
  const searchParams = useSearchParams();
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId && tasks.length > 0 && !editModal) {
      const task = tasks.find((t: any) => t.id === taskId);
      if (task) openEdit(task);
    }
  }, [searchParams, tasks]);

  const createMutation = useMutation({
    mutationFn: async (data: any) =>
      (await apiFetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setTitle(""); setDescription(""); setTags(""); setDueDate("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/tasks?id=${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) =>
      (await apiFetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: any[]) =>
      apiFetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reordered) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const reordered = [...tasks];
    const from = reordered.findIndex((t: any) => t.id === draggedId);
    const to = reordered.findIndex((t: any) => t.id === targetId);
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    queryClient.setQueryData(["tasks"], reordered);
    reorderMutation.mutate(reordered);
    setDraggedId(null);
  };

  const openEdit = (task: any) => {
    setEditModal(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority || "medium");
    setEditTags(task.tags || "");
    setEditDueDate(task.dueDate || "");
    setEditRepeat(task.repeat || "");
    try { setEditSubtasks(JSON.parse(task.subtasks || "[]")); } catch { setEditSubtasks([]); }
  };

  const saveEdit = () => {
    if (!editModal) return;
    updateMutation.mutate({ ...editModal, title: editTitle, description: editDescription, priority: editPriority, tags: editTags, dueDate: editDueDate, repeat: editRepeat, subtasks: JSON.stringify(editSubtasks) });
    setEditModal(null);
  };

  const toggleComplete = (task: any) => updateMutation.mutate({ id: task.id, completed: !task.completed });

  const toggleSubtask = (task: any, subId: string) => {
    const subtasks = JSON.parse(task.subtasks || "[]").map((s: any) => s.id === subId ? { ...s, completed: !s.completed } : s);
    updateMutation.mutate({ id: task.id, subtasks: JSON.stringify(subtasks) });
  };

  const allTags: string[] = Array.from(new Set(
    tasks.flatMap((t: any) => t.tags ? t.tags.split(",").map((x: string) => x.trim()).filter(Boolean) : [])
  ));
  const today = new Date().toISOString().split("T")[0];

  const filtered = tasks.filter((t: any) => {
    if (showCompleted && !t.completed) return false;
    if (!showCompleted && t.completed) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterTag !== "all" && !(t.tags || "").split(",").map((x: string) => x.trim()).includes(filterTag)) return false;
    return true;
  });

  const openCount = tasks.filter((t: any) => !t.completed).length;

  return (
    <div className="min-h-screen relative">
      <BackgroundImage url={tasksBgImage} opacity={tasksBgOpacity} blur={tasksBgBlur} />
      <div className={`fixed top-0 left-0 right-0 z-40 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-3 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-transform duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <TrendingUpIcon className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <Link href="/bookmarks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BookmarkIcon className="w-3.5 h-3.5 text-orange-500" /> Bookmarks
        </Link>
        <Link href="/calendar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BookOpenIcon className="w-3.5 h-3.5 text-blue-500" /> Diary
        </Link>
        <Link href="/tasks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200">
          <ListTodoIcon className="w-3.5 h-3.5" /> Tasks
        </Link>
        {openCount > 0 && <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{openCount}</span>}
        <Link href="/notes" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <FileTextIcon className="w-3.5 h-3.5 text-purple-500" /> Notes
        </Link>
        <Link href="/reminders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BellIcon className="w-3.5 h-3.5" /> Reminders {activeReminders.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeReminders.length}</span>}
        </Link>
        <div className="flex gap-2 ml-auto">
          <BackgroundPicker bgImage={tasksBgImage} bgOpacity={tasksBgOpacity} bgBlur={tasksBgBlur} existingBackgrounds={existingBgs}
            onChangeBg={url => { setTasksBgImage(url); saveSettings.mutate({ tasksBgImage: url }); }}
            onChangeOpacity={v => { setTasksBgOpacity(v); saveSettings.mutate({ tasksBgOpacity: v }); }}
            onChangeBlur={v => { setTasksBgBlur(v); saveSettings.mutate({ tasksBgBlur: v }); }} />
          <Button size="sm" variant="ghost" onClick={signOut} className="hover:scale-110 transition-all duration-200 text-red-500 hover:text-red-600"><LogOutIcon className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto pt-20 px-6 relative z-10">

      <div className="bg-secondary/50 p-6 rounded-lg mb-6" style={{ display: admin ? undefined : 'none' }}>
        <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-3"
          onKeyDown={(e) => e.key === "Enter" && title && createMutation.mutate({ title, description, priority, tags, dueDate, repeat, subtasks: "[]" })} />
        <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="mb-3" rows={2} />
        <div className="flex gap-3 mb-3 flex-wrap">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="flex h-10 rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="flex-1" />
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" />
          <select value={repeat} onChange={(e) => setRepeat(e.target.value)} className="flex h-10 rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <Button onClick={() => createMutation.mutate({ title, description, priority, tags, dueDate, repeat, subtasks: "[]" })} disabled={!title}>
          <PlusIcon className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-xs" disabled={showAllTasks} />
        <button onClick={() => setShowAllTasks(!showAllTasks)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showAllTasks ? "bg-primary text-primary-foreground" : "bg-background hover:bg-secondary"}`}>
          {showAllTasks ? "Show by Date" : "Show All Tasks"}
        </button>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-xs">
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {allTags.length > 0 && (
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-xs">
            <option value="all">All Tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <button onClick={() => setShowCompleted(!showCompleted)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showCompleted ? "bg-primary text-primary-foreground" : "bg-background hover:bg-secondary"}`}>
          {showCompleted ? "Show Open" : `Completed (${tasks.filter((t: any) => t.completed).length})`}
        </button>
      </div>

      {showAllTasks ? (
        <div>
          <h2 className="text-lg font-semibold mb-4">All Tasks</h2>
          <div className="space-y-3">
            {filtered.map((task: any) => {
              const subtasks = (() => { try { return JSON.parse(task.subtasks || "[]"); } catch { return []; } })();
              const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
              return (
                <div key={task.id} draggable onDragStart={() => setDraggedId(task.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(task.id)}
                  className={`p-4 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] border-l-4 ${task.completed ? "opacity-60" : ""} ${draggedId === task.id ? "opacity-40" : ""}`}
                  style={{ borderLeftColor: isOverdue ? "#ef4444" : priorityBorderColors[task.priority] || "#e2e8f0", border: "1px solid #e2e8f0", borderLeftWidth: "4px", backgroundColor: (priorityBorderColors[task.priority] || "") + "18" }}>
                  <div className="flex items-start gap-3">
                    <GripVerticalIcon className="w-4 h-4 mt-1.5 text-muted-foreground/40 shrink-0 cursor-grab" />
                    <button onClick={() => toggleComplete(task)}
                      className="mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                      style={{ backgroundColor: task.completed ? (priorityBorderColors[task.priority] || '#64748b') : 'transparent', border: `2px solid ${priorityBorderColors[task.priority] || '#64748b'}` }}>
                      {task.completed && <CheckIcon className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                      {task.description && <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>}
                      <div className="flex gap-2 mt-1.5 flex-wrap items-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>{task.priority}</span>
                        {task.dueDate && (
                          <span className={`text-xs px-2 py-0.5 rounded ${isOverdue ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-secondary text-muted-foreground"}`}>
                            Due {task.dueDate}
                          </span>
                        )}
                        {task.repeat && (
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-0.5">
                            <RepeatIcon className="w-3 h-3" />{task.repeat}
                          </span>
                        )}
                        {task.tags && task.tags.split(",").map((tag: string) => tag.trim() && (
                          <span key={tag} className="text-xs bg-primary/10 px-2 py-0.5 rounded">{tag.trim()}</span>
                        ))}
                      </div>
                      {subtasks.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {subtasks.map((s: any) => (
                            <div key={s.id} className="flex items-center gap-2">
                              <button onClick={() => toggleSubtask(task, s.id)}
                                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all"
                                style={{ backgroundColor: s.completed ? (priorityBorderColors[task.priority] || '#64748b') : 'transparent', border: `2px solid ${priorityBorderColors[task.priority] || '#64748b'}` }}>
                                {s.completed && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                              </button>
                              <span className={`text-sm ${s.completed ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground">{subtasks.filter((s: any) => s.completed).length}/{subtasks.length} done</p>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(task)} style={{ display: admin ? undefined : 'none' }}><Edit2Icon className="w-4 h-4 text-blue-400 hover:text-blue-600" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => createMutation.mutate({ title: `${task.title} - copy`, description: task.description, priority: task.priority, tags: task.tags, dueDate: task.dueDate, subtasks: task.subtasks })} style={{ display: admin ? undefined : 'none' }}><CopyIcon className="w-4 h-4 text-green-400 hover:text-green-600" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(task)} style={{ display: admin ? undefined : 'none' }}><TrashIcon className="w-4 h-4 text-red-400 hover:text-red-600" /></Button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No tasks found</p>
            )}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Tasks for {selectedDate === today ? 'Today' : selectedDate}</h2>
          <div className="space-y-3">
            {filtered.filter((t: any) => t.dueDate === selectedDate).map((task: any) => {
          const subtasks = (() => { try { return JSON.parse(task.subtasks || "[]"); } catch { return []; } })();
          const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
          return (
            <div key={task.id} draggable onDragStart={() => setDraggedId(task.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(task.id)}
              className={`p-4 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] border-l-4 ${task.completed ? "opacity-60" : ""} ${draggedId === task.id ? "opacity-40" : ""}`}
              style={{ borderLeftColor: isOverdue ? "#ef4444" : priorityBorderColors[task.priority] || "#e2e8f0", border: "1px solid #e2e8f0", borderLeftWidth: "4px", backgroundColor: (priorityBorderColors[task.priority] || "") + "18" }}>
              <div className="flex items-start gap-3">
                <GripVerticalIcon className="w-4 h-4 mt-1.5 text-muted-foreground/40 shrink-0 cursor-grab" />
                <button onClick={() => toggleComplete(task)}
                  className="mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{ backgroundColor: task.completed ? (priorityBorderColors[task.priority] || '#64748b') : 'transparent', border: `2px solid ${priorityBorderColors[task.priority] || '#64748b'}` }}>
                  {task.completed && <CheckIcon className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                  {task.description && <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>}
                  <div className="flex gap-2 mt-1.5 flex-wrap items-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>{task.priority}</span>
                    {task.dueDate && (
                      <span className={`text-xs px-2 py-0.5 rounded ${isOverdue ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-secondary text-muted-foreground"}`}>
                        Due {task.dueDate}
                      </span>
                    )}
                    {task.repeat && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-0.5">
                        <RepeatIcon className="w-3 h-3" />{task.repeat}
                      </span>
                    )}
                    {task.tags && task.tags.split(",").map((tag: string) => tag.trim() && (
                      <span key={tag} className="text-xs bg-primary/10 px-2 py-0.5 rounded">{tag.trim()}</span>
                    ))}
                  </div>
                  {subtasks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {subtasks.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <button onClick={() => toggleSubtask(task, s.id)}
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all"
                            style={{ backgroundColor: s.completed ? (priorityBorderColors[task.priority] || '#64748b') : 'transparent', border: `2px solid ${priorityBorderColors[task.priority] || '#64748b'}` }}>
                            {s.completed && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                          </button>
                          <span className={`text-sm ${s.completed ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">{subtasks.filter((s: any) => s.completed).length}/{subtasks.length} done</p>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(task)} style={{ display: admin ? undefined : 'none' }}><Edit2Icon className="w-4 h-4 text-blue-400 hover:text-blue-600" /></Button>
                <Button variant="ghost" size="sm" onClick={() => createMutation.mutate({ title: `${task.title} - copy`, description: task.description, priority: task.priority, tags: task.tags, dueDate: task.dueDate, subtasks: task.subtasks })} style={{ display: admin ? undefined : 'none' }}><CopyIcon className="w-4 h-4 text-green-400 hover:text-green-600" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(task)} style={{ display: admin ? undefined : 'none' }}><TrashIcon className="w-4 h-4 text-red-400 hover:text-red-600" /></Button>
              </div>
            </div>
          );
        })}
        {filtered.filter((t: any) => t.dueDate === selectedDate).length === 0 && (
          <p className="text-center text-muted-foreground py-8">No tasks for this date</p>
        )}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Tasks without Date</h2>
        <div className="space-y-3">
          {filtered.filter((t: any) => !t.dueDate).map((task: any) => {
            const subtasks = (() => { try { return JSON.parse(task.subtasks || "[]"); } catch { return []; } })();
            const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
            return (
              <div key={task.id} draggable onDragStart={() => setDraggedId(task.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(task.id)}
                className={`p-4 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] border-l-4 ${task.completed ? "opacity-60" : ""} ${draggedId === task.id ? "opacity-40" : ""}`}
                style={{ borderLeftColor: isOverdue ? "#ef4444" : priorityBorderColors[task.priority] || "#e2e8f0", border: "1px solid #e2e8f0", borderLeftWidth: "4px", backgroundColor: (priorityBorderColors[task.priority] || "") + "18" }}>
                <div className="flex items-start gap-3">
                  <GripVerticalIcon className="w-4 h-4 mt-1.5 text-muted-foreground/40 shrink-0 cursor-grab" />
                  <button onClick={() => toggleComplete(task)}
                    className="mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={{ backgroundColor: task.completed ? (priorityBorderColors[task.priority] || '#64748b') : 'transparent', border: `2px solid ${priorityBorderColors[task.priority] || '#64748b'}` }}>
                    {task.completed && <CheckIcon className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                    {task.description && <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>}
                    <div className="flex gap-2 mt-1.5 flex-wrap items-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>{task.priority}</span>
                      {task.repeat && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-0.5">
                          <RepeatIcon className="w-3 h-3" />{task.repeat}
                        </span>
                      )}
                      {task.tags && task.tags.split(",").map((tag: string) => tag.trim() && (
                        <span key={tag} className="text-xs bg-primary/10 px-2 py-0.5 rounded">{tag.trim()}</span>
                      ))}
                    </div>
                    {subtasks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {subtasks.map((s: any) => (
                          <div key={s.id} className="flex items-center gap-2">
                            <button onClick={() => toggleSubtask(task, s.id)}
                              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all"
                              style={{ backgroundColor: s.completed ? (priorityBorderColors[task.priority] || '#64748b') : 'transparent', border: `2px solid ${priorityBorderColors[task.priority] || '#64748b'}` }}>
                              {s.completed && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                            </button>
                            <span className={`text-sm ${s.completed ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">{subtasks.filter((s: any) => s.completed).length}/{subtasks.length} done</p>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(task)} style={{ display: admin ? undefined : 'none' }}><Edit2Icon className="w-4 h-4 text-blue-400 hover:text-blue-600" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => createMutation.mutate({ title: `${task.title} - copy`, description: task.description, priority: task.priority, tags: task.tags, dueDate: task.dueDate, subtasks: task.subtasks })} style={{ display: admin ? undefined : 'none' }}><CopyIcon className="w-4 h-4 text-green-400 hover:text-green-600" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(task)} style={{ display: admin ? undefined : 'none' }}><TrashIcon className="w-4 h-4 text-red-400 hover:text-red-600" /></Button>
                </div>
              </div>
            );
          })}
          {filtered.filter((t: any) => !t.dueDate).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No tasks without date</p>
          )}
        </div>
      </div>
    </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">Delete task?</h2>
            <p className="text-sm text-slate-500 mb-5">&quot;<span className="font-medium text-slate-700 dark:text-slate-300">{confirmDelete.title}</span>&quot; will be permanently deleted.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={() => { const task = confirmDelete; deleteMutation.mutate(task.id); showUndoToast(`Deleted "${task.title}"`, () => { createMutation.mutate({ title: task.title, description: task.description, priority: task.priority, dueDate: task.dueDate, tags: task.tags, subtasks: task.subtasks, repeat: task.repeat }); }); setConfirmDelete(null); }} className="px-4 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditModal(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-8 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Edit Task</h3>
              <button onClick={() => setEditModal(null)}><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-1"><label className="text-xs font-bold uppercase text-muted-foreground">Title</label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-xs font-bold uppercase text-muted-foreground">Description</label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} /></div>
            <div className="flex gap-3">
              <div className="space-y-1 flex-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Priority</label>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="w-full h-10 rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div className="space-y-1 flex-1"><label className="text-xs font-bold uppercase text-muted-foreground">Due Date</label><Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} /></div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Repeat</label>
              <select value={editRepeat} onChange={(e) => setEditRepeat(e.target.value)} className="w-full h-10 rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-1"><label className="text-xs font-bold uppercase text-muted-foreground">Tags</label><Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="tag1, tag2" /></div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Subtasks</label>
              {editSubtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <button onClick={() => setEditSubtasks(editSubtasks.map(x => x.id === s.id ? { ...x, completed: !x.completed } : x))}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${s.completed ? "bg-primary border-primary" : ""}`}>
                    {s.completed && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                  </button>
                  <Input value={s.title} onChange={(e) => setEditSubtasks(editSubtasks.map(x => x.id === s.id ? { ...x, title: e.target.value } : x))} className="h-7 text-sm flex-1" />
                  <button onClick={() => setEditSubtasks(editSubtasks.filter(x => x.id !== s.id))}><XIcon className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Add subtask..." value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} className="h-7 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter" && newSubtask.trim()) { setEditSubtasks([...editSubtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]); setNewSubtask(""); } }} />
                <Button size="sm" variant="secondary" className="h-7 px-2" onClick={() => { if (newSubtask.trim()) { setEditSubtasks([...editSubtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]); setNewSubtask(""); } }}>
                  <PlusIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Reminder</label>
              <div className="flex gap-2">
                <Input type="datetime-local" id="taskReminder" className="flex-1 h-8 text-sm" />
                <Button size="sm" variant="secondary" className="h-8 px-3" onClick={() => {
                  const input = document.getElementById('taskReminder') as HTMLInputElement;
                  if (!input?.value || !editModal) return;
                  reminderCreate.mutate({ title: editTitle || editModal.title, remindAt: new Date(input.value).toISOString(), linkedType: 'task', linkedId: editModal.id });
                  input.value = '';
                }}><BellIcon className="w-3.5 h-3.5 mr-1" /> Set</Button>
              </div>
            </div>
            <Button onClick={saveEdit} disabled={!editTitle} className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em]">Update</Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
