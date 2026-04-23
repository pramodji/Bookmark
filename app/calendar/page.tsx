"use client";


import { apiFetch } from "@/lib/api-fetch";
import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, XIcon, PlusIcon, CheckIcon, BookOpenIcon, ListTodoIcon, TrashIcon, SettingsIcon, BookmarkIcon, SunIcon, FileTextIcon, CopyIcon, DownloadIcon, SearchIcon, LogOutIcon, BellIcon, TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StickyEditor } from "@/components/sticky-editor";
import { applyAccentColor } from "@/components/settings-panel";
import { isAuthenticated, signOut } from "@/components/login-gate";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

function TemplateEditorModal({ template, onSave, onClose }: {
  template: any | null;
  onSave: (name: string, content: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const tplMouseDownOnBackdrop = useRef(false);
  const tplPanelRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => { tplMouseDownOnBackdrop.current = !tplPanelRef.current?.contains(e.target as Node); }}
      onMouseUp={(e) => { if (tplMouseDownOnBackdrop.current && !tplPanelRef.current?.contains(e.target as Node)) onClose(); tplMouseDownOnBackdrop.current = false; }}
    >
      <div ref={tplPanelRef} className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Template name..."
            className="flex-1 text-base font-semibold bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            autoFocus
          />
          <button onClick={onClose}><XIcon className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex-1 overflow-hidden">
          <StickyEditor
            note={{ content: template?.content || "" }}
            onSave={(html) => onSave(name || "Untitled", html)}
            onClose={onClose}
            inline
          />
        </div>
      </div>
    </div>
  );
}

function NoteModal({ note, isNew, categories, allNoteCategories, onSave, onClose, onAutoSave, onSaveSize }: {
  note: any | null; isNew: boolean; categories: Record<string, string>; allNoteCategories: string[];
  onSave: (title: string, content: string, category: string, existingId?: string) => void;
  onClose: () => void;
  onAutoSave?: (title: string, content: string, category: string, existingId?: string) => void;
  onSaveSize?: (idx: number) => void;
}) {
  const [title, setTitle] = useState(note?.title || "");
  const [category, setCategory] = useState(note?.category || "default");
  const [createdId, setCreatedId] = useState<string | null>(note?.id || null);
  const titleRef = useRef(title);
  const categoryRef = useRef(category);
  const createdIdRef = useRef<string | null>(createdId);
  titleRef.current = title;
  categoryRef.current = category;
  createdIdRef.current = createdId;
  useEffect(() => { if (note?.id) setCreatedId(note.id); }, [note?.id]);
  const sizes = [
    { w: '560px', h: '60vh' },
    { w: '768px', h: '75vh' },
    { w: '1024px', h: '88vh' },
    { w: '100vw', h: '100vh' },
  ];
  const [sizeIdx, setSizeIdx] = useState(1);
  const isFullscreen = sizeIdx === sizes.length - 1;
  const changeSize = (delta: number) => {
    const next = Math.max(0, Math.min(sizes.length - 1, sizeIdx + delta));
    setSizeIdx(next);

    onSaveSize?.(next);
  };
  const mouseDownOnBackdrop = useRef(false);
  const modalPanelRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        mouseDownOnBackdrop.current = !modalPanelRef.current?.contains(e.target as Node);
      }}
      onMouseUp={(e) => {
        if (mouseDownOnBackdrop.current && !modalPanelRef.current?.contains(e.target as Node)) onClose();
        mouseDownOnBackdrop.current = false;
      }}
    >
      <div
        ref={modalPanelRef}
        className={`bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 transition-all ${ isFullscreen ? 'rounded-none' : 'rounded-2xl'}`}
        style={{ width: sizes[sizeIdx].w, height: sizes[sizeIdx].h, maxWidth: '100vw', maxHeight: '100vh' }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title..."
            className="flex-1 text-base font-semibold bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            autoFocus
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="text-xs rounded px-2 py-1 bg-slate-100 dark:bg-slate-800 border-0"
          >
            {Array.from(new Set([...Object.keys(categories), ...allNoteCategories])).map(cat => (
              <option key={cat} value={cat}>{cat === 'default' ? 'No Category' : cat}</option>
            ))}
          </select>
          <div className="flex items-center gap-0.5 border rounded-lg overflow-hidden">
            <button onClick={() => changeSize(-1)} disabled={sizeIdx === 0} className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500" title="Shrink">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="text-[10px] text-slate-400 px-1 select-none">{sizeIdx + 1}/{sizes.length}</span>
            <button onClick={() => changeSize(1)} disabled={sizeIdx === sizes.length - 1} className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500" title="Expand">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <button onClick={onClose}><XIcon className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex-1 overflow-hidden">
          <StickyEditor
            note={{ content: note?.content || "" }}
            onSave={(html) => onSave(titleRef.current || "Untitled", html, categoryRef.current, createdIdRef.current || undefined)}
            onClose={onClose}
            onAutoSave={onAutoSave ? (html) => onAutoSave(titleRef.current || "Untitled", html, categoryRef.current, createdIdRef.current || undefined) : undefined}
            inline
          />
        </div>
      </div>
    </div>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

// nth weekday of a month: nthWeekday(year, month0, weekday0, n)
function nthWeekday(y: number, m: number, wd: number, n: number) {
  const first = new Date(y, m, 1).getDay();
  const day = 1 + ((wd - first + 7) % 7) + (n - 1) * 7;
  return new Date(y, m, day);
}
// last weekday of a month
function lastWeekday(y: number, m: number, wd: number) {
  const last = new Date(y, m + 1, 0);
  const diff = (last.getDay() - wd + 7) % 7;
  return new Date(y, m, last.getDate() - diff);
}

function getUSHolidays(y: number): Record<string, string> {
  const h: Record<string, string> = {};
  const add = (d: Date, name: string) => { h[toDateKey(d)] = name; };
  add(new Date(y, 0, 1),  "New Year's Day");
  add(nthWeekday(y, 0, 1, 3),  "Martin Luther King Jr. Day");
  add(nthWeekday(y, 1, 1, 3),  "Presidents' Day");
  add(lastWeekday(y, 4, 1),    "Memorial Day");
  add(new Date(y, 5, 19), "Juneteenth");
  add(new Date(y, 6, 4),  "Independence Day");
  add(nthWeekday(y, 8, 1, 1),  "Labor Day");
  add(nthWeekday(y, 9, 1, 2),  "Columbus Day");
  add(new Date(y, 10, 11), "Veterans Day");
  add(nthWeekday(y, 10, 4, 4), "Thanksgiving Day");
  add(new Date(y, 11, 25), "Christmas Day");
  return h;
}

export default function CalendarPage() {
  const qc = useQueryClient();
  const admin = typeof window !== "undefined" ? isAuthenticated() : false;
  const navHidden = useScrollDirection();
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toDateKey(today));
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"notes" | "tasks">("notes");
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('system-ui');
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState("default");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; note: any } | null>(null);
  const [dayContextMenu, setDayContextMenu] = useState<{ x: number; y: number; date: string } | null>(null);
  const [dayColors, setDayColors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Record<string, string>>({ default: '#64748b', 'Out of Office': '#ef4444', 'Audit': '#f59e0b', 'Busy': '#3b82f6', 'Meeting': '#10b981', 'Personal': '#8b5cf6' });
  const [dayLabels, setDayLabels] = useState<Record<string, string>>({ '#3b82f6': 'PTO', '#10b981': 'Available', '#f59e0b': 'Busy', '#ef4444': 'Out of Office', '#8b5cf6': 'Meeting', '#ec4899': 'Personal', '#06b6d4': 'Training' });
  const [splitView, setSplitView] = useState(false);
  const [hideWeekends, setHideWeekends] = useState(false);
  const { theme } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [promptDialog, setPromptDialog] = useState<{ title: string; placeholder: string; defaultValue: string; onConfirm: (val: string) => void } | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<{ categories: Record<string,string>; dayLabels: Record<string,string> } | null>(null);
  const openSettings = () => { setIsSettingsOpen(true); setSettingsDraft({ categories: { ...categories }, dayLabels: { ...dayLabels } }); };
  const saveSettingsDraft = () => {
    if (!settingsDraft) return;
    // rename notes for any changed category keys
    Object.keys(categories).forEach(oldCat => {
      if (!settingsDraft.categories[oldCat]) {
        const newCat = Object.keys(settingsDraft.categories).find(k => !Object.keys(categories).includes(k));
        if (newCat) notes.filter((n: any) => n.category === oldCat).forEach((n: any) => updateNote.mutate({ ...n, category: newCat, silent: true }));
      }
    });
    setCategories(settingsDraft.categories);
    setDayLabels(settingsDraft.dayLabels);


    saveSettings.mutate({ noteCategories: settingsDraft.categories, dayLabels: settingsDraft.dayLabels });
    setSettingsDraft(null);
    setIsSettingsOpen(false);
  };
  const [taskText, setTaskText] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [editTask, setEditTask] = useState<any | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<any | null>(null);
  const [inlinePanelEdit, setInlinePanelEdit] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ note: any | null; isNew: boolean } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [templateModal, setTemplateModal] = useState<"new" | "edit" | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [tplName, setTplName] = useState("");
  const [tplContent, setTplContent] = useState("");

  const MOM_TEMPLATE = {
    id: "__mom__", name: "Minutes of Meeting", builtIn: true,
    content: `<div style="font-family:inherit">
<div style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;padding:14px 18px;border-radius:10px 10px 0 0;margin-bottom:0">
  <div style="font-size:1.1em;font-weight:700;letter-spacing:0.01em">📋 Minutes of Meeting</div>
</div>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-top:none;padding:12px 18px;border-radius:0 0 10px 10px;margin-bottom:16px">
  <table style="width:100%;border-collapse:collapse;font-size:0.85em">
    <tr><td style="padding:3px 8px 3px 0;color:#1e40af;font-weight:600;white-space:nowrap">📅 Date &amp; Time</td><td style="padding:3px 0"> </td></tr>
    <tr><td style="padding:3px 8px 3px 0;color:#1e40af;font-weight:600;white-space:nowrap">📍 Location / Platform</td><td style="padding:3px 0"> </td></tr>
  </table>
</div>
<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:10px 14px;border-radius:6px;margin-bottom:14px">
  <div style="color:#15803d;font-weight:700;font-size:0.8em;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">👥 Attendees</div>
  <ul style="margin:0;padding-left:18px;font-size:0.88em">
    <li>Name — Role</li>
  </ul>
</div>
<div style="background:#fefce8;border-left:4px solid #eab308;padding:10px 14px;border-radius:6px;margin-bottom:14px">
  <div style="color:#a16207;font-weight:700;font-size:0.8em;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">📌 Agenda</div>
  <ol style="margin:0;padding-left:18px;font-size:0.88em">
    <li> </li>
    <li> </li>
    <li> </li>
  </ol>
</div>
<div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:10px 14px;border-radius:6px;margin-bottom:14px">
  <div style="color:#0369a1;font-weight:700;font-size:0.8em;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">💬 Discussion Points</div>
  <p style="font-weight:600;font-size:0.88em;margin:6px 0 2px">1.</p>
  <ul style="margin:0 0 8px;padding-left:18px;font-size:0.88em"><li> </li></ul>
  <p style="font-weight:600;font-size:0.88em;margin:6px 0 2px">2.</p>
  <ul style="margin:0;padding-left:18px;font-size:0.88em"><li> </li></ul>
</div>
<div style="background:#fdf4ff;border-left:4px solid #a855f7;padding:10px 14px;border-radius:6px;margin-bottom:14px">
  <div style="color:#7e22ce;font-weight:700;font-size:0.8em;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">✅ Decisions Made</div>
  <ul style="margin:0;padding-left:18px;font-size:0.88em"><li> </li></ul>
</div>
<div style="background:#fff7ed;border-left:4px solid #f97316;padding:10px 14px;border-radius:6px;margin-bottom:14px">
  <div style="color:#c2410c;font-weight:700;font-size:0.8em;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">⚡ Action Items</div>
  <table style="width:100%;border-collapse:collapse;font-size:0.85em">
    <thead><tr style="background:#fed7aa">
      <th style="padding:4px 8px;text-align:left;border-radius:4px 0 0 4px">Action</th>
      <th style="padding:4px 8px;text-align:left">Owner</th>
      <th style="padding:4px 8px;text-align:left">Due</th>
      <th style="padding:4px 8px;text-align:left;border-radius:0 4px 4px 0">Status</th>
    </tr></thead>
    <tbody><tr>
      <td style="padding:4px 8px;border-bottom:1px solid #fed7aa"> </td>
      <td style="padding:4px 8px;border-bottom:1px solid #fed7aa"> </td>
      <td style="padding:4px 8px;border-bottom:1px solid #fed7aa"> </td>
      <td style="padding:4px 8px;border-bottom:1px solid #fed7aa"><span style="background:#dcfce7;color:#15803d;padding:1px 6px;border-radius:9999px;font-size:0.8em;font-weight:600">Open</span></td>
    </tr></tbody>
  </table>
</div>
<div style="background:#f8fafc;border-left:4px solid #64748b;padding:10px 14px;border-radius:6px">
  <div style="color:#475569;font-weight:700;font-size:0.8em;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">🔜 Next Meeting</div>
  <table style="width:100%;border-collapse:collapse;font-size:0.85em">
    <tr><td style="padding:3px 8px 3px 0;color:#475569;font-weight:600;white-space:nowrap">📅 Date &amp; Time</td><td style="padding:3px 0"> </td></tr>
    <tr><td style="padding:3px 8px 3px 0;color:#475569;font-weight:600;white-space:nowrap">📋 Agenda Preview</td><td style="padding:3px 0"> </td></tr>
  </table>
</div></div>`,
  };
  const [panelWidth, setPanelWidth] = useState(320);
  const dragging = useRef(false);

  const onSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const container = (e.target as HTMLElement).closest(".calendar-root") as HTMLElement;
      if (!container) return;
      const right = container.getBoundingClientRect().right;
      const w = Math.max(200, Math.min(900, right - ev.clientX));
      setPanelWidth(w);

      saveSettings.mutate({ diaryPanelWidth: w });
    };
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const year = current.getFullYear();
  const month = current.getMonth();
  const holidays = getUSHolidays(year);

  const { data: settings = {} } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await apiFetch("/api/settings")).json(),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (settings.dayColors) setDayColors(settings.dayColors);
    if (settings.dayLabels) setDayLabels(settings.dayLabels);
    if (settings.noteCategories && Object.keys(settings.noteCategories).length > 0) setCategories(settings.noteCategories);
    if (settings.hideWeekends !== undefined) setHideWeekends(settings.hideWeekends);
    if (settings.splitView !== undefined) setSplitView(settings.splitView);
    if (settings.diaryTab) setTab(settings.diaryTab);
    if (settings.diaryPanelWidth) setPanelWidth(settings.diaryPanelWidth);
    if (settings.accentColor) applyAccentColor(settings.accentColor);
    if (settings.fontSize) setFontSize(settings.fontSize);
    if (settings.fontFamily) setFontFamily(settings.fontFamily);
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async (data: Record<string, any>) =>
      apiFetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  const { data: notes = [] } = useQuery({ queryKey: ["notes"], queryFn: async () => (await apiFetch("/api/notes")).json(), staleTime: 0, refetchOnWindowFocus: true });
  const { data: customTemplates = [] } = useQuery({ queryKey: ["note-templates"], queryFn: async () => (await apiFetch("/api/note-templates")).json() });
  const momOverride = customTemplates.find((t: any) => t.id === '__mom__');
  const allTemplates = [momOverride ? { ...MOM_TEMPLATE, ...momOverride } : MOM_TEMPLATE, ...customTemplates.filter((t: any) => t.id !== '__mom__')];

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => (await apiFetch("/api/note-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["note-templates"] }),
  });
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: any) => (await apiFetch("/api/note-templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["note-templates"] }),
  });
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/note-templates?id=${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["note-templates"] }),
  });

  const saveTemplate = () => {
    if (!tplName || !tplContent) return;
    if (templateModal === "new") createTemplateMutation.mutate({ name: tplName, content: tplContent });
    else if (editingTemplate) updateTemplateMutation.mutate({ id: editingTemplate.id, name: tplName, content: tplContent });
    setTemplateModal(null);
  };
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: async () => (await apiFetch("/api/tasks")).json(), staleTime: 0, refetchOnWindowFocus: true });
  const { data: activeReminderCount = 0 } = useQuery({ queryKey: ['reminderCount'], queryFn: async () => { const reminders = await (await apiFetch('/api/reminders')).json(); return reminders.filter((r: any) => !r.dismissed).length; }, staleTime: 30000 });

  const addNote = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; silent?: boolean }) => {
      const res = await apiFetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: data.title, content: data.content, category: data.category, date: selected }) });
      return res.json();
    },
    onSuccess: (created, vars) => { qc.invalidateQueries({ queryKey: ["notes"] }); if (!vars.silent) setNoteModal(null); }
  });

  const updateNote = useMutation({
    mutationFn: async (n: any) => apiFetch("/api/notes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n) }),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["notes"] }); setEditNote(null); if (!vars.silent) setNoteModal(null); }
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/notes?id=${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] })
  });

  const addTask = useMutation({
    mutationFn: async () => apiFetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: taskText, description: taskDesc, dueDate: selected, priority: taskPriority, completed: false }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setTaskText(""); setTaskDesc(""); setTaskDueDate(""); }
  });

  const toggleTask = useMutation({
    mutationFn: async (t: any) => apiFetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, completed: !t.completed }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] })
  });

  const updateTask = useMutation({
    mutationFn: async (t: any) => apiFetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setEditTask(null); }
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/tasks?id=${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] })
  });

  const duplicateNote = (n: any) => addNote.mutate({ title: `${n.title} - copy`, content: n.content, category: n.category, silent: true });
  const exportNote = (n: any) => { const blob = new Blob([`# ${n.title}\n\n${n.content}`], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${n.title.replace(/[^a-z0-9]/gi, '_')}.md`; a.click(); };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allCells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (allCells.length % 7 !== 0) allCells.push(null);
  const visibleDayIndices = hideWeekends ? [1,2,3,4,5] : [0,1,2,3,4,5,6];
  const visibleDays = DAYS.filter((_, i) => visibleDayIndices.includes(i));
  // Group cells into weeks then filter out weekend columns
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < allCells.length; i += 7) weeks.push(allCells.slice(i, i + 7));
  const cells = weeks.flatMap(week => week.filter((_, i) => visibleDayIndices.includes(i)));
  const gridCols = hideWeekends ? 5 : 7;

  const dayNotes = (key: string) => notes.filter((n: any) => n.date === key);
  const dayTasks = (key: string) => tasks.filter((t: any) => t.dueDate === key);

  const selNotes = noteSearch
    ? notes.filter((n: any) => n.title?.toLowerCase().includes(noteSearch.toLowerCase()) || n.content?.toLowerCase().includes(noteSearch.toLowerCase()))
    : dayNotes(selected);
  const selTasks = dayTasks(selected);

  const priorityColor: Record<string, string> = {
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  const selectedDateLabel = new Date(selected + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return !mounted ? null : (
    <div className="calendar-root flex h-screen gap-0 overflow-hidden" style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily }} onClick={() => { setContextMenu(null); setDayContextMenu(null); }}>
      {/* Title Bar */}
      <div className={`fixed top-0 left-0 right-0 z-40 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-3 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-transform duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <TrendingUpIcon className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <Link href="/bookmarks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BookmarkIcon className="w-3.5 h-3.5 text-orange-500" /> Bookmarks
        </Link>
        <Link href="/tasks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <ListTodoIcon className="w-3.5 h-3.5" /> Tasks
        </Link>
        <Link href="/calendar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200">
          <BookOpenIcon className="w-3.5 h-3.5 text-blue-300" /> Diary
        </Link>
        <Link href="/notes" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <FileTextIcon className="w-3.5 h-3.5" /> Notes
        </Link>
        <Link href="/reminders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BellIcon className="w-3.5 h-3.5" /> Reminders {activeReminderCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeReminderCount}</span>}
        </Link>
        <span className="text-sm text-slate-400 ml-2">{MONTHS[month]} {year}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCurrent(new Date(year, month - 1, 1))} className="hover:scale-110 transition-all duration-200"><ChevronLeftIcon className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setCurrent(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(toDateKey(today)); }} className="hover:scale-105 transition-all duration-200">Today</Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrent(new Date(year, month + 1, 1))} className="hover:scale-110 transition-all duration-200"><ChevronRightIcon className="w-4 h-4" /></Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {selectedDays.size > 0 && (
            <span className="text-xs text-slate-500">{selectedDays.size} day{selectedDays.size > 1 ? 's' : ''} selected</span>
          )}
          {mounted && <Button size="sm" variant="ghost" onClick={openSettings} className="hover:scale-110 transition-all duration-200" style={{ display: admin ? undefined : 'none' }}><SettingsIcon className="w-4 h-4" /></Button>}
          <Button size="sm" variant="ghost" onClick={signOut} className="hover:scale-110 transition-all duration-200 text-red-500 hover:text-red-600"><LogOutIcon className="w-4 h-4" /></Button>
          <button
            onClick={() => { const next = !hideWeekends; setHideWeekends(next); saveSettings.mutate({ hideWeekends: next }); }}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all duration-200 hover:scale-105 ${ hideWeekends ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300' : 'text-slate-500 border-slate-200 hover:border-slate-400'}`}
            title="Toggle weekends"
          >{ hideWeekends ? 'Show Weekends' : 'Hide Weekends'}</button>
        </div>
      </div>
      {/* Calendar Grid */}
      <div className="flex flex-col flex-1 min-w-0 pr-4 pt-14 overflow-hidden">
        <div className="border-l border-t rounded-tl-lg flex-1 overflow-auto" style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {visibleDays.map(d => (
            <div key={d} className="border-r border-b px-2 py-1.5 text-center text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-900">{d}</div>
          ))}
          {cells.map((day, i) => {
            const key = day ? toDateKey(new Date(year, month, day)) : "";
            const isToday = key === toDateKey(today);
            const isSel = key === selected;
            const holiday = day ? holidays[key] : null;
            const dow = day ? new Date(year, month, day).getDay() : -1;
            const isGray = day ? (dow === 0 || dow === 6 || !!holiday) : false;
            const n = day ? dayNotes(key).length : 0;
            const cellNotes = day ? dayNotes(key) : [];
            const t = day ? dayTasks(key).length : 0;
            const tDone = day ? dayTasks(key).filter((x: any) => x.completed).length : 0;
            return (
              <div
                key={i}
                onClick={(e) => {
                  if (!day) return;
                  if (e.ctrlKey || e.metaKey) {
                    const newSet = new Set(selectedDays);
                    if (newSet.has(key)) newSet.delete(key);
                    else newSet.add(key);
                    setSelectedDays(newSet);
                  } else {
                    setSelected(key);
                    setSelectedDays(new Set());
                  }
                }}
                onContextMenu={(e) => { if (day) { e.preventDefault(); setDayContextMenu({ x: e.clientX, y: e.clientY, date: key }); } }}
                className={`border-r border-b min-h-[90px] p-1.5 cursor-pointer transition-colors relative group/cell
                  ${!day ? "bg-slate-50 dark:bg-slate-950" : isGray ? "bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700" : "hover:bg-blue-50 dark:hover:bg-slate-800"}
                  ${isSel ? "ring-2 ring-inset ring-blue-400" : ""}
                  ${day && selectedDays.has(key) ? "ring-2 ring-inset ring-green-500" : ""}`}
                style={day && dayColors[key] ? { backgroundColor: `${dayColors[key]}40` } : {}}
              >
                {day && (
                  <>
                    <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-blue-500 text-white shadow-lg ring-2 ring-blue-300 dark:ring-blue-600" : "text-slate-600 dark:text-slate-300"}`}>{day}</div>
                    <div className="flex flex-wrap gap-0.5">
                      {dayColors[key] && dayLabels[dayColors[key]] && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-white w-full truncate shadow-sm" style={{ backgroundColor: dayColors[key] }}>{dayLabels[dayColors[key]]}</span>
                      )}
                      {holiday && (
                        <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-semibold w-full truncate shadow-sm">🇺🇸 {holiday}</span>
                      )}
                      {n > 0 && (
                        <span className="text-[9px] bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                          📝 {n}
                        </span>
                      )}
                      {t > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 ${tDone === t ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"}`}>
                          {tDone === t ? "✅" : "☐"} {tDone}/{t}
                        </span>
                      )}
                    </div>
                    {(cellNotes.length > 0 || dayTasks(key).length > 0 || holiday || dayColors[key]) && (
                      <div className={`absolute z-50 left-0 mb-1 mt-1 hidden group-hover/cell:flex flex-col w-72 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl ${Math.floor(i / gridCols) <= 1 ? 'top-full' : 'bottom-full'}`} style={{ minWidth: '18rem' }}>
                        {/* Tooltip header */}
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-xl">
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{new Date(key + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {holiday && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold">🇺🇸 {holiday}</span>}
                            {dayColors[key] && dayLabels[dayColors[key]] && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold text-white" style={{ backgroundColor: dayColors[key] }}>{dayLabels[dayColors[key]]}</span>}
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {/* Notes */}
                          {cellNotes.length > 0 && (
                            <div>
                              <p className="text-[9px] font-bold uppercase text-yellow-600 dark:text-yellow-400 tracking-wide mb-1 flex items-center gap-1">📝 Notes ({cellNotes.length})</p>
                              {cellNotes.map((cn: any) => (
                                <div key={cn.id} className="mb-1.5 rounded-lg p-2" style={{ backgroundColor: categories[cn.category] ? `${categories[cn.category]}18` : '#fef9c3' }}>
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-100 flex-1">{cn.title}</p>
                                    {cn.category && cn.category !== 'default' && (
                                      <span className="text-[8px] px-1 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: categories[cn.category] || '#64748b' }}>{cn.category}</span>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); setSelected(key); setNoteModal({ note: cn, isNew: false }); }} className="p-0.5 hover:opacity-80" title="Edit note"><svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                  </div>
                                  <div className="text-[10px] text-slate-600 dark:text-slate-300 prose prose-xs dark:prose-invert max-w-none line-clamp-4 note-preview" dangerouslySetInnerHTML={{ __html: cn.content || '' }} />
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Tasks */}
                          {dayTasks(key).length > 0 && (
                            <div>
                              <p className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wide mb-1 flex items-center gap-1">✅ Tasks ({dayTasks(key).filter((x:any)=>x.completed).length}/{dayTasks(key).length})</p>
                              {dayTasks(key).map((ct: any) => (
                                <div key={ct.id} className="flex items-start gap-1.5 mb-1">
                                  <span className={`mt-0.5 w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${ct.completed ? 'bg-green-500 border-green-500' : 'border-slate-400'}`}>
                                    {ct.completed && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-medium leading-tight ${ct.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{ct.title}</p>
                                    {ct.description && <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{ct.description}</p>}
                                    <div className="flex gap-1 mt-0.5">
                                      {ct.priority && (
                                        <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${
                                          ct.priority === 'high' ? 'bg-red-100 text-red-700' : ct.priority === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>{ct.priority}</span>
                                      )}
                                      {ct.dueDate && <span className="text-[8px] px-1 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Due: {new Date(ct.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Splitter */}
      <div
        onMouseDown={onSplitterMouseDown}
        className="w-1.5 shrink-0 cursor-col-resize bg-slate-200 dark:bg-slate-700 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors active:bg-blue-500"
      />

      {/* Diary Panel */}
      <div className="shrink-0 border-l flex flex-col bg-white dark:bg-slate-900 overflow-hidden" style={{ width: panelWidth }}>
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 mb-1">
            <BookOpenIcon className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold uppercase text-blue-500 tracking-wide">Diary</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedDateLabel}</p>
          {holidays[selected] && (
            <p className="text-xs text-red-500 font-medium mt-0.5">🇺🇸 {holidays[selected]}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {!splitView && (
            <>
              <button
                onClick={() => { setTab("notes"); saveSettings.mutate({ diaryTab: 'notes' }); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all duration-200 hover:scale-105 ${tab === "notes" ? "border-b-2 border-yellow-500 text-yellow-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                <BookOpenIcon className={`w-3.5 h-3.5 ${tab === "notes" ? "text-yellow-500" : "text-slate-400"}`} /> Notes
                {selNotes.length > 0 && <span className="bg-yellow-400 text-yellow-900 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{selNotes.length}</span>}
              </button>
              <button
                onClick={() => { setTab("tasks"); saveSettings.mutate({ diaryTab: 'tasks' }); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all duration-200 hover:scale-105 ${tab === "tasks" ? "border-b-2 border-blue-500 text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                <ListTodoIcon className={`w-3.5 h-3.5 ${tab === "tasks" ? "text-blue-500" : "text-slate-400"}`} /> Tasks
                {selTasks.length > 0 && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{selTasks.length}</span>}
              </button>
            </>
          )}
          {splitView && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600">
              <BookOpenIcon className="w-3.5 h-3.5 text-yellow-500" /> Notes
              <span className="text-slate-300 mx-1">|</span>
              <ListTodoIcon className="w-3.5 h-3.5 text-blue-500" /> Tasks
            </div>
          )}
          <button
            onClick={() => { const next = !splitView; setSplitView(next); saveSettings.mutate({ splitView: next }); }}
            className={`px-3 py-2 text-xs font-semibold border-l transition-all duration-200 hover:scale-105 ${splitView ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            title="Toggle split view"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
          </button>
        </div>

        {/* Content */}
        {splitView ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-2 border-b">
              <p className="text-[9px] font-bold uppercase text-yellow-600 dark:text-yellow-400 tracking-wide flex items-center gap-1 mb-2"><BookOpenIcon className="w-3 h-3" /> Notes {selNotes.length > 0 && <span className="bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full">{selNotes.length}</span>}</p>
              {selNotes.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No notes for this day</p>}
              {selNotes.map((n: any) => (
                <div key={n.id} className="rounded-lg shadow-md border-l-4 overflow-hidden" style={{ backgroundColor: categories[n.category] ? `${categories[n.category]}18` : '#fef9c3', borderLeftColor: categories[n.category] || '#f59e0b' }}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, note: n }); }}>
                  {inlinePanelEdit === n.id ? (
                    <div className="flex flex-col" style={{ minHeight: 260 }}>
                      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-black/10">
                        <input defaultValue={n.title} id={`panel-title-${n.id}`} className="flex-1 text-xs font-semibold bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100" />
                        <button onClick={() => setInlinePanelEdit(null)} className="text-slate-400 hover:text-slate-600"><XIcon className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex-1">
                        <StickyEditor
                          note={{ content: n.content || '' }}
                          onSave={(html) => { const el = document.getElementById(`panel-title-${n.id}`) as HTMLInputElement; updateNote.mutate({ ...n, title: el?.value || n.title, content: html }); setInlinePanelEdit(null); }}
                          onClose={() => setInlinePanelEdit(null)}
                          inline
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 hover:shadow-lg transition-all cursor-pointer" onClick={() => { if (noteSearch && n.date) { setSelected(n.date); setNoteSearch(''); } setNoteModal({ note: n, isNew: false }); }}>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{n.title}</span>
                        <div className="flex gap-0.5 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setInlinePanelEdit(n.id); }} className="hover:opacity-80 p-0.5" title="Edit inline"><svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button onClick={(e) => { e.stopPropagation(); setConfirmDialog({ title: 'Delete Note', message: 'Are you sure you want to delete this note?', onConfirm: () => { deleteNote.mutate(n.id); setConfirmDialog(null); } }); }} className="hover:opacity-80 p-0.5"><TrashIcon className="w-3.5 h-3.5 text-red-500" /></button>
                        </div>
                      </div>
                      <div className="prose prose-xs dark:prose-invert max-w-none text-xs note-preview" dangerouslySetInnerHTML={{ __html: n.content || '' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wide flex items-center gap-1 mb-2"><ListTodoIcon className="w-3 h-3" /> Tasks {selTasks.length > 0 && <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{selTasks.length}</span>}</p>
              {selTasks.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No tasks for this day</p>}
              {selTasks.map((t: any) => (
                <div key={t.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border-l-4" style={{ borderLeftColor: t.priority === 'high' ? '#ef4444' : t.priority === 'low' ? '#3b82f6' : '#f59e0b' }}>
                  <button onClick={() => toggleTask.mutate(t)} className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${t.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-500'}`}>{t.completed && <CheckIcon className="w-2.5 h-2.5 text-white" />}</button>
                  <p className={`text-xs flex-1 truncate ${t.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{t.title}</p>
                  <button onClick={() => setConfirmDialog({ title: 'Delete Task', message: 'Are you sure?', onConfirm: () => { deleteTask.mutate(t.id); setConfirmDialog(null); } })}><TrashIcon className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tab === "notes" && (
              <>
                {selNotes.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No notes for this day</p>}
                {selNotes.map((n: any) => (
                  <div key={n.id} className="rounded-lg shadow-md border-l-4 overflow-hidden" style={{ backgroundColor: categories[n.category] ? `${categories[n.category]}18` : '#fef9c3', borderLeftColor: categories[n.category] || '#f59e0b', transform: 'rotate(-0.3deg)' }}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, note: n }); }}>
                    {inlinePanelEdit === n.id ? (
                      <div className="flex flex-col" style={{ minHeight: 260 }}>
                        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-black/10">
                          <input defaultValue={n.title} id={`panel-title-${n.id}`} className="flex-1 text-xs font-semibold bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100" />
                          <button onClick={() => setInlinePanelEdit(null)} className="text-slate-400 hover:text-slate-600"><XIcon className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="flex-1">
                          <StickyEditor
                            note={{ content: n.content || '' }}
                            onSave={(html) => { const el = document.getElementById(`panel-title-${n.id}`) as HTMLInputElement; updateNote.mutate({ ...n, title: el?.value || n.title, content: html }); setInlinePanelEdit(null); }}
                            onClose={() => setInlinePanelEdit(null)}
                            inline
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer" onClick={() => { if (noteSearch && n.date) { setSelected(n.date); setNoteSearch(''); } setNoteModal({ note: n, isNew: false }); }}>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{n.title}</span>
                            {noteSearch && n.date && n.date !== selected && <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full ml-1">{n.date}</span>}
                            {n.category && n.category !== 'default' && (
                              <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: categories[n.category], color: 'white' }}>{n.category}</span>
                            )}
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setInlinePanelEdit(n.id); }} className="hover:opacity-80 p-0.5" title="Edit inline"><svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                            <button onClick={(e) => { e.stopPropagation(); duplicateNote(n); }} className="hover:opacity-80 p-0.5" title="Duplicate"><CopyIcon className="w-3.5 h-3.5 text-slate-400" /></button>
                            <button onClick={(e) => { e.stopPropagation(); exportNote(n); }} className="hover:opacity-80 p-0.5" title="Export"><DownloadIcon className="w-3.5 h-3.5 text-slate-400" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmDialog({ title: 'Delete Note', message: 'Are you sure you want to delete this note?', onConfirm: () => { deleteNote.mutate(n.id); setConfirmDialog(null); } }); }} className="hover:opacity-80 p-0.5"><TrashIcon className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                        </div>
                        <div className="prose prose-xs dark:prose-invert max-w-none text-xs note-preview" dangerouslySetInnerHTML={{ __html: n.content || '' }} />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            {tab === "tasks" && (
              <>
                {selTasks.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No tasks for this day</p>}
                {selTasks.map((t: any) => (
                  <div key={t.id} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 border-l-4 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all hover:scale-[1.01]" style={{ borderLeftColor: t.priority === 'high' ? '#ef4444' : t.priority === 'low' ? '#3b82f6' : '#f59e0b', transform: 'rotate(0.3deg)' }}>
                    <button onClick={() => toggleTask.mutate(t)} className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${t.completed ? "bg-green-500 border-green-500" : "border-slate-300 dark:border-slate-500"}`}>
                      {t.completed && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      {editTask?.id === t.id ? (
                        <div className="space-y-1.5">
                          <input value={editTask.title} onChange={e => setEditTask({ ...editTask, title: e.target.value })} className="w-full text-xs font-semibold rounded px-2 py-1 bg-slate-100 dark:bg-slate-800 border-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" />
                          <textarea value={editTask.description || ""} onChange={e => setEditTask({ ...editTask, description: e.target.value })} rows={2} placeholder="Description..." className="w-full text-xs rounded px-2 py-1 bg-slate-100 dark:bg-slate-800 border-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] resize-none" />
                          <div className="flex gap-1">
                            <select value={editTask.priority} onChange={e => setEditTask({ ...editTask, priority: e.target.value })} className="flex-1 text-xs rounded px-1 py-1 bg-slate-100 dark:bg-slate-800 border-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                            </select>
                            <input type="date" value={editTask.dueDate || ""} onChange={e => setEditTask({ ...editTask, dueDate: e.target.value || null })} className="flex-1 text-xs rounded px-1 py-1 bg-slate-100 dark:bg-slate-800 border-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" />
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => updateTask.mutate(editTask)}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditTask(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className={`text-xs font-medium ${t.completed ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>{t.title}</p>
                          {t.description && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>}
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {t.priority && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${priorityColor[t.priority] || priorityColor.medium}`}>{t.priority}</span>}
                            {t.dueDate && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${new Date(t.dueDate) < new Date() && !t.completed ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>Due: {new Date(t.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      {editTask?.id !== t.id && <button onClick={() => setEditTask({ ...t })} className="hover:opacity-80"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>}
                      <button onClick={() => setConfirmDialog({ title: 'Delete Task', message: 'Are you sure you want to delete this task?', onConfirm: () => { deleteTask.mutate(t.id); setConfirmDialog(null); } })} className="hover:opacity-80"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Add Input */}
        <div className="border-t p-3 space-y-2 bg-slate-50 dark:bg-slate-950" style={{ display: admin ? undefined : 'none' }}>
          {(splitView || tab === "notes") && (
            <>
              <div className="relative mb-1">
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                <input value={noteSearch} onChange={e => setNoteSearch(e.target.value)} placeholder="Search all notes..." className="w-full pl-6 pr-6 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 border-0 outline-none" />
                {noteSearch && <button onClick={() => setNoteSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><XIcon className="w-3 h-3" /></button>}
              </div>
              {noteSearch && selNotes.length > 0 && (
                <div className="text-[10px] text-slate-400 px-1">Found {selNotes.length} note{selNotes.length !== 1 ? 's' : ''} across all dates. Click to jump.</div>
              )}
              <div className="flex gap-1">
                <Button size="sm" className="flex-1 h-7 text-xs hover:scale-105 transition-all duration-200" onClick={() => setNoteModal({ note: null, isNew: true })}>
                  <PlusIcon className="w-3 h-3 mr-1" /> New Note
                </Button>
                <Button size="sm" variant="secondary" className="h-7 text-xs px-2 hover:scale-105 transition-all duration-200" onClick={() => setShowTemplates(!showTemplates)} title="Templates">
                  <FileTextIcon className="w-3 h-3" />
                </Button>
              </div>
              {showTemplates && (
                <div className="border rounded-lg p-2 space-y-1 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Templates</span>
                    <button className="text-[10px] text-blue-500 hover:underline" onClick={() => { setTplName(""); setTplContent(""); setEditingTemplate(null); setTemplateModal("new"); }}>+ New</button>
                  </div>
                  {allTemplates.map((tpl: any) => (
                    <div key={tpl.id} className="flex items-center justify-between gap-1 rounded px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="text-xs truncate flex-1">{tpl.name}</span>
                      <div className="flex gap-0.5 shrink-0">
                        <button title="Use" className="text-blue-500 hover:text-blue-700" onClick={() => { setNoteModal({ note: { title: tpl.name, content: tpl.content }, isNew: true }); setShowTemplates(false); }}><PlusIcon className="w-3 h-3" /></button>
                        <>
                          <button title="Edit" className="text-slate-400 hover:text-slate-600" onClick={() => { setTplName(tpl.name); setTplContent(tpl.content); setEditingTemplate(tpl); setTemplateModal("edit"); }}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          {!tpl.builtIn && <button title="Delete" className="text-red-400 hover:text-red-600" onClick={() => deleteTemplateMutation.mutate(tpl.id)}><TrashIcon className="w-3 h-3" /></button>}
                        </>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {(splitView || tab === "tasks") && (
            <>
              <input value={taskText} onChange={e => setTaskText(e.target.value)} onKeyDown={e => e.key === "Enter" && taskText && addTask.mutate()} placeholder="New task..." className="w-full text-xs rounded px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" />
              <div className="flex gap-2">
                <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="flex-1 text-xs rounded px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
                <Button size="sm" className="h-7 text-xs px-3 hover:scale-105 transition-all duration-200" onClick={() => taskText && addTask.mutate()} disabled={!taskText}><PlusIcon className="w-3 h-3 mr-1" /> Add</Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Day Context Menu */}
      {dayContextMenu && (
        <div className="fixed z-50 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-1 w-48 animate-in fade-in zoom-in-95 duration-150" style={{ top: dayContextMenu.y, left: dayContextMenu.x }} onClick={(e) => e.stopPropagation()}>
          {selectedDays.size > 0 && (
            <div className="px-3 py-1 text-xs text-slate-500 border-b mb-1">
              {selectedDays.size} day{selectedDays.size > 1 ? 's' : ''} selected
            </div>
          )}
          <div className="px-3 py-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Day Color</label>
            <select 
              value={selectedDays.size > 0 ? '' : (dayColors[dayContextMenu.date] || '')}
              onChange={(e) => {
                const newColors = { ...dayColors };
                const targetDays = selectedDays.size > 0 ? Array.from(selectedDays) : [dayContextMenu.date];
                targetDays.forEach(d => {
                  if (e.target.value) {
                    newColors[d] = e.target.value;
                  } else {
                    delete newColors[d];
                  }
                });
                setDayColors(newColors);
                saveSettings.mutate({ dayColors: newColors });
                setSelectedDays(new Set());
                setDayContextMenu(null);
              }}
              className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800"
            >
              <option value="">None</option>
              {Object.entries(dayLabels).map(([color, label]) => (
                <option key={color} value={color}>{label}</option>
              ))}
            </select>
          </div>
          <button onClick={() => { 
            const newColors = { ...dayColors }; 
            const targetDays = selectedDays.size > 0 ? Array.from(selectedDays) : [dayContextMenu.date];
            targetDays.forEach(d => delete newColors[d]);
            setDayColors(newColors);

            saveSettings.mutate({ dayColors: newColors });
            setSelectedDays(new Set());
            setDayContextMenu(null); 
          }} className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm">
            Clear Color
          </button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-50 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-1 w-48 animate-in fade-in zoom-in-95 duration-150" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setNoteModal({ note: contextMenu.note, isNew: false }); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit
          </button>
          <div className="relative group/cat">
            <button className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5l4.586 4.586a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-4-4a2 2 0 010-2.828L7 3z" /></svg>Set Category</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute left-full top-0 hidden group-hover/cat:block bg-white dark:bg-slate-900 border rounded-lg shadow-2xl p-1 w-44 z-50">
              {Object.entries(categories).map(([cat, color]) => (
                <button key={cat} onClick={() => { updateNote.mutate({ ...contextMenu.note, category: cat, silent: true }); setContextMenu(null); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-secondary rounded text-xs flex items-center gap-2 ${contextMenu.note.category === cat ? 'font-bold' : ''}`}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color as string }} />
                  {cat === 'default' ? 'No Category' : cat}
                  {contextMenu.note.category === cat && <svg className="w-3 h-3 ml-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setConfirmDialog({ title: 'Delete Note', message: 'Are you sure you want to delete this note?', onConfirm: () => { deleteNote.mutate(contextMenu.note.id); setContextMenu(null); setConfirmDialog(null); } })} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-500 rounded text-sm flex items-center gap-2">
            <TrashIcon className="w-4 h-4" /> Delete
          </button>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <NoteModal
          note={noteModal.note}
          isNew={noteModal.isNew}
          categories={categories}
          allNoteCategories={Array.from(new Set(['default', ...notes.map((n: any) => n.category).filter(Boolean)]))}
          onSave={(title, content, category, existingId) => {
            if (noteModal.isNew && !existingId) {
              addNote.mutate({ title, content, category });
            } else {
              updateNote.mutate({ ...(noteModal.note || {}), id: existingId || noteModal.note?.id, title, content, category });
            }
          }}
          onAutoSave={(title, content, category, existingId) => {
            if (noteModal.isNew && !existingId) {
              addNote.mutateAsync({ title, content, category, silent: true }).then((created) => {
                setNoteModal(prev => prev ? { ...prev, note: created, isNew: false } : prev);
              });
            } else {
              updateNote.mutate({ ...(noteModal.note || {}), id: existingId || noteModal.note?.id, title, content, category, silent: true });
            }
          }}
          onSaveSize={(idx) => saveSettings.mutate({ noteSizeIdx: idx })}
          onClose={() => setNoteModal(null)}
        />
      )}

      {/* Settings Modal */}
      {(isSettingsOpen && settingsDraft) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { setIsSettingsOpen(false); setSettingsDraft(null); }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-slate-500">Diary Settings</h3>
              <button onClick={() => { setIsSettingsOpen(false); setSettingsDraft(null); }}><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-slate-400 block">Note Categories</label>
              {Object.entries(settingsDraft.categories).filter(([k]) => k !== 'default').map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-2">
                  <input
                    defaultValue={cat}
                    onBlur={(e) => {
                      const newVal = e.target.value.trim();
                      if (!newVal || newVal === cat) return;
                      const d = { ...settingsDraft.categories };
                      delete d[cat]; d[newVal] = color;
                      setSettingsDraft(s => s ? { ...s, categories: d } : s);
                    }}
                    className="flex-1 text-xs border rounded px-2 py-1 bg-white dark:bg-slate-800"
                  />
                  <select value={color} onChange={(e) => setSettingsDraft(s => s ? { ...s, categories: { ...s.categories, [cat]: e.target.value } } : s)}
                    className="text-xs px-2 py-1 border rounded" style={{ color }}>
                    <option value="#64748b">Gray</option>
                    <option value="#3b82f6">Blue</option>
                    <option value="#10b981">Green</option>
                    <option value="#f59e0b">Orange</option>
                    <option value="#ef4444">Red</option>
                    <option value="#8b5cf6">Purple</option>
                    <option value="#ec4899">Pink</option>
                    <option value="#06b6d4">Cyan</option>
                  </select>
                  <button onClick={() => { const d = { ...settingsDraft.categories }; delete d[cat]; setSettingsDraft(s => s ? { ...s, categories: d } : s); }} className="text-red-500 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </div>
              ))}
              <Button size="sm" onClick={() => setPromptDialog({ title: 'Add Category', placeholder: 'Category name...', defaultValue: '', onConfirm: (newCat) => { if (!settingsDraft.categories[newCat]) setSettingsDraft(s => s ? { ...s, categories: { ...s.categories, [newCat]: '#3b82f6' } } : s); } })}><PlusIcon className="w-3 h-3 mr-1" /> Add Category</Button>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <label className="text-xs font-bold uppercase text-slate-400 block">Day Box Labels</label>
              {Object.entries(settingsDraft.dayLabels).map(([color, label]) => (
                <div key={color} className="flex items-center gap-2">
                  <input value={label} onChange={(e) => setSettingsDraft(s => s ? { ...s, dayLabels: { ...s.dayLabels, [color]: e.target.value } } : s)}
                    className="flex-1 text-xs border rounded px-2 py-1 bg-white dark:bg-slate-800" />
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
                  <button onClick={() => { const d = { ...settingsDraft.dayLabels }; delete d[color]; setSettingsDraft(s => s ? { ...s, dayLabels: d } : s); }} className="text-red-500 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </div>
              ))}
              <Button size="sm" onClick={() => setPromptDialog({ title: 'Add Label', placeholder: 'Label name...', defaultValue: '', onConfirm: (newLabel) => { const colors = ['#64748b','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4']; const availableColor = colors.find(c => !Object.keys(settingsDraft.dayLabels).includes(c)) || '#64748b'; setSettingsDraft(s => s ? { ...s, dayLabels: { ...s.dayLabels, [availableColor]: newLabel } } : s); } })}><PlusIcon className="w-3 h-3 mr-1" /> Add Label</Button>
            </div>
            <div className="pt-4 border-t flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsSettingsOpen(false); setSettingsDraft(null); }}>Cancel</Button>
              <Button size="sm" onClick={saveSettingsDraft}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {templateModal && (
        <TemplateEditorModal
          template={templateModal === "edit" ? editingTemplate : null}
          onSave={(name, content) => {
            if (templateModal === "new") createTemplateMutation.mutate({ name, content });
            else if (editingTemplate) {
              if (editingTemplate.builtIn && !customTemplates.find((t: any) => t.id === editingTemplate.id)) {
                createTemplateMutation.mutate({ id: editingTemplate.id, name, content });
              } else {
                updateTemplateMutation.mutate({ id: editingTemplate.id, name, content });
              }
            }
            setTemplateModal(null);
          }}
          onClose={() => setTemplateModal(null)}
        />
      )}

      {promptDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPromptDialog(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-slate-500">{promptDialog.title}</h3>
              <button onClick={() => setPromptDialog(null)}><XIcon className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <input autoFocus defaultValue={promptDialog.defaultValue} placeholder={promptDialog.placeholder} id="prompt-dialog-input-cal"
              onKeyDown={(e) => { if (e.key === 'Enter') { const val = (document.getElementById('prompt-dialog-input-cal') as HTMLInputElement).value.trim(); if (val) { promptDialog.onConfirm(val); setPromptDialog(null); } } if (e.key === 'Escape') setPromptDialog(null); }}
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]" />
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPromptDialog(null)}>Cancel</Button>
              <Button size="sm" className="flex-1" onClick={() => { const val = (document.getElementById('prompt-dialog-input-cal') as HTMLInputElement).value.trim(); if (val) { promptDialog.onConfirm(val); setPromptDialog(null); } }}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmDialog}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
