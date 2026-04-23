"use client";


import { apiFetch } from "@/lib/api-fetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { applyAccentColor } from "@/components/settings-panel";
import { isAuthenticated, signOut } from "@/components/login-gate";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StickyEditor } from "@/components/sticky-editor";
import { PlusIcon, TrashIcon, PinIcon, Edit2Icon, XIcon, FileTextIcon, ChevronDownIcon, ChevronUpIcon, CopyIcon, DownloadIcon, SearchIcon, BookmarkIcon, BookOpenIcon, ListTodoIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, LogOutIcon, BellIcon, TrendingUpIcon, CheckSquareIcon } from "lucide-react";
import { BackgroundPicker, BackgroundImage } from "@/components/background-picker";
import ReactMarkdown from "react-markdown";
import { useLoading } from "@/components/loading-provider";
import { showUndoToast } from "@/components/undo-toast";

function NoteContent({ content }: { content: string }) {
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  if (isHtml) return <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: content }} />;
  return <div className="prose dark:prose-invert max-w-none text-sm"><ReactMarkdown>{content}</ReactMarkdown></div>;
}

function NoteModal({ note, categories, onSave, onClose, onAutoSave }: {
  note: any; categories: string[];
  onSave: (title: string, content: string, category: string) => void;
  onClose: () => void;
  onAutoSave?: (title: string, content: string, category: string) => void;
}) {
  const [title, setTitle] = useState(note?.title || "");
  const [category, setCategory] = useState(note?.category || "default");
  const [dirty, setDirty] = useState(false);
  const titleRef = useRef(title);
  const categoryRef = useRef(category);
  titleRef.current = title;
  categoryRef.current = category;
  const handleClose = () => {
    if (dirty && !onAutoSave && !confirm('You have unsaved changes. Discard?')) return;
    onClose();
  };

  const sizes = [{ w: '560px', h: '60vh' }, { w: '768px', h: '75vh' }, { w: '1024px', h: '88vh' }, { w: '100vw', h: '100vh' }];
  const [sizeIdx, setSizeIdx] = useState(() => Math.min(Number(typeof window !== 'undefined' ? localStorage.getItem('noteSizeIdx') || 1 : 1), 3));
  const isFullscreen = sizeIdx === sizes.length - 1;
  const changeSize = (delta: number) => { const next = Math.max(0, Math.min(sizes.length - 1, sizeIdx + delta)); setSizeIdx(next); localStorage.setItem('noteSizeIdx', String(next)); apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noteSizeIdx: next }) }); };
  const mouseDownOnBackdrop = useRef(false);
  const modalPanelRef = useRef<HTMLDivElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => { mouseDownOnBackdrop.current = !modalPanelRef.current?.contains(e.target as Node); }}
      onMouseUp={(e) => { if (mouseDownOnBackdrop.current && !modalPanelRef.current?.contains(e.target as Node)) handleClose(); mouseDownOnBackdrop.current = false; }}>
      <div ref={modalPanelRef}
        className={`bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 transition-all ${isFullscreen ? 'rounded-none' : 'rounded-2xl'}`}
        style={{ width: sizes[sizeIdx].w, height: sizes[sizeIdx].h, maxWidth: '100vw', maxHeight: '100vh' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
          <input value={title} onChange={e => { setTitle(e.target.value); setDirty(true); }} placeholder="Note title..."
            className="flex-1 text-base font-semibold bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400" autoFocus />
          <select value={category} onChange={e => setCategory(e.target.value)} className="text-xs rounded px-2 py-1 bg-slate-100 dark:bg-slate-800 border-0">
            {categories.map(cat => <option key={cat} value={cat}>{cat === 'default' ? 'No Category' : cat}</option>)}
          </select>
          <div className="flex items-center gap-0.5 border rounded-lg overflow-hidden">
            <button onClick={() => changeSize(-1)} disabled={sizeIdx === 0} className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="text-[10px] text-slate-400 px-1 select-none">{sizeIdx + 1}/{sizes.length}</span>
            <button onClick={() => changeSize(1)} disabled={sizeIdx === sizes.length - 1} className="px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <button onClick={handleClose}><XIcon className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex-1 overflow-hidden">
          <StickyEditor
            note={{ content: note?.content || "" }}
            onSave={(html) => onSave(titleRef.current || "Untitled", html, categoryRef.current)}
            onClose={handleClose}
            onAutoSave={onAutoSave ? (html) => { setDirty(false); onAutoSave(titleRef.current || "Untitled", html, categoryRef.current); } : undefined}
            inline
          />
        </div>
      </div>
    </div>
  );
}

const MOM_TEMPLATE = {
  name: "Meeting Minutes",
  builtIn: true,
  content: `## Meeting Title: \n\n**Date & Time:** \n**Facilitator:** \n**Note Taker:** \n\n---\n\n### Attendees\n| Name | Role |\n|------|------|\n|      |      |\n\n---\n\n### Action Items\n| # | Action | Owner | Due Date |\n|---|--------|-------|----------|\n| 1 |        |       |          |`,
};

const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const getLocalToday = () => toDateStr(new Date());

function MiniCalendar({ selected, onChange, noteDates, today }: { selected: string; onChange: (d: string) => void; noteDates: Set<string>; today: string }) {
  const [view, setView] = useState(() => { if (!selected) { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; } const [y, m] = selected.split('-').map(Number); return { year: y, month: m - 1 }; });
  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const monthName = new Date(view.year, view.month).toLocaleString("default", { month: "long", year: "numeric" });
  const prev = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const next = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  useEffect(() => { if (selected) { const [y, m] = selected.split('-').map(Number); setView({ year: y, month: m - 1 }); } }, [selected]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeftIcon className="w-4 h-4" /></button>
        <span className="text-sm font-semibold">{monthName}</span>
        <button onClick={next} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRightIcon className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} className="text-center text-[10px] font-medium text-slate-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dateStr = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          const isSelected = dateStr === selected;
          const isToday = dateStr === today;
          const hasNotes = noteDates.has(dateStr);
          return (
            <button key={i} onClick={() => onChange(dateStr)}
              className={`relative aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center
                ${isSelected ? "bg-primary text-primary-foreground shadow" : isToday ? "bg-primary/10 text-primary font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
              {i + 1}
              {hasNotes && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/60" />}
            </button>
          );
        })}
      </div>
      <button onClick={() => onChange(today)} className="mt-3 w-full text-xs text-center text-primary hover:underline font-medium">Today</button>
    </div>
  );
}

export default function NotesPage() {
  const { setLoading } = useLoading();
  const admin = typeof window !== "undefined" ? isAuthenticated() : false;
  const navHidden = useScrollDirection();
  const [today, setToday] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  useEffect(() => {
    const t = getLocalToday();
    setToday(t);
    setSelectedDate(t);
  }, []);
  const [showAllDates, setShowAllDates] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("default");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(288);
  useEffect(() => {
    const saved = localStorage.getItem('notesSidebarWidth');
    if (saved) setSidebarWidth(Number(saved));
  }, []);
  const dragging = useRef(false);
  const onSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const w = Math.max(220, Math.min(600, ev.clientX));
      setSidebarWidth(w);
      localStorage.setItem('notesSidebarWidth', String(w));
      saveSettings.mutate({ notesSidebarWidth: w });
    };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateModal, setTemplateModal] = useState<"new" | "edit" | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [tplName, setTplName] = useState("");
  const [tplContent, setTplContent] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; note: any } | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const saveSettings = useMutation({ mutationFn: async (data: Record<string, any>) => apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), onSuccess: (_res, data) => { queryClient.setQueryData(['settings'], (old: any) => ({ ...old, ...data })); } });
  const { data: settings = {} } = useQuery({ queryKey: ['settings'], queryFn: async () => (await apiFetch('/api/settings')).json(), staleTime: Infinity });
  const [notesBgImage, setNotesBgImage] = useState('');
  const [notesBgOpacity, setNotesBgOpacity] = useState(0.3);
  const [notesBgBlur, setNotesBgBlur] = useState(0);
  useEffect(() => {
    if (!settings || !Object.keys(settings).length) return;
    if (settings.notesSidebarWidth) setSidebarWidth(settings.notesSidebarWidth);
    if (settings.noteSizeIdx !== undefined) localStorage.setItem('noteSizeIdx', String(settings.noteSizeIdx));
    if (settings.accentColor) applyAccentColor(settings.accentColor);
    if (settings.notesBgImage !== undefined) setNotesBgImage(settings.notesBgImage);
    if (settings.notesBgOpacity !== undefined) setNotesBgOpacity(settings.notesBgOpacity);
    if (settings.notesBgBlur !== undefined) setNotesBgBlur(settings.notesBgBlur);
  }, [settings]);
  const existingBgs = [settings.dashBgImage && { label: 'Dashboard', url: settings.dashBgImage }, settings.tasksBgImage && { label: 'Tasks', url: settings.tasksBgImage }, settings.remindersBgImage && { label: 'Reminders', url: settings.remindersBgImage }].filter(Boolean);
  const { data: notes = [], isLoading: notesLoading } = useQuery({ queryKey: ["notes"], queryFn: async () => (await apiFetch("/api/notes")).json() });
  const { data: activeReminderCount = 0 } = useQuery({ queryKey: ['reminderCount'], queryFn: async () => { const reminders = await (await apiFetch('/api/reminders')).json(); return reminders.filter((r: any) => !r.dismissed).length; }, staleTime: 30000 });
  
  // Hide loading when data is loaded
  useEffect(() => {
    if (!notesLoading && today) {
      setLoading(false);
    }
  }, [notesLoading, today, setLoading]);

  // Auto-open note from URL param ?note=<id>
  const searchParams = useSearchParams();
  useEffect(() => {
    const noteId = searchParams.get('note');
    if (noteId && notes.length > 0 && !editModal) {
      const note = notes.find((n: any) => n.id === noteId);
      if (note) openEditNote(note);
    }
  }, [searchParams, notes]);
  const categoryColors = useMemo<Record<string, string>>(() => {
    const palette = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#64748b'];
    const cats = Array.from(new Set(notes.map((n: any) => n.category).filter((c: any) => c && c !== 'default'))) as string[];
    const map: Record<string, string> = {};
    cats.forEach((c, i) => { map[c] = palette[i % palette.length]; });
    return map;
  }, [notes]);
  const { data: customTemplates = [] } = useQuery({ queryKey: ["note-templates"], queryFn: async () => (await apiFetch("/api/note-templates")).json() });
  const momOverride = customTemplates.find((t: any) => t.id === '__mom__');
  const allTemplates = [momOverride ? { ...MOM_TEMPLATE, ...momOverride } : MOM_TEMPLATE, ...customTemplates.filter((t: any) => t.id !== '__mom__')];

  const CATEGORIES = useMemo(() => Array.from(new Set(["default", ...notes.map((n: any) => n.category).filter(Boolean)])), [notes]);
  const noteDates = useMemo(() => new Set<string>(notes.filter((n: any) => n.date).map((n: any) => n.date as string)), [notes]);

  const filteredNotes = useMemo(() => {
    let list = showAllDates ? notes : notes.filter((n: any) => (n.date || today) === selectedDate);
    if (filterCategory !== "all") list = list.filter((n: any) => n.category === filterCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((n: any) => n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q) || (n.tags || "").toLowerCase().includes(q));
    }
    return [...list].sort((a: any, b: any) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [notes, selectedDate, showAllDates, filterCategory, search]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => (await apiFetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notes"] }); setTitle(""); setContent(""); setTags(""); },
  });
  const updateMutation = useMutation({
    mutationFn: async (data: any) => (await apiFetch("/api/notes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/notes?id=${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, pinned }: any) => (await apiFetch("/api/notes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, pinned: !pinned }) })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => (await apiFetch("/api/note-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["note-templates"] }),
  });
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: any) => (await apiFetch("/api/note-templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["note-templates"] }),
  });
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/note-templates?id=${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["note-templates"] }),
  });

  const applyTemplate = (tpl: any) => { setEditModal({ title: tpl.name || '', content: tpl.content || '' }); setShowTemplates(false); };
  const openEditNote = (note: any) => { setEditModal(note); };
  const saveEditNote = (title: string, content: string, category: string) => {
    if (!editModal) return;
    if (editModal.id) {
      updateMutation.mutate({ ...editModal, title, content, category });
    } else {
      createMutation.mutate({ title, content, category, date: selectedDate });
    }
    setEditModal(null);
  };
  const autoSaveNote = (title: string, content: string, category: string) => {
    if (!editModal?.id) return;
    updateMutation.mutate({ ...editModal, title, content, category, silent: true });
  };
  const deleteNoteWithUndo = (note: any) => {
    deleteMutation.mutate(note.id);
    showUndoToast(`Deleted "${note.title || 'Untitled'}"`, () => {
      createMutation.mutate({ title: note.title, content: note.content, tags: note.tags, category: note.category, date: note.date });
    });
  };
  const duplicateNote = (note: any) => createMutation.mutate({ title: `${note.title} - copy`, content: note.content, tags: note.tags, category: note.category, date: note.date });
  const exportNote = (note: any) => {
    const blob = new Blob([`# ${note.title}\n\n${note.content}`], { type: "text/markdown" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${note.title.replace(/[^a-z0-9]/gi, "_")}.md`; a.click();
  };
  const saveTemplate = () => {
    if (!tplName || !tplContent) return;
    if (templateModal === "new") createTemplateMutation.mutate({ name: tplName, content: tplContent });
    else if (editingTemplate) updateTemplateMutation.mutate({ id: editingTemplate.id, name: tplName, content: tplContent });
    setTemplateModal(null);
  };

  const displayDate = selectedDate === today
    ? "Today"
    : new Date(selectedDate + "T00:00:00").toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative" onClick={() => setContextMenu(null)}>
      <BackgroundImage url={notesBgImage} opacity={notesBgOpacity} blur={notesBgBlur} />
      {/* Nav */}
      <div className={`fixed top-0 left-0 right-0 z-40 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-3 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-transform duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <TrendingUpIcon className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <Link href="/bookmarks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BookmarkIcon className="w-3.5 h-3.5 text-orange-500" /> Bookmarks
        </Link>
        <Link href="/calendar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BookOpenIcon className="w-3.5 h-3.5 text-blue-500" /> Diary
        </Link>
        <Link href="/tasks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <ListTodoIcon className="w-3.5 h-3.5 text-green-500" /> Tasks
        </Link>
        <Link href="/notes" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200">
          <FileTextIcon className="w-3.5 h-3.5" /> Notes
        </Link>
        <Link href="/reminders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BellIcon className="w-3.5 h-3.5" /> Reminders {activeReminderCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeReminderCount}</span>}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <BackgroundPicker bgImage={notesBgImage} bgOpacity={notesBgOpacity} bgBlur={notesBgBlur} existingBackgrounds={existingBgs}
            onChangeBg={url => { setNotesBgImage(url); saveSettings.mutate({ notesBgImage: url }); }}
            onChangeOpacity={v => { setNotesBgOpacity(v); saveSettings.mutate({ notesBgOpacity: v }); }}
            onChangeBlur={v => { setNotesBgBlur(v); saveSettings.mutate({ notesBgBlur: v }); }} />
          <Button size="sm" variant="ghost" onClick={signOut} className="hover:scale-110 transition-all duration-200 text-red-500 hover:text-red-600"><LogOutIcon className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="pt-14 flex h-screen overflow-hidden relative z-10">
        {/* Left sidebar */}
        <div className="shrink-0 border-r bg-white dark:bg-slate-900 flex flex-col overflow-hidden min-h-0" style={{ width: sidebarWidth }}>
          <div className="p-4 space-y-3 shrink-0">
            <MiniCalendar selected={selectedDate} onChange={(d) => { setSelectedDate(d); setShowAllDates(false); }} noteDates={noteDates} today={today} />

            <button onClick={() => setShowAllDates(v => !v)}
              className={`w-full text-xs py-1.5 rounded-lg font-medium transition-colors ${showAllDates ? "bg-primary text-primary-foreground" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
              {showAllDates ? "Showing all notes" : "Show all notes"}
            </button>
          </div>

          <div className="flex-1 overflow-hidden p-4 pt-0 flex flex-col min-h-0">
            <div className="border rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col flex-1 overflow-y-auto min-h-0" style={{ display: admin ? undefined : 'none' }}>
              <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">New Note</span>
                <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors">
                  <FileTextIcon className="w-3 h-3" /> Templates {showTemplates ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                </button>
              </div>

              {showTemplates && (
                <div className="space-y-1 px-3 pb-2 shrink-0">
                  {allTemplates.map((tpl: any) => (
                    <div key={tpl.id} className="flex items-center justify-between bg-white dark:bg-slate-700 border rounded-lg px-2 py-1.5">
                      <span className="text-xs font-medium truncate flex-1">{tpl.name}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => applyTemplate(tpl)} className="text-primary hover:text-primary/80"><PlusIcon className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setTplName(tpl.name); setTplContent(tpl.content); setEditingTemplate(tpl); setTemplateModal("edit"); }} className="text-slate-400 hover:text-slate-600"><Edit2Icon className="w-3.5 h-3.5" /></button>
                        {!tpl.builtIn && (
                          <button onClick={() => deleteTemplateMutation.mutate(tpl.id)} className="text-slate-400 hover:text-red-500"><TrashIcon className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setTplName(""); setTplContent(""); setEditingTemplate(null); setTemplateModal("new"); }} className="w-full text-xs text-primary hover:underline text-left">+ New template</button>
                </div>
              )}

              <div className="px-3 pb-2 shrink-0 space-y-1.5">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm h-8" />
                <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="text-sm h-8" />
                <div className="flex gap-1.5">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                  <Input placeholder="New cat..." value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { const cat = newCategoryInput.trim(); if (cat) { setCategory(cat); setNewCategoryInput(""); } } }}
                    className="flex-1 text-xs h-8" />
                </div>
              </div>

              <div className="flex-1 min-h-[250px] border-t flex flex-col">
                <StickyEditor
                  key={editorKey}
                  note={{ content }}
                  onSave={(html) => { createMutation.mutate({ title, content: html, tags, category, date: selectedDate }); setCategory("default"); setContent(""); setEditorKey(k => k + 1); }}
                  onClose={() => {}}
                  onAutoSave={(html) => setContent(html)}
                  inline
                />
              </div>
            </div>
          </div>
        </div>

        {/* Splitter */}
        <div onMouseDown={onSplitterMouseDown} className="w-1.5 shrink-0 cursor-col-resize bg-slate-200 dark:bg-slate-700 hover:bg-primary/60 transition-colors active:bg-primary" />

        {/* Right: notes list */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <h1 className="text-2xl font-bold">{showAllDates ? "All Notes" : displayDate}</h1>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedNotes.size > 0 && (
                  <>
                    <span className="text-xs text-slate-500">{selectedNotes.size} selected</span>
                    <button onClick={() => { const cats = CATEGORIES; const next = cats[(cats.indexOf(Array.from(selectedNotes).map(id => notes.find((n: any) => n.id === id)?.category).filter(Boolean)[0] || 'default') + 1) % cats.length]; Array.from(selectedNotes).forEach(id => { const n = notes.find((x: any) => x.id === id); if (n) updateMutation.mutate({ ...n, category: next, silent: true }); }); setSelectedNotes(new Set()); }} className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200">Change Category</button>
                    <button onClick={() => { Array.from(selectedNotes).forEach(id => { const n = notes.find((x: any) => x.id === id); if (n) deleteNoteWithUndo(n); }); setSelectedNotes(new Set()); }} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200">Delete ({selectedNotes.size})</button>
                    <button onClick={() => setSelectedNotes(new Set())} className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200">Clear</button>
                  </>
                )}
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-lg">
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-lg outline-none w-36" />
                  {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><XIcon className="w-3 h-3" /></button>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {filteredNotes.map((note: any) => {
                const catColor = categoryColors[note.category];
                return (
                <div key={note.id}
                  className={`rounded-lg shadow-md border-l-4 overflow-hidden hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer ${selectedNotes.has(note.id) ? 'ring-2 ring-primary' : ''}`}
                  style={{ backgroundColor: catColor ? `${catColor}18` : '#fef9c3', borderLeftColor: catColor || '#f59e0b', transform: 'rotate(-0.1deg)' }}
                  onClick={(e) => { if (!admin) return; if (e.ctrlKey || e.metaKey) { setSelectedNotes(prev => { const next = new Set(prev); if (next.has(note.id)) next.delete(note.id); else next.add(note.id); return next; }); } else { openEditNote(note); } }}
                  onContextMenu={(e) => { e.preventDefault(); if (!admin) return; setContextMenu({ x: e.clientX, y: e.clientY, note }); }}>
                  <div className="p-2.5">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{note.title}</span>
                        {note.category && note.category !== "default" && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: catColor || '#64748b' }}>{note.category}</span>
                        )}
                        {showAllDates && note.date && (
                          <span className="ml-2 text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">{note.date}</span>
                        )}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {note.pinned && <PinIcon className="w-3.5 h-3.5 text-primary fill-current" />}
                        <button onClick={(e) => { e.stopPropagation(); openEditNote(note); }} className="p-0.5 hover:opacity-80" title="Edit"><svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={(e) => { e.stopPropagation(); togglePinMutation.mutate({ id: note.id, pinned: note.pinned }); }} className="p-0.5 hover:opacity-80" style={{ display: admin ? undefined : 'none' }} title="Pin"><PinIcon className={`w-3.5 h-3.5 ${note.pinned ? "text-primary fill-current" : "text-slate-400"}`} /></button>
                        <button onClick={(e) => { e.stopPropagation(); duplicateNote(note); }} className="p-0.5 hover:opacity-80" style={{ display: admin ? undefined : 'none' }} title="Duplicate"><CopyIcon className="w-3.5 h-3.5 text-slate-400" /></button>
                        <button onClick={(e) => { e.stopPropagation(); exportNote(note); }} className="p-0.5 hover:opacity-80" title="Export"><DownloadIcon className="w-3.5 h-3.5 text-slate-400" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(note); }} className="p-0.5 hover:opacity-80" style={{ display: admin ? undefined : 'none' }} title="Delete"><TrashIcon className="w-3.5 h-3.5 text-red-500" /></button>
                      </div>
                    </div>
                    <div className="prose prose-xs dark:prose-invert max-w-none text-xs note-preview" dangerouslySetInnerHTML={{ __html: note.content || '' }} />
                    {note.tags && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {note.tags.split(",").map((tag: string) => (
                          <span key={tag} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
              {filteredNotes.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <FileTextIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No notes for {showAllDates ? "any date" : displayDate}</p>
                  <p className="text-sm mt-1">Add one using the panel on the left</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editModal && (
        <NoteModal
          note={editModal}
          categories={CATEGORIES}
          onSave={saveEditNote}
          onClose={() => setEditModal(null)}
          onAutoSave={autoSaveNote}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">Delete note?</h2>
            <p className="text-sm text-slate-500 mb-5">&quot;<span className="font-medium text-slate-700 dark:text-slate-300">{confirmDelete.title || "Untitled"}</span>&quot; will be permanently deleted.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={() => { deleteNoteWithUndo(confirmDelete); setConfirmDelete(null); }} className="px-4 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {templateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setTemplateModal(null); }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" style={{ maxHeight: '85vh' }}
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-6 py-4 border-b">
              <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="Template name..."
                className="flex-1 text-base font-semibold bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400" autoFocus />
              <button onClick={() => setTemplateModal(null)}><XIcon className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="flex-1 overflow-hidden">
              <StickyEditor
                note={{ content: tplContent }}
                onSave={(html) => {
                  if (tplName) {
                    if (templateModal === 'new') {
                      createTemplateMutation.mutate({ name: tplName, content: html });
                    } else if (editingTemplate) {
                      if (editingTemplate.builtIn && !customTemplates.find((t: any) => t.id === editingTemplate.id)) {
                        createTemplateMutation.mutate({ id: editingTemplate.id, name: tplName, content: html });
                      } else {
                        updateTemplateMutation.mutate({ id: editingTemplate.id, name: tplName, content: html });
                      }
                    }
                  }
                  setTemplateModal(null);
                }}
                onClose={() => setTemplateModal(null)}
                onAutoSave={(html) => setTplContent(html)}
                inline
              />
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div className="fixed z-50 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-1 w-48 animate-in fade-in zoom-in-95 duration-150" 
             style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 200) }} 
             onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Note Options</span>
            <button onClick={() => setContextMenu(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <XIcon className="w-3 h-3 text-slate-400" />
            </button>
          </div>
          <button onClick={() => { openEditNote(contextMenu.note); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center gap-2">
            <Edit2Icon className="w-4 h-4 text-blue-500" /> Edit
          </button>
          <button onClick={() => { togglePinMutation.mutate({ id: contextMenu.note.id, pinned: contextMenu.note.pinned }); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center gap-2">
            <PinIcon className="w-4 h-4 text-primary" /> {contextMenu.note.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button onClick={() => { duplicateNote(contextMenu.note); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center gap-2">
            <CopyIcon className="w-4 h-4 text-green-500" /> Duplicate
          </button>
          <button onClick={() => { exportNote(contextMenu.note); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center gap-2">
            <DownloadIcon className="w-4 h-4 text-orange-500" /> Export
          </button>
          <button onClick={() => { setConfirmDelete(contextMenu.note); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center gap-2">
            <TrashIcon className="w-4 h-4 text-red-500" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
