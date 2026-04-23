"use client";

import { apiFetch } from "@/lib/api-fetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import TiptapLink from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import {
  PlusIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon, FileTextIcon,
  BookOpenIcon, XIcon, Edit2Icon, FilePlusIcon, BoldIcon, ItalicIcon,
  ListIcon, ListOrderedIcon, Heading1Icon, Heading2Icon, Heading3Icon,
  HighlighterIcon, StrikethroughIcon, QuoteIcon, CodeIcon, MinusIcon,
  Undo2Icon, Redo2Icon, TableIcon, PilcrowIcon, BookmarkIcon,
  CalendarDaysIcon, BellIcon, MenuIcon, LogOutIcon, ListTodoIcon,
  SearchIcon, ImageIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon,
  CheckSquareIcon, UnderlineIcon, LinkIcon, TrendingUpIcon,
  SuperscriptIcon, SubscriptIcon, IndentIcon, OutdentIcon, EraserIcon,
  PaintBucketIcon
} from "lucide-react";
import { useStore } from "@/lib/store";
import { signOut } from "@/components/login-gate";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { applyAccentColor } from "@/components/settings-panel";

// Types
interface Notebook { id: string; userId: string; name: string; color: string; position: number; createdAt: string; updatedAt: string; }
interface Section { id: string; userId: string; notebookId: string; name: string; position: number; createdAt: string; updatedAt: string; }
interface Page { id: string; userId: string; sectionId: string; notebookId: string; parentId: string; title: string; content: string; icon: string; position: number; depth: number; createdAt: string; updatedAt: string; }

const NOTEBOOK_COLORS = ["#3b82f6","#8b5cf6","#ec4899","#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#64748b"];
const FONT_SIZES = ['10px','12px','14px','16px','18px','20px','24px','28px','32px'];
const COLORS = ["#000000","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#64748b","#ffffff"];

export default function NotebooksPage() {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useStore();
  const pathname = usePathname();
  const navHidden = useScrollDirection();

  // Load settings (accent color etc.) so theme works on direct navigation
  const { data: settings = {} } = useQuery({ queryKey: ['settings'], queryFn: async () => (await apiFetch('/api/settings')).json(), staleTime: Infinity });
  useEffect(() => {
    if (settings?.accentColor) applyAccentColor(settings.accentColor);
  }, [settings]);

  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [editingName, setEditingName] = useState<{ type: string; id: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; id: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Fetch all data
  const { data, isLoading } = useQuery({
    queryKey: ["notebooks"],
    queryFn: async () => {
      const res = await apiFetch("/api/notebooks");
      return res.json() as Promise<{ notebooks: Notebook[]; sections: Section[]; pages: Page[] }>;
    },
  });

  const notebooks = data?.notebooks || [];
  const sections = data?.sections || [];
  const pages = data?.pages || [];

  // Auto-select first notebook/section/page
  useEffect(() => {
    if (!activeNotebookId && notebooks.length > 0) setActiveNotebookId(notebooks[0].id);
  }, [notebooks, activeNotebookId]);

  useEffect(() => {
    if (activeNotebookId && !activeSectionId) {
      const s = sections.find(s => s.notebookId === activeNotebookId);
      if (s) setActiveSectionId(s.id);
    }
  }, [activeNotebookId, sections, activeSectionId]);

  useEffect(() => {
    if (activeSectionId && !activePageId) {
      const p = pages.find(p => p.sectionId === activeSectionId && !p.parentId);
      if (p) setActivePageId(p.id);
    }
  }, [activeSectionId, pages, activePageId]);

  // Mutations
  const mutation = useMutation({
    mutationFn: async (args: { method: string; body?: any; params?: string }) => {
      const url = "/api/notebooks" + (args.params || "");
      const res = await apiFetch(url, {
        method: args.method,
        ...(args.body ? { body: JSON.stringify(args.body) } : {}),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notebooks"] }),
  });

  // CRUD helpers
  const addNotebook = () => {
    const id = Date.now().toString();
    mutation.mutate({ method: "POST", body: { type: "notebook", id, name: "New Notebook", color: NOTEBOOK_COLORS[notebooks.length % NOTEBOOK_COLORS.length], position: notebooks.length } });
    setActiveNotebookId(id);
    setActiveSectionId(null);
    setActivePageId(null);
    setTimeout(() => { setEditingName({ type: "notebook", id }); setEditValue("New Notebook"); }, 200);
  };

  const addSection = () => {
    if (!activeNotebookId) return;
    const nbSections = sections.filter(s => s.notebookId === activeNotebookId);
    const id = Date.now().toString();
    mutation.mutate({ method: "POST", body: { type: "section", id, notebookId: activeNotebookId, name: "New Section", position: nbSections.length } });
    setActiveSectionId(id);
    setActivePageId(null);
    setTimeout(() => { setEditingName({ type: "section", id }); setEditValue("New Section"); }, 200);
  };

  const addPage = (parentId?: string) => {
    if (!activeSectionId || !activeNotebookId) return;
    const id = Date.now().toString();
    const depth = parentId ? (pages.find(p => p.id === parentId)?.depth ?? 0) + 1 : 0;
    const siblings = pages.filter(p => p.sectionId === activeSectionId && (parentId ? p.parentId === parentId : !p.parentId));
    mutation.mutate({ method: "POST", body: { type: "page", id, sectionId: activeSectionId, notebookId: activeNotebookId, parentId: parentId || "", title: "Untitled Page", depth, position: siblings.length } });
    setActivePageId(id);
    if (parentId) setExpandedPages(prev => new Set([...prev, parentId]));
    setTimeout(() => { setEditingName({ type: "page", id }); setEditValue("Untitled Page"); }, 200);
  };

  const deleteItem = (type: string, id: string) => {
    const item = type === "notebook" ? notebooks.find(n => n.id === id) : type === "section" ? sections.find(s => s.id === id) : pages.find(p => p.id === id);
    const name = type === "page" ? (item as any)?.title || "Untitled" : (item as any)?.name || "Untitled";
    // Skip confirm for empty untitled pages
    if (type === "page") {
      const pg = item as Page | undefined;
      const isUntitled = !pg?.title || pg.title === "Untitled Page";
      const isEmpty = !pg?.content || pg.content === "" || pg.content === "<p></p>";
      if (isUntitled && isEmpty) { doDelete(type, id); return; }
    }
    setConfirmDelete({ type, id, name });
  };

  const doDelete = (type: string, id: string) => {
    mutation.mutate({ method: "DELETE", params: `?type=${type}&id=${id}` });
    if (type === "notebook" && id === activeNotebookId) { setActiveNotebookId(null); setActiveSectionId(null); setActivePageId(null); }
    if (type === "section" && id === activeSectionId) { setActiveSectionId(null); setActivePageId(null); }
    if (type === "page" && id === activePageId) setActivePageId(null);
    setConfirmDelete(null);
  };

  const renameItem = (type: string, id: string, name: string) => {
    const field = type === "page" ? "title" : "name";
    mutation.mutate({ method: "PUT", body: { type, id, [field]: name } });
    setEditingName(null);
  };

  const savePage = useCallback((content: string) => {
    if (!activePageId) return;
    mutation.mutate({ method: "PUT", body: { type: "page", id: activePageId, content } });
  }, [activePageId, mutation]);

  // Current data
  const activeNotebook = notebooks.find(n => n.id === activeNotebookId);
  const activeSections = sections.filter(s => s.notebookId === activeNotebookId);
  const activePages = pages.filter(p => p.sectionId === activeSectionId);
  const activePage = pages.find(p => p.id === activePageId);

  // Build page tree
  const rootPages = activePages.filter(p => !p.parentId).sort((a, b) => a.position - b.position);
  const getChildren = (parentId: string) => activePages.filter(p => p.parentId === parentId).sort((a, b) => a.position - b.position);

  // Search filter
  const filteredPages = searchQuery
    ? activePages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  // Close context menu on click
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // Focus edit input
  useEffect(() => { if (editingName && editInputRef.current) editInputRef.current.focus(); }, [editingName]);

  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top nav bar — consistent with other modules */}
      <div className={`fixed top-0 left-0 right-0 z-40 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-3 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-transform duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <TrendingUpIcon className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <Link href="/bookmarks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BookmarkIcon className="w-3.5 h-3.5 text-orange-500" /> Bookmarks
        </Link>
        <Link href="/calendar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <CalendarDaysIcon className="w-3.5 h-3.5 text-blue-500" /> Diary
        </Link>
        <Link href="/tasks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <ListTodoIcon className="w-3.5 h-3.5 text-green-500" /> Tasks
        </Link>
        <Link href="/notes" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <FileTextIcon className="w-3.5 h-3.5 text-purple-500" /> Notes
        </Link>
        <Link href="/notebooks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200">
          <BookOpenIcon className="w-3.5 h-3.5" /> Notebooks
        </Link>
        <Link href="/reminders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BellIcon className="w-3.5 h-3.5" /> Reminders
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={signOut} className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-secondary transition-all duration-200" title="Sign out">
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-14 flex h-screen overflow-hidden">

        {/* Notebook tabs (vertical) */}
        <div className="w-48 bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Notebooks</span>
            <button onClick={addNotebook} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="New Notebook">
              <PlusIcon className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {notebooks.map(nb => (
              <div key={nb.id}
                className={cn("flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group text-sm", nb.id === activeNotebookId ? "bg-white dark:bg-slate-700 shadow-sm" : "hover:bg-slate-200/60 dark:hover:bg-slate-700/40")}
                onClick={() => { setActiveNotebookId(nb.id); setActiveSectionId(null); setActivePageId(null); }}
                onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: "notebook", id: nb.id }); }}>
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: nb.color }} />
                {editingName?.type === "notebook" && editingName.id === nb.id ? (
                  <input ref={editInputRef} value={editValue} onChange={e => setEditValue(e.target.value)}
                    onBlur={() => renameItem("notebook", nb.id, editValue)}
                    onKeyDown={e => { if (e.key === "Enter") renameItem("notebook", nb.id, editValue); if (e.key === "Escape") setEditingName(null); }}
                    className="flex-1 bg-transparent border-b border-blue-400 outline-none text-sm px-0" />
                ) : (
                  <span className="flex-1 truncate">{nb.name}</span>
                )}
                <button onClick={e => { e.stopPropagation(); deleteItem("notebook", nb.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
                  <TrashIcon className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
            {notebooks.length === 0 && <p className="text-xs text-slate-400 px-3 py-4 text-center">No notebooks yet</p>}
          </div>
        </div>

        {/* Sections + Pages sidebar */}
        {activeNotebookId && (
          <div className={cn("bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0 transition-all", sidebarCollapsed ? "w-0 overflow-hidden" : "w-64")}>
            {/* Sections tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-thin">
                {activeSections.map(sec => (
                  <button key={sec.id}
                    className={cn("px-3 py-1.5 text-xs rounded-t-lg whitespace-nowrap transition-colors shrink-0", sec.id === activeSectionId ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")}
                    onClick={() => { setActiveSectionId(sec.id); setActivePageId(null); }}
                    onDoubleClick={() => { setEditingName({ type: "section", id: sec.id }); setEditValue(sec.name); }}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: "section", id: sec.id }); }}>
                    {editingName?.type === "section" && editingName.id === sec.id ? (
                      <input ref={editInputRef} value={editValue} onChange={e => setEditValue(e.target.value)}
                        onBlur={() => renameItem("section", sec.id, editValue)}
                        onKeyDown={e => { if (e.key === "Enter") renameItem("section", sec.id, editValue); if (e.key === "Escape") setEditingName(null); }}
                        className="bg-transparent border-b border-blue-400 outline-none text-xs w-20" onClick={e => e.stopPropagation()} />
                    ) : sec.name}
                  </button>
                ))}
                <button onClick={addSection} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0" title="New Section">
                  <PlusIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800">
                <SearchIcon className="w-3.5 h-3.5 text-slate-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search pages..." className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" />
                {searchQuery && <button onClick={() => setSearchQuery("")}><XIcon className="w-3 h-3 text-slate-400" /></button>}
              </div>
            </div>

            {/* Page tree */}
            <div className="flex-1 overflow-y-auto py-1">
              {activeSectionId && (
                <>
                  {(filteredPages || rootPages).map(page => (
                    <PageTreeItem key={page.id} page={page} pages={activePages} activePageId={activePageId}
                      expandedPages={expandedPages} depth={0}
                      onSelect={id => setActivePageId(id)}
                      onToggle={id => setExpandedPages(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                      onAddSubpage={id => addPage(id)}
                      onDelete={id => deleteItem("page", id)}
                      onRename={(id, title) => { setEditingName({ type: "page", id }); setEditValue(title); }}
                      editingName={editingName} editValue={editValue} setEditValue={setEditValue}
                      onRenameSubmit={(id, val) => renameItem("page", id, val)}
                      onRenameCancel={() => setEditingName(null)}
                      editInputRef={editInputRef}
                      getChildren={getChildren}
                      isSearch={!!filteredPages} />
                  ))}
                  <button onClick={() => addPage()} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 w-full transition-colors mt-1">
                    <PlusIcon className="w-3.5 h-3.5" /> Add Page
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activePage ? (
            <PageEditor key={activePage.id} page={activePage} onSave={savePage} onSaveTitle={(title) => { mutation.mutate({ method: "PUT", body: { type: "page", id: activePage.id, title } }); }}
              notebookName={activeNotebook?.name || ""} sectionName={activeSections.find(s => s.id === activeSectionId)?.name || ""}
              sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950">
              <div className="text-center text-slate-400">
                <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Select or create a page to start writing</p>
                <p className="text-sm mt-1">Use the sidebar to navigate your notebooks</p>
              </div>
            </div>
          )}
        </div>

        {/* Context menu backdrop */}
        {contextMenu && (
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setContextMenu(null)} />
        )}
        {/* Context menu */}
        {contextMenu && (
          <div className="fixed z-50 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-1 w-48 animate-in fade-in zoom-in-95 duration-150"
            style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{contextMenu.type} Options</span>
              <button onClick={() => setContextMenu(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <XIcon className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <button className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center gap-2"
              onClick={() => { setEditingName({ type: contextMenu.type, id: contextMenu.id }); const item = contextMenu.type === "notebook" ? notebooks.find(n => n.id === contextMenu.id) : contextMenu.type === "section" ? sections.find(s => s.id === contextMenu.id) : pages.find(p => p.id === contextMenu.id); setEditValue(contextMenu.type === "page" ? (item as any)?.title || "" : (item as any)?.name || ""); setContextMenu(null); }}>
              <Edit2Icon className="w-4 h-4 text-blue-500" /> Rename
            </button>
            {contextMenu.type === "page" && (
              <button className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center gap-2"
                onClick={() => { addPage(contextMenu.id); setContextMenu(null); }}>
                <FilePlusIcon className="w-4 h-4 text-green-500" /> Add Subpage
              </button>
            )}
            <button className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-sm flex items-center gap-2"
              onClick={() => { deleteItem(contextMenu.type, contextMenu.id); setContextMenu(null); }}>
              <TrashIcon className="w-4 h-4 text-red-500" /> Delete
            </button>
          </div>
        )}

        {/* Confirm delete modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">Delete {confirmDelete.type}?</h2>
              <p className="text-sm text-slate-500 mb-5">&quot;<span className="font-medium text-slate-700 dark:text-slate-300">{confirmDelete.name}</span>&quot; will be permanently deleted{confirmDelete.type === "notebook" ? " along with all its sections and pages" : confirmDelete.type === "section" ? " along with all its pages" : ""}.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={() => doDelete(confirmDelete.type, confirmDelete.id)} className="px-4 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Recursive page tree item
function PageTreeItem({ page, pages, activePageId, expandedPages, depth, onSelect, onToggle, onAddSubpage, onDelete, onRename, editingName, editValue, setEditValue, onRenameSubmit, onRenameCancel, editInputRef, getChildren, isSearch }: {
  page: Page; pages: Page[]; activePageId: string | null; expandedPages: Set<string>; depth: number;
  onSelect: (id: string) => void; onToggle: (id: string) => void; onAddSubpage: (id: string) => void;
  onDelete: (id: string) => void; onRename: (id: string, title: string) => void;
  editingName: { type: string; id: string } | null; editValue: string; setEditValue: (v: string) => void;
  onRenameSubmit: (id: string, val: string) => void; onRenameCancel: () => void;
  editInputRef: React.RefObject<HTMLInputElement>; getChildren: (id: string) => Page[]; isSearch: boolean;
}) {
  const children = getChildren(page.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedPages.has(page.id);
  const isActive = page.id === activePageId;
  const isEditing = editingName?.type === "page" && editingName.id === page.id;

  return (
    <div>
      <div className={cn("flex items-center gap-1 px-2 py-1 cursor-pointer group transition-colors text-sm", isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400")}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(page.id)}>
        <button onClick={e => { e.stopPropagation(); onToggle(page.id); }} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0" style={{ visibility: hasChildren ? "visible" : "hidden" }}>
          {isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
        </button>
        <FileTextIcon className="w-3.5 h-3.5 shrink-0 opacity-50" />
        {isEditing ? (
          <input ref={editInputRef} value={editValue} onChange={e => setEditValue(e.target.value)}
            onBlur={() => onRenameSubmit(page.id, editValue)}
            onKeyDown={e => { if (e.key === "Enter") onRenameSubmit(page.id, editValue); if (e.key === "Escape") onRenameCancel(); }}
            className="flex-1 bg-transparent border-b border-blue-400 outline-none text-xs px-0" onClick={e => e.stopPropagation()} />
        ) : (
          <span className="flex-1 truncate text-xs">{page.title}</span>
        )}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
          <button onClick={e => { e.stopPropagation(); onAddSubpage(page.id); }} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Add subpage">
            <PlusIcon className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(page.id); }} className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30" title="Delete">
            <TrashIcon className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>
      {hasChildren && (isExpanded || isSearch) && children.map(child => (
        <PageTreeItem key={child.id} page={child} pages={pages} activePageId={activePageId}
          expandedPages={expandedPages} depth={depth + 1}
          onSelect={onSelect} onToggle={onToggle} onAddSubpage={onAddSubpage} onDelete={onDelete}
          onRename={onRename} editingName={editingName} editValue={editValue} setEditValue={setEditValue}
          onRenameSubmit={onRenameSubmit} onRenameCancel={onRenameCancel} editInputRef={editInputRef}
          getChildren={getChildren} isSearch={isSearch} />
      ))}
    </div>
  );
}



// Rich text page editor — OneNote style
function PageEditor({ page, onSave, onSaveTitle, notebookName, sectionName, sidebarCollapsed, onToggleSidebar }: {
  page: Page; onSave: (content: string) => void; onSaveTitle: (title: string) => void;
  notebookName: string; sectionName: string; sidebarCollapsed: boolean; onToggleSidebar: () => void;
}) {
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColors, setShowColors] = useState(false);
  const [showHighlightColors, setShowHighlightColors] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [pageTitle, setPageTitle] = useState(page.title);
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'view'>('home');
  const [promptDialog, setPromptDialog] = useState<{ title: string; placeholder: string; onConfirm: (val: string) => void } | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const promptInputRef = useRef<HTMLInputElement>(null);

  const HL_COLORS = ["#fef08a","#bbf7d0","#bfdbfe","#fbcfe8","#fed7aa","#e9d5ff","#fecaca","#d1d5db"];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Highlight.configure({ multicolor: true }),
      TextStyle, Color, FontSize,
      Underline,
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'notebook-link' } }),
      Superscript,
      Subscript,
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      Image.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start typing here...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: page.content || "",
    immediatelyRender: false,
    editable: true,
    editorProps: {
      attributes: { class: "notebook-editor outline-none max-w-none min-h-[600px]" },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (e) => { editor?.chain().focus().setImage({ src: e.target?.result as string }).run(); };
              reader.readAsDataURL(file);
            }
          });
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => { editor?.chain().focus().setImage({ src: e.target?.result as string }).run(); };
                reader.readAsDataURL(file);
              }
              return true;
            }
          }
        }
        // Preserve rich HTML from Word/websites
        const html = event.clipboardData?.getData('text/html');
        if (html && editor) {
          event.preventDefault();
          // Clean Word-specific markup but keep formatting
          const cleaned = html
            .replace(/<meta[^>]*>/gi, '')
            .replace(/<\/?o:[^>]*>/gi, '')
            .replace(/<\/?v:[^>]*>/gi, '')
            .replace(/<\/?xml[^>]*>/gi, '')
            .replace(/class="Mso[^"]*"/gi, '')
            .replace(/style="mso-[^"]*"/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<\/?span[^>]*>/gi, (match) => {
              // Keep spans that have useful inline styles (color, background, font-size, font-weight)
              const styleMatch = match.match(/style="([^"]*)"/i);
              if (!styleMatch) return match.startsWith('</') ? '</span>' : '<span>';
              const style = styleMatch[1]
                .split(';')
                .map(s => s.trim())
                .filter(s => /^(color|background|font-size|font-weight|font-style|text-decoration)\s*:/i.test(s))
                .join('; ');
              return style ? `<span style="${style}">` : '<span>';
            });
          editor.chain().focus().insertContent(cleaned).run();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (!editor.isActive('table')) setShowTableMenu(false);
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      setSaveStatus('saving');
      autoSaveTimer.current = setTimeout(() => {
        onSave(editor.getHTML());
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1200);
    },
  });

  useEffect(() => { if (editor && !editor.isFocused) setTimeout(() => editor.commands.focus('start'), 50); }, [editor]);
  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); if (titleTimer.current) clearTimeout(titleTimer.current); }, []);

  // Ctrl+K for insert link (OneNote shortcut)
  useEffect(() => {
    if (!editor) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); }
        else { setPromptValue(""); setPromptDialog({ title: 'Insert Link', placeholder: 'Enter URL...', onConfirm: (url) => { if (url) editor.chain().focus().setLink({ href: url }).run(); } }); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editor]);

  const handleTitleChange = (val: string) => {
    setPageTitle(val);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => onSaveTitle(val || "Untitled Page"), 800);
  };
  const insertImage = () => fileInputRef.current?.click();
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => { editor?.chain().focus().setImage({ src: ev.target?.result as string }).run(); };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  if (!editor) return null;

  const btn = (active: boolean) => `p-1.5 rounded transition-colors hover:bg-slate-200/80 dark:hover:bg-slate-600/60 ${active ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`;
  const sep = <div className="w-px h-5 bg-slate-300/50 dark:bg-slate-600/50 mx-1" />;
  const createdDate = new Date(page.createdAt);
  const dateStr = createdDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950" onClick={() => { setShowColors(false); setShowHighlightColors(false); setShowTableMenu(false); }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      {/* Ribbon */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80">
        <div className="flex items-center px-2 pt-1">
          <button onClick={onToggleSidebar} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 mr-2" title="Toggle sidebar"><MenuIcon className="w-4 h-4 text-slate-500" /></button>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mr-4"><span>{notebookName}</span><ChevronRightIcon className="w-3 h-3" /><span>{sectionName}</span></div>
          <div className="flex items-center gap-0.5">
            {(['home', 'insert', 'view'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-3 py-1 text-xs font-medium rounded-t transition-colors capitalize", activeTab === tab ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-b-0 border-slate-200 dark:border-slate-700 -mb-px" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>{tab}</button>
            ))}
          </div>
          <div className="flex-1" />
          {saveStatus === 'saving' && <span className="text-[10px] text-amber-500 animate-pulse flex items-center gap-1 pr-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Saving</span>}
          {saveStatus === 'saved' && <span className="text-[10px] text-green-500 flex items-center gap-1 pr-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Saved</span>}
        </div>
        <div className="flex items-center gap-0.5 px-3 py-1.5 min-h-[36px] flex-wrap">
          {activeTab === 'home' && (<>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().undo().run(); }} className={btn(false)} title="Undo"><Undo2Icon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().redo().run(); }} className={btn(false)} title="Redo"><Redo2Icon className="w-3.5 h-3.5" /></button>
            {sep}
            <select onMouseDown={e => e.stopPropagation()} onChange={e => { const v = e.target.value; if (v) (editor.chain().focus() as any).setFontSize(v).run(); else (editor.chain().focus() as any).unsetFontSize().run(); }} value={editor.getAttributes('textStyle').fontSize || ''} className="text-[11px] h-7 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1 cursor-pointer" title="Font size">
              <option value="">Size</option>
              {FONT_SIZES.map(s => <option key={s} value={s}>{s.replace('px','')}</option>)}
            </select>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }} className={btn(editor.isActive('bold'))} title="Bold"><BoldIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }} className={btn(editor.isActive('italic'))} title="Italic"><ItalicIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }} className={btn(editor.isActive('underline'))} title="Underline"><UnderlineIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }} className={btn(editor.isActive('strike'))} title="Strikethrough"><StrikethroughIcon className="w-3.5 h-3.5" /></button>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button onMouseDown={e => { e.preventDefault(); setShowColors(v => !v); setShowHighlightColors(false); }} className={btn(false)} title="Font color" style={{ borderBottom: `3px solid ${editor.getAttributes('textStyle').color || '#000'}` }}><span className="text-[11px] font-bold leading-none">A</span></button>
              {showColors && (<div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border rounded-lg p-2 shadow-xl flex flex-wrap gap-1 w-[140px]">
                {COLORS.map(c => (<button key={c} onMouseDown={e => { e.preventDefault(); editor.chain().focus().setColor(c).run(); setShowColors(false); }} className="w-5 h-5 rounded border border-slate-200 dark:border-slate-600 hover:scale-125 transition-transform" style={{ backgroundColor: c }} />))}
                <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColors(false); }} className="w-5 h-5 rounded border border-slate-300 text-[7px] flex items-center justify-center hover:scale-125 transition-transform">✕</button>
              </div>)}
            </div>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button onMouseDown={e => { e.preventDefault(); setShowHighlightColors(v => !v); setShowColors(false); }} className={btn(editor.isActive('highlight'))} title="Highlight"><HighlighterIcon className="w-3.5 h-3.5" /></button>
              {showHighlightColors && (<div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border rounded-lg p-2 shadow-xl flex flex-wrap gap-1 w-[120px]">
                {HL_COLORS.map(c => (<button key={c} onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightColors(false); }} className="w-5 h-5 rounded border border-slate-200 dark:border-slate-600 hover:scale-125 transition-transform" style={{ backgroundColor: c }} />))}
                <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setShowHighlightColors(false); }} className="w-5 h-5 rounded border border-slate-300 text-[7px] flex items-center justify-center hover:scale-125 transition-transform">✕</button>
              </div>)}
            </div>
            {sep}
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }} className={btn(editor.isActive('heading', { level: 1 }))} title="Heading 1"><Heading1Icon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }} className={btn(editor.isActive('heading', { level: 2 }))} title="Heading 2"><Heading2Icon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }} className={btn(editor.isActive('heading', { level: 3 }))} title="Heading 3"><Heading3Icon className="w-3.5 h-3.5" /></button>
            {sep}
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); }} className={btn(editor.isActive({ textAlign: 'left' }))} title="Align left"><AlignLeftIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); }} className={btn(editor.isActive({ textAlign: 'center' }))} title="Align center"><AlignCenterIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); }} className={btn(editor.isActive({ textAlign: 'right' }))} title="Align right"><AlignRightIcon className="w-3.5 h-3.5" /></button>
            {sep}
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }} className={btn(editor.isActive('bulletList'))} title="Bullet list"><ListIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }} className={btn(editor.isActive('orderedList'))} title="Numbered list"><ListOrderedIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleTaskList().run(); }} className={btn(editor.isActive('taskList'))} title="To-do list"><CheckSquareIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }} className={btn(editor.isActive('blockquote'))} title="Quote"><QuoteIcon className="w-3.5 h-3.5" /></button>
            {sep}
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleSuperscript().run(); }} className={btn(editor.isActive('superscript'))} title="Superscript"><SuperscriptIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleSubscript().run(); }} className={btn(editor.isActive('subscript'))} title="Subscript"><SubscriptIcon className="w-3.5 h-3.5" /></button>
            {sep}
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().sinkListItem('listItem').run(); }} className={btn(false)} title="Increase indent (Tab)"><IndentIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().liftListItem('listItem').run(); }} className={btn(false)} title="Decrease indent (Shift+Tab)"><OutdentIcon className="w-3.5 h-3.5" /></button>
            {sep}
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().clearNodes().unsetAllMarks().run(); }} className={btn(false)} title="Clear formatting"><EraserIcon className="w-3.5 h-3.5" /></button>
          </>)}
          {activeTab === 'insert' && (<>
            <button onMouseDown={e => { e.preventDefault(); insertImage(); }} className={btn(false)} title="Insert image"><ImageIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); setPromptValue(""); setPromptDialog({ title: 'Image URL', placeholder: 'Enter image URL...', onConfirm: (url) => { if (url) editor.chain().focus().setImage({ src: url }).run(); } }); }} className={btn(false)} title="Image from URL"><span className="text-[10px] font-medium">URL</span></button>
            {sep}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button onMouseDown={e => { e.preventDefault(); if (editor.isActive('table')) setShowTableMenu(v => !v); else editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }} className={btn(editor.isActive('table'))} title="Table"><TableIcon className="w-3.5 h-3.5" /></button>
              {showTableMenu && (<div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border rounded-lg shadow-xl p-1 flex flex-col gap-0.5 text-[11px] min-w-[130px]">
                {([['Add col before', () => editor.chain().focus().addColumnBefore().run()], ['Add col after', () => editor.chain().focus().addColumnAfter().run()], ['Delete col', () => editor.chain().focus().deleteColumn().run()], ['Add row before', () => editor.chain().focus().addRowBefore().run()], ['Add row after', () => editor.chain().focus().addRowAfter().run()], ['Delete row', () => editor.chain().focus().deleteRow().run()], ['Delete table', () => editor.chain().focus().deleteTable().run()]] as [string, () => void][]).map(([label, fn]) => (
                  <button key={label} onMouseDown={e => { e.preventDefault(); fn(); setShowTableMenu(false); }} className="text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">{label}</button>
                ))}
              </div>)}
            </div>
            {sep}
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }} className={btn(false)} title="Horizontal line"><MinusIcon className="w-3.5 h-3.5" /></button>
            <button onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run(); }} className={btn(editor.isActive('codeBlock'))} title="Code block"><CodeIcon className="w-3.5 h-3.5" /></button>
            {sep}
            <button onMouseDown={e => { e.preventDefault(); if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); } else { setPromptValue(""); setPromptDialog({ title: 'Insert Link', placeholder: 'Enter URL...', onConfirm: (url) => { if (url) editor.chain().focus().setLink({ href: url }).run(); } }); } }} className={btn(editor.isActive('link'))} title="Insert link (Ctrl+K)"><LinkIcon className="w-3.5 h-3.5" /></button>
          </>)}
          {activeTab === 'view' && <span className="text-xs text-slate-400 px-2">Created: {dateStr} at {timeStr}</span>}
        </div>
      </div>

      {/* Page canvas */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-10 pt-6 pb-32">
          <input value={pageTitle} onChange={e => handleTitleChange(e.target.value)} placeholder="Untitled Page" className="w-full text-3xl font-bold bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 pb-1 mb-0.5" />
          <div className="text-xs text-slate-400 dark:text-slate-500 mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">{dateStr}, {timeStr}</div>
          <div className="cursor-text min-h-[calc(100vh-250px)]" onClick={() => { if (!editor.isFocused) editor.commands.focus('start'); }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      {/* Prompt dialog */}
      {promptDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={e => { if (e.target === e.currentTarget) setPromptDialog(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" onMouseDown={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">{promptDialog.title}</h2>
            <input ref={promptInputRef} autoFocus value={promptValue} onChange={e => setPromptValue(e.target.value)} placeholder={promptDialog.placeholder}
              onKeyDown={e => { if (e.key === "Enter" && promptValue.trim()) { promptDialog.onConfirm(promptValue.trim()); setPromptDialog(null); } if (e.key === "Escape") setPromptDialog(null); }}
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPromptDialog(null)} className="px-4 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={() => { if (promptValue.trim()) { promptDialog.onConfirm(promptValue.trim()); setPromptDialog(null); } }} className="px-4 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">OK</button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .notebook-editor p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #adb5bd; pointer-events: none; height: 0; }
        .notebook-editor img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; cursor: pointer; transition: box-shadow 0.2s; }
        .notebook-editor img:hover { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); }
        .notebook-editor img.ProseMirror-selectednode { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.6); }
        .notebook-editor ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .notebook-editor ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 8px; margin: 4px 0; }
        .notebook-editor ul[data-type="taskList"] li label { flex-shrink: 0; margin-top: 3px; }
        .notebook-editor ul[data-type="taskList"] li label input[type="checkbox"] { width: 16px; height: 16px; accent-color: #3b82f6; cursor: pointer; }
        .notebook-editor ul[data-type="taskList"] li[data-checked="true"] > div > p { text-decoration: line-through; opacity: 0.5; }
        .notebook-editor p { margin: 4px 0; line-height: 1.7; }
        .notebook-editor h1 { font-size: 1.75rem; font-weight: 700; margin: 20px 0 8px; }
        .notebook-editor h2 { font-size: 1.35rem; font-weight: 600; margin: 16px 0 6px; }
        .notebook-editor h3 { font-size: 1.1rem; font-weight: 600; margin: 12px 0 4px; }
        .notebook-editor ul, .notebook-editor ol { padding-left: 24px; margin: 6px 0; }
        .notebook-editor li { margin: 2px 0; line-height: 1.7; }
        .notebook-editor blockquote { border-left: 4px solid #a78bfa; background: #f5f3ff; padding: 8px 16px; margin: 8px 0; border-radius: 0 8px 8px 0; font-style: italic; }
        .dark .notebook-editor blockquote { background: rgba(139, 92, 246, 0.1); }
        .notebook-editor table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .notebook-editor td, .notebook-editor th { border: 1px solid #d1d5db; padding: 8px 12px; }
        .dark .notebook-editor td, .dark .notebook-editor th { border-color: #4b5563; }
        .notebook-editor th { background: #f1f5f9; font-weight: 600; }
        .dark .notebook-editor th { background: #1e293b; }
        .notebook-editor code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.875em; }
        .dark .notebook-editor code { background: #1e293b; }
        .notebook-editor pre { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 8px; margin: 12px 0; overflow-x: auto; }
        .notebook-editor pre code { background: none; padding: 0; }
        .notebook-editor hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        .dark .notebook-editor hr { border-color: #334155; }
        .notebook-editor a, .notebook-link { color: #3b82f6; text-decoration: underline; cursor: pointer; }
        .notebook-editor a:hover, .notebook-link:hover { color: #2563eb; }
        .notebook-editor .ProseMirror-focused { outline: none; }
        .notebook-editor sup { font-size: 0.75em; vertical-align: super; }
        .notebook-editor sub { font-size: 0.75em; vertical-align: sub; }
        .notebook-editor .tableWrapper { overflow-x: auto; }
        .notebook-editor .selectedCell { background: rgba(59, 130, 246, 0.1); }
        .notebook-editor .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: #3b82f6; cursor: col-resize; }
        .notebook-editor .resize-cursor { cursor: col-resize; }
        .notebook-editor span[style] { /* preserve pasted inline styles */ }
        .notebook-editor h4 { font-size: 1rem; font-weight: 600; margin: 10px 0 4px; }
        .notebook-editor h5 { font-size: 0.9rem; font-weight: 600; margin: 8px 0 4px; }
        .notebook-editor h6 { font-size: 0.85rem; font-weight: 600; margin: 6px 0 4px; color: #64748b; }
      `}</style>
    </div>
  );
}
