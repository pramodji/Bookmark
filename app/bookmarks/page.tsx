"use client";


import { apiFetch } from "@/lib/api-fetch";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, TrashIcon, StarIcon, GripVerticalIcon, Edit2Icon, CopyIcon, UploadIcon, XIcon, ChevronRightIcon, SortAscIcon, SortDescIcon, LayoutListIcon, LockIcon, UnlockIcon, SettingsIcon, SearchIcon, BookmarkIcon, CalendarDaysIcon, MinusIcon, Settings2Icon, CheckSquareIcon, FileTextIcon, LogOutIcon, UserCircleIcon, BellIcon, TrendingUpIcon, HelpCircleIcon, ArrowLeftIcon, MonitorIcon } from "lucide-react";
import { SettingsPanel, applyAccentColor } from "@/components/settings-panel";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AnimatedModal } from "@/components/animated-modal";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { showUndoToast } from "@/components/undo-toast";
import { StickyEditor } from "@/components/sticky-editor";
import { StickyNote } from "@/components/sticky-note";
import { WidgetPanel, DockedWidget } from "@/components/widget-panel";
import { useLoading } from "@/components/loading-provider";
import { isAuthenticated, signOut, getAuthUser } from "@/components/login-gate";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const { theme } = useStore();
  const { setLoading } = useLoading();
  const admin = typeof window !== "undefined" ? isAuthenticated() : false;
  const navHidden = useScrollDirection();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: settings = {} } = useQuery({ queryKey: ['settings'], queryFn: async () => (await apiFetch('/api/settings')).json(), staleTime: Infinity });
  const saveSettings = useMutation({ mutationFn: async (data: Record<string, any>) => apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), onSuccess: (_res, data) => { queryClient.setQueryData(['settings'], (old: any) => ({ ...old, ...data })); } });

  useEffect(() => {
    if (!settings || !Object.keys(settings).length) return;
    if (settings.groupColors) { setGroupColors(settings.groupColors); }
    if (settings.groupColumns) { setGroupColumns(settings.groupColumns); }
    if (settings.groupSorts) { setGroupSorts(settings.groupSorts); }
    if (settings.accentColor) { setAccentColor(settings.accentColor); applyAccentColor(settings.accentColor); }
    if (settings.bmColumns) { setColumns(settings.bmColumns); }
    if (settings.bmRows) { setRows(settings.bmRows); }
    if (settings.fontSize) { setFontSize(settings.fontSize); }
    if (settings.fontFamily) { setFontFamily(settings.fontFamily); }
    if (settings.collapsedGroups) setCollapsedGroups(settings.collapsedGroups);
    if (settings.collapsedSubgroups) { setCollapsedSubgroups(settings.collapsedSubgroups); }
    if (settings.showFavorites !== undefined) setShowFavorites(settings.showFavorites);
    if (settings.showClock !== undefined) setShowClock(settings.showClock);
    if (settings.hideGroupBorder !== undefined) setHideGroupBorder(settings.hideGroupBorder);
    if (settings.hideWidgetBorder !== undefined) setHideWidgetBorder(settings.hideWidgetBorder);
    if (settings.groupOpacity !== undefined) setGroupOpacity(settings.groupOpacity);
    if (settings.subgroupOpacity !== undefined) setSubgroupOpacity(settings.subgroupOpacity);
    if (settings.subgroupBmOpacity !== undefined) setSubgroupBmOpacity(settings.subgroupBmOpacity);
    if (settings.widgetOpacity !== undefined) setWidgetOpacity(settings.widgetOpacity);

    if (settings.showTags !== undefined) setShowTags(settings.showTags);
    if (settings.showSubgroupsOnly !== undefined) setShowSubgroupsOnly(settings.showSubgroupsOnly);
    if (settings.showTopButtons !== undefined) setShowTopButtons(settings.showTopButtons);
    if (settings.backupPath) setBackupPath(settings.backupPath);
    if (settings.autoBackup !== undefined) setAutoBackup(settings.autoBackup);
    if (settings.bgImage !== undefined) setBgImage(settings.bgImage);
    if (settings.bgOpacity !== undefined) setBgOpacity(settings.bgOpacity);
    if (settings.bgBlur !== undefined) setBgBlur(settings.bgBlur);
    if (settings.clearSearchOnClick !== undefined) setClearSearchOnClick(settings.clearSearchOnClick);
    if (settings.groupDisplaySettings) setGroupDisplaySettings(settings.groupDisplaySettings);
  }, [settings]);

  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const { data: openTaskCount = 0 } = useQuery({ queryKey: ['taskCount'], queryFn: async () => { const tasks = await (await apiFetch('/api/tasks')).json(); return tasks.filter((t: any) => !t.completed && t.dueDate === today).length; }, staleTime: 30000 });
  const { data: activeReminderCount = 0 } = useQuery({ queryKey: ['reminderCount'], queryFn: async () => { const reminders = await (await apiFetch('/api/reminders')).json(); return reminders.filter((r: any) => !r.dismissed).length; }, staleTime: 30000 });
  const { data: todayNoteCount = 0 } = useQuery({ queryKey: ['noteCount'], queryFn: async () => { const notes = await (await apiFetch('/api/notes')).json(); return notes.filter((n: any) => n.date === today).length; }, staleTime: 0 });

  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery({ queryKey: ['bookmarks'], queryFn: async () => (await apiFetch('/api/bookmarks')).json() });
  const { data: groups = ["General"], isLoading: groupsLoading } = useQuery({ queryKey: ['groups'], queryFn: async () => (await apiFetch('/api/groups')).json() });
  const { data: subgroups = [] } = useQuery({ queryKey: ['subgroups'], queryFn: async () => (await apiFetch('/api/subgroups')).json() });
  const { data: stickyNotes = [] } = useQuery({ queryKey: ['stickyNotes'], queryFn: async () => (await apiFetch('/api/sticky-notes')).json() });
  const { data: widgets = [] } = useQuery({ queryKey: ['widgets'], queryFn: async () => (await apiFetch('/api/widgets')).json() });
  const { data: allTasks = [] } = useQuery({ queryKey: ['allTasks'], queryFn: async () => (await apiFetch('/api/tasks')).json(), staleTime: 30000 });
  const { data: allNotes = [] } = useQuery({ queryKey: ['allNotes'], queryFn: async () => (await apiFetch('/api/notes')).json(), staleTime: 30000 });
  
  // Hide loading when main data is loaded
  useEffect(() => {
    if (!bookmarksLoading && !groupsLoading && mounted) {
      setLoading(false);
    }
  }, [bookmarksLoading, groupsLoading, mounted, setLoading]);
  const createWidget = useMutation({
    mutationFn: async (w: any) => apiFetch('/api/widgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(w) }),
    onMutate: async (w) => { const prev = queryClient.getQueryData(['widgets']); queryClient.setQueryData(['widgets'], (old: any[]) => [...(old || []), { ...w, config: w.config || {} }]); return { prev }; },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(['widgets'], ctx.prev); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['widgets'] }),
  });
  const updateWidget = useMutation({
    mutationFn: async (w: any) => apiFetch('/api/widgets', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(w) }),
    onMutate: async (w) => { const prev = queryClient.getQueryData(['widgets']); queryClient.setQueryData(['widgets'], (old: any[]) => (old || []).map(x => x.id === w.id ? { ...x, ...w } : x)); return { prev }; },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(['widgets'], ctx.prev); },
  });
  const deleteWidget = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/widgets?id=${id}`, { method: 'DELETE' }),
    onMutate: async (id) => { const prev = queryClient.getQueryData(['widgets']); queryClient.setQueryData(['widgets'], (old: any[]) => (old || []).filter(x => x.id !== id)); return { prev }; },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(['widgets'], ctx.prev); },
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [collapsedSubgroups, setCollapsedSubgroups] = useState<Record<string, boolean>>({});
  const [groupSorts, setGroupSorts] = useState<Record<string, 'none' | 'asc' | 'desc'>>({});
  const [groupInputs, setGroupInputs] = useState<Record<string, string>>({});
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSubgroupsOnly, setShowSubgroupsOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
  const [draggedSticky, setDraggedSticky] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [draggedSubgroup, setDraggedSubgroup] = useState<{ name: string; group: string } | null>(null);
  const draggedGroupRef = useRef<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; bookmark: any } | null>(null);
  const [groupContextMenu, setGroupContextMenu] = useState<{ x: number; y: number; group: string } | null>(null);
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [renamingSubgroup, setRenamingSubgroup] = useState<{ name: string; group: string; data?: any } | null>(null);
  const [renameSubgroupValue, setRenameSubgroupValue] = useState("");
  const [editModal, setEditModal] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [selectedBookmarksForSubgroup, setSelectedBookmarksForSubgroup] = useState<Set<string>>(new Set());
  const [groupColors, setGroupColors] = useState<Record<string, string>>({});
  const { data: groupIcons = {} } = useQuery({ queryKey: ['groupIcons'], queryFn: async () => (await apiFetch('/api/group-icons')).json() });

  const saveGroupIcons = async (icons: Record<string, string>) => {
    await apiFetch('/api/group-icons', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(icons) });
    queryClient.setQueryData(['groupIcons'], icons);
  };
  const [groupColumns, setGroupColumns] = useState<Record<string, number>>({});
  const [tempTitle, setTempTitle] = useState("");
  const [tempUrl, setTempUrl] = useState("");
  const [tempTags, setTempTags] = useState("");
  const [tempNotes, setTempNotes] = useState("");
  const [tempIcon, setTempIcon] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("blue");
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(20);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('system-ui');
  const [tempOpacity, setTempOpacity] = useState<number | null>(null);
  const [showSubgroupModal, setShowSubgroupModal] = useState(false);
  const [subgroupName, setSubgroupName] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [showClock, setShowClock] = useState(true);
  const [hideGroupBorder, setHideGroupBorder] = useState(false);
  const [hideWidgetBorder, setHideWidgetBorder] = useState(false);
  const [groupOpacity, setGroupOpacity] = useState(1);
  const [subgroupOpacity, setSubgroupOpacity] = useState(1);
  const [subgroupBmOpacity, setSubgroupBmOpacity] = useState(1);
  const [widgetOpacity, setWidgetOpacity] = useState(1);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showTopButtons, setShowTopButtons] = useState(true);
  const [htmlImportPreview, setHtmlImportPreview] = useState<{ title: string; url: string; icon: string; group: string; selected: boolean }[] | null>(null);
  const [htmlImporting, setHtmlImporting] = useState(false);
  const [promptDialog, setPromptDialog] = useState<{ title: string; placeholder: string; defaultValue: string; onConfirm: (val: string) => void } | null>(null);
  const [backupPath, setBackupPath] = useState('./backups');
  const [autoBackup, setAutoBackup] = useState(false);
  const [restoreOverlay, setRestoreOverlay] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const [bgOpacity, setBgOpacity] = useState(0.3);
  const [bgBlur, setBgBlur] = useState(0);
  const [clearSearchOnClick, setClearSearchOnClick] = useState(true);
  const [groupDisplaySettings, setGroupDisplaySettings] = useState<Record<string, { viewMode: string; iconSize: string; visibleCount: string }>>({});
  const [displaySettingsGroup, setDisplaySettingsGroup] = useState<string | null>(null);

  // Daily auto-backup trigger
  useEffect(() => {
    if (!autoBackup) return;
    const run = () => apiFetch('/api/backup?scheduled=1');
    run();
    // Re-run at midnight
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const t = setTimeout(() => { run(); }, msUntilMidnight);
    return () => clearTimeout(t);
  }, [autoBackup]);

  useEffect(() => {
    if (editModal) {
      setTempTitle(editModal.title || "");
      setTempUrl(editModal.url || "");
      setTempTags(editModal.tags || "");
      setTempNotes(editModal.notes || "");
      setTempIcon(editModal.icon || "");
      setTempDescription(editModal.description || "");
    }
  }, [editModal]);


  const [customIcons, setCustomIcons] = useState<string[]>([]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerSubgroup, setIconPickerSubgroup] = useState<{ name: string; group: string; data?: any } | null>(null);
  const [iconPickerBookmark, setIconPickerBookmark] = useState<any>(null);
  const [iconPickerMulti, setIconPickerMulti] = useState<string[] | null>(null);
  const [healthStatus, setHealthStatus] = useState<Record<string, 'ok' | 'dead' | 'checking'>>({});

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const emojiTime = timeStr.replace(/\d/g, (digit) => ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'][parseInt(digit)]);
      setClock(emojiTime);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) { setSearch(""); searchRef.current?.blur(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data: savedIcons = [] } = useQuery({ queryKey: ['icons'], queryFn: async () => {
    const res = await apiFetch('/api/icons');
    return res.ok ? res.json() : [];
  } });

  const saveIconToLibrary = async (iconUrl: string) => {
    await apiFetch('/api/icons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ icon: iconUrl }) });
    queryClient.invalidateQueries({ queryKey: ['icons'] });
  };

  const trackVisit = useMutation({
    mutationFn: async (id: string) => apiFetch('/api/bookmarks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }),
  });

  const updateBookmark = useMutation({ mutationFn: async (b: any) => apiFetch('/api/bookmarks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }) });
  const createBookmark = useMutation({ mutationFn: async (b: any) => apiFetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }) });
  const deleteBookmark = useMutation({ mutationFn: async (id: string) => apiFetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }) });
  const deleteBookmarkWithUndo = (bookmark: any) => {
    deleteBookmark.mutate(bookmark.id);
    showUndoToast(`Deleted "${bookmark.title}"`, () => {
      createBookmark.mutate({ ...bookmark });
    });
  };
  const bulkDeleteBookmarks = useMutation({
    mutationFn: async (ids: string[]) => apiFetch('/api/bookmarks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });
  const updateGroups = useMutation({
    mutationFn: async (g: string[]) => apiFetch('/api/groups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groups: g }) }),
    onMutate: (g) => queryClient.setQueryData(['groups'], g),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] })
  });
  const createSubgroup = useMutation({ mutationFn: async (s: any) => apiFetch('/api/subgroups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subgroups'] }) });
  const updateSubgroup = useMutation({ mutationFn: async (s: any) => apiFetch('/api/subgroups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subgroups'] }) });
  const deleteSubgroup = useMutation({ mutationFn: async (id: string) => apiFetch(`/api/subgroups?id=${id}`, { method: 'DELETE' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subgroups'] }) });
  const createStickyNote = useMutation({ mutationFn: async (n: any) => apiFetch('/api/sticky-notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(n) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stickyNotes'] }) });
  const updateStickyNote = useMutation({ mutationFn: async (n: any) => apiFetch('/api/sticky-notes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(n) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stickyNotes'] }) });
  const deleteStickyNote = useMutation({ mutationFn: async (id: string) => apiFetch(`/api/sticky-notes?id=${id}`, { method: 'DELETE' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stickyNotes'] }) });

  const bulkUpdateBookmarks = useMutation({
    mutationFn: async (items: any[]) => {
      console.log('Bulk updating bookmarks:', items);
      const response = await apiFetch('/api/bookmarks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) });
      const result = await response.json();
      console.log('Bulk update response:', response.status, result);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return result;
    },
    onSuccess: () => {
      console.log('Bulk update successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: (error) => {
      console.error('Bulk update failed:', error);
    }
  });

  const allTags: string[] = Array.from(new Set(bookmarks.flatMap((b: any) => (typeof b.tags === 'string' && b.tags) ? b.tags.split(",").map((t: string) => t.trim()) : [])));

  // Include orphan groups (bookmark groups not in the groups list)
  const bookmarkGroupNames: string[] = Array.from(new Set(bookmarks.map((b: any) => (b.group || 'General') as string)));
  const effectiveGroups: string[] = [...(groups as string[]), ...bookmarkGroupNames.filter(g => !(groups as string[]).includes(g))];
  
  const getGroupBookmarks = (group: string) => {
    let items = bookmarks.filter((b: any) => (b.group || "General") === group);
    if (search) items = items.filter((b: any) => b.title?.toLowerCase().includes(search.toLowerCase()));
    if (showFavorites) items = items.filter((b: any) => b.favorite);
    if (showSubgroupsOnly) items = items.filter((b: any) => b.subgroup);
    if (selectedTag) items = items.filter((b: any) => typeof b.tags === 'string' && b.tags.includes(selectedTag));
    const sort = groupSorts[group] || 'none';
    if (sort === 'asc') return items.sort((a: any, b: any) => a.title.localeCompare(b.title));
    if (sort === 'desc') return items.sort((a: any, b: any) => b.title.localeCompare(a.title));
    return items.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
  };

  const addToGroup = async (group: string) => {
    const url = groupInputs[group];
    if (!url) return;
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    
    try {
      const response = await apiFetch(`/api/metadata?url=${encodeURIComponent(fullUrl)}`);
      const metadata = await response.json();
      const newBookmark = { 
        id: Date.now().toString(), 
        title: metadata.title || new URL(fullUrl).hostname || url, 
        url: fullUrl, 
        group, 
        tags: "", 
        favorite: false, 
        position: bookmarks.length, 
        notes: "", 
        icon: metadata.icon || `https://www.google.com/s2/favicons?domain=${new URL(fullUrl).hostname}&sz=64`, 
        description: metadata.description || "" 
      };
      setEditModal(newBookmark);
    } catch {
      const hostname = new URL(fullUrl).hostname;
      const newBookmark = { 
        id: Date.now().toString(), 
        title: hostname || url, 
        url: fullUrl, 
        group, 
        tags: "", 
        favorite: false, 
        position: bookmarks.length, 
        notes: "", 
        icon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`, 
        description: "" 
      };
      setEditModal(newBookmark);
    }
    setGroupInputs({ ...groupInputs, [group]: "" });
  };

  const renameGroup = (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName || groups.includes(newName)) return;
    updateGroups.mutate(groups.map((g: string) => g === oldName ? newName : g));
    bulkUpdateBookmarks.mutate(bookmarks.filter((b: any) => b.group === oldName).map((b: any) => ({ ...b, group: newName })));
    const migrate = (obj: Record<string, any>) => { if (!(oldName in obj)) return obj; const n = { ...obj, [newName]: obj[oldName] }; delete n[oldName]; return n; };
    const nc = migrate(groupColors); setGroupColors(nc); saveSettings.mutate({ groupColors: nc });
    const nco = migrate(groupColumns); setGroupColumns(nco); saveSettings.mutate({ groupColumns: nco });
    const ns = migrate(groupSorts); setGroupSorts(ns); saveSettings.mutate({ groupSorts: ns });
    saveGroupIcons(migrate(groupIcons));
  };

  const handleSubgroupDrop = (targetGroup: string, fromIndex: number, toIndex: number, orderedItems: any[]) => {
    if (!draggedSubgroup || fromIndex === toIndex) return;
    
    if (draggedSubgroup.group === targetGroup) {
      // Reorder within same group
      const reordered = [...orderedItems];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      
      // Update positions for all items
      reordered.forEach((item, i) => {
        if (item.type === 'subgroup') {
          const sg = subgroups.find((s: any) => s.name === item.name && s.group === targetGroup);
          if (sg) {
            updateSubgroup.mutate({ ...sg, position: i * 10 });
          } else {
            createSubgroup.mutate({ id: Date.now().toString(), name: item.name, group: targetGroup, position: i * 10 });
          }
        } else {
          updateBookmark.mutate({ ...item.data, position: i * 10 });
        }
      });
    }
    setDraggedSubgroup(null);
  };

  if (!mounted) return null;

  return (
    <>
    {restoreOverlay && (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[260px]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Restoring backup…</p>
          <p className="text-xs text-slate-400 text-center">Please wait, do not close or refresh the page.</p>
        </div>
      </div>
    )}
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden relative" onClick={() => { setContextMenu(null); setGroupContextMenu(null); setDisplaySettingsGroup(null); setRenamingGroup(null); setRenamingSubgroup(null); setSelectedBookmarks(new Set()); setShowWidgetPicker(false); setIconPickerSubgroup(null); setIconPickerBookmark(null); }} style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily }}>
      {bgImage && <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})`, opacity: bgOpacity, filter: bgBlur > 0 ? `blur(${bgBlur}px)` : undefined }} />}
      <div suppressHydrationWarning className={`fixed top-0 left-0 right-0 z-40 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-3 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-transform duration-300 ${navHidden || search ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <TrendingUpIcon className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <Link href="/bookmarks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200">
          <BookmarkIcon className="w-3.5 h-3.5" /> Bookmarks
        </Link>
        <Link href="/tasks" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <CheckSquareIcon className="w-3.5 h-3.5" /> Tasks {openTaskCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openTaskCount}</span>}
        </Link>
        <Link href="/calendar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <CalendarDaysIcon className="w-3.5 h-3.5" /> Diary
        </Link>
        <Link href="/notes" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <FileTextIcon className="w-3.5 h-3.5" /> Notes {todayNoteCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{todayNoteCount}</span>}
        </Link>
        <Link href="/reminders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BellIcon className="w-3.5 h-3.5" /> Reminders {activeReminderCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeReminderCount}</span>}
        </Link>
        <Button variant="secondary" size="sm" onClick={() => setIsEditMode(!isEditMode)} className="hover:scale-105 transition-all duration-200" style={{ display: admin ? undefined : 'none' }}>
          {isEditMode ? <UnlockIcon className="w-3.5 h-3.5 mr-1" /> : <LockIcon className="w-3.5 h-3.5 mr-1" />}
          {isEditMode ? "Lock" : "Edit"}
        </Button>
        {showTopButtons && (
          <>
            <Button variant={showFavorites ? "default" : "secondary"} size="sm" onClick={() => setShowFavorites(!showFavorites)} className="hover:scale-105 transition-all duration-200">
              <StarIcon className="w-3.5 h-3.5 mr-1" /> Favorites
            </Button>

            {selectedBookmarks.size > 0 && (
              <Button size="sm" variant="secondary" onClick={() => { setSelectedBookmarksForSubgroup(new Set(selectedBookmarks)); setShowSubgroupModal(true); }} className="hover:scale-105 transition-all duration-200">
                Create Subgroup ({selectedBookmarks.size})
              </Button>
            )}
          </>
        )}

        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="secondary" onClick={() => createStickyNote.mutate({ id: Date.now().toString(), content: "", color: "yellow", position: 0, floating: true, x: 120, y: 80 })} className="hover:scale-105 transition-all duration-200" style={{ display: admin ? undefined : 'none' }}><PlusIcon className="w-3.5 h-3.5 mr-1" />Sticky</Button>
          <div className="relative">
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setShowWidgetPicker(p => !p); }} className="hover:scale-105 transition-all duration-200" style={{ display: admin ? undefined : 'none' }}><PlusIcon className="w-3.5 h-3.5 mr-1" />Widget</Button>
            {showWidgetPicker && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-1 w-36 z-50" onClick={e => e.stopPropagation()}>
                {[
                  {type:'clock',label:'Clock',icon:'🕐'},
                  {type:'tasks',label:'Tasks',icon:'✅'},
                  {type:'notes',label:'Notes',icon:'📝'},
                  {type:'custom',label:'Custom',icon:'✏️'},
                  {type:'currency',label:'Currency',icon:'💱'},
                  {type:'stock',label:'Stock Quote',icon:'📈'},
                  {type:'rss',label:'RSS Feed',icon:'📡'},
                  {type:'embed',label:'Embed',icon:'🔗'},
                  {type:'weather',label:'Weather',icon:'🌤️'},
                  {type:'countdown',label:'Countdown',icon:'⏳'},
                ].map(({type,label,icon}) => (
                  <button key={type} onClick={() => { createWidget.mutate({ id: Date.now().toString(), title: label, type, floating: true, x: 220, y: 100, width: 300, height: 200 }); setShowWidgetPicker(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs flex items-center gap-2"><span>{icon}</span>{label}</button>
                ))}
              </div>
            )}
          </div>
          {mounted && showClock && <span className="text-xl font-semibold text-slate-700 dark:text-slate-200 tracking-wide drop-shadow-lg">{clock}</span>}
          <Button size="sm" variant="ghost" onClick={() => setIsSettingsOpen(true)} className="hover:scale-110 transition-all duration-200" style={{ display: admin ? undefined : 'none' }}><SettingsIcon className="w-4 h-4" /></Button>
          <div className="relative group/account">
            <Button size="sm" variant="ghost" className="hover:scale-110 transition-all duration-200"><UserCircleIcon className="w-4 h-4" /></Button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover/account:block bg-white dark:bg-slate-900 shadow-xl rounded-lg border px-3 py-2 w-48 z-50">
              {(() => { const u = getAuthUser(); return u ? (<><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{u.firstName} {u.lastName}</p><p className="text-xs text-slate-500">@{u.username}</p><p className="text-[10px] text-slate-400 capitalize mt-0.5">{u.role}</p></>) : null; })()}
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={signOut} className="hover:scale-110 transition-all duration-200 text-red-500 hover:text-red-600"><LogOutIcon className="w-4 h-4" /></Button>
          <Link href="/help"><Button size="sm" variant="ghost" className="hover:scale-110 transition-all duration-200"><HelpCircleIcon className="w-4 h-4" /></Button></Link>
        </div>
      </div>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 w-96 z-50 transition-all duration-300">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search bookmarks… (Ctrl+B)"
          className="w-full pl-11 pr-10 py-2 text-sm bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-200/40 dark:border-slate-700/40 outline-none shadow-[0_4px_24px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5),0_1px_4px_rgba(0,0,0,0.3)] focus:shadow-[0_6px_32px_rgba(59,130,246,0.2),0_2px_8px_rgba(0,0,0,0.1)] dark:focus:shadow-[0_6px_32px_rgba(59,130,246,0.3),0_2px_8px_rgba(0,0,0,0.4)] focus:ring-2 focus:ring-blue-400 focus:bg-white/80 dark:focus:bg-slate-800/80 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-6 overflow-x-hidden pt-20 relative z-10" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1.5rem' }}>
        {Array.from({ length: columns }, (_, colIdx) => {
          const colWidgets = (widgets as any[]).filter((w: any) => !w.floating && (w.column ?? 0) === colIdx);
          const colGroups = effectiveGroups.filter((g: string) => { const col = groupColumns[g] ?? 0; return (col < columns ? col : 0) === colIdx; });
          const allDockedWidgets = (widgets as any[]).filter((w: any) => !w.floating);
          const colItems = [
            ...colWidgets.map((w: any) => ({ type: 'widget' as const, row: w.row ?? 0, data: w })),
            ...colGroups.map((g: string, i: number) => ({ type: 'group' as const, row: 500 + i * 100, data: g })),
          ].sort((a, b) => a.row - b.row);
          return (
            <div key={colIdx} className="space-y-6">
              {colItems.map((item) => item.type === 'widget' ? (
                <DockedWidget key={item.data.id} widget={{ ...item.data, ...(hideWidgetBorder ? { noBorder: true } : {}), opacity: widgetOpacity * (item.data.opacity ?? 1) }} tasks={allTasks} notes={allNotes}
                  totalColumns={columns} allWidgets={allDockedWidgets} groups={groups} groupColumns={groupColumns}
                  onUpdate={(data) => updateWidget.mutate({ ...item.data, ...data })}
                  onDelete={(id) => deleteWidget.mutate(id)} />
              ) : (() => { const group = item.data; return (
              <div key={group}>
                <section className="mb-6">
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { const updated = { ...collapsedGroups, [group]: !collapsedGroups[group] }; setCollapsedGroups(updated); saveSettings.mutate({ collapsedGroups: updated }); }} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (!admin) return; setGroupContextMenu({ x: e.clientX, y: e.clientY, group }); }} className="flex items-center gap-1.5"
                        onDragOver={(e) => { if (draggedSubgroup && draggedSubgroup.group !== group) { e.preventDefault(); e.currentTarget.classList.add('ring-2','ring-blue-400','rounded'); } }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2','ring-blue-400','rounded'); }}
                        onDrop={(e) => { e.currentTarget.classList.remove('ring-2','ring-blue-400','rounded'); e.preventDefault(); if (draggedSubgroup && draggedSubgroup.group !== group) handleSubgroupDrop(group, 0, 0, []); }}
                      >
                        <ChevronRightIcon className={`w-3 h-3 text-slate-400 transition-transform ${collapsedGroups[group] ? '' : 'rotate-90'}`} />
                        {groupIcons[group] && <img src={groupIcons[group]} className="w-3.5 h-3.5 shrink-0" />}
                        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: groupColors[group] || '#64748b' }}>{group}</h2>
                      </button>
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{getGroupBookmarks(group).length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => {
                        const sort = groupSorts[group] || 'none';
                        const next: 'none' | 'asc' | 'desc' = sort === 'none' ? 'asc' : sort === 'asc' ? 'desc' : 'none';
                        const updated = { ...groupSorts, [group]: next };
                        setGroupSorts(updated);

                        saveSettings.mutate({ groupSorts: updated });
                      }} className="h-5 w-5 p-0">
                        {groupSorts[group] === 'asc' ? <SortAscIcon className="w-3 h-3" /> : groupSorts[group] === 'desc' ? <SortDescIcon className="w-3 h-3" /> : <LayoutListIcon className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="collapse-grid" data-open={!collapsedGroups[group]}>
                  <div className="collapse-inner">
                  <div className={`rounded-2xl overflow-hidden transition-all ${hideGroupBorder ? '' : 'border border-slate-200 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]'}`} style={{ backgroundColor: `rgba(255,255,255,${groupOpacity})` }}
                    onDragOver={(e) => { if (draggedId) e.preventDefault(); }}
                    onDrop={(e) => { e.preventDefault(); if (draggedId) { const bm = bookmarks.find((b: any) => b.id === draggedId); if (bm && bm.group !== group) { updateBookmark.mutate({ ...bm, group, position: getGroupBookmarks(group).length }); } setDraggedId(null); } }}
                  >
                    {isEditMode && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/50 flex gap-1.5 border-b dark:border-slate-800">
                        <Input placeholder="Add URL..." value={groupInputs[group] || ""} onChange={(e) => setGroupInputs({ ...groupInputs, [group]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addToGroup(group)} onClick={(e) => e.stopPropagation()} className="text-xs h-7" />
                        <Button onClick={() => addToGroup(group)} size="sm" className="h-7 px-2"><PlusIcon className="w-3.5 h-3.5" /></Button>
                      </div>
                    )}
                    <div className={`group-items ${(groupDisplaySettings[group]?.viewMode === 'icons' || groupDisplaySettings[group]?.viewMode === 'cloud') ? 'flex flex-wrap p-2 gap-0' : ''}`}>
                      {(() => {
                        const items = getGroupBookmarks(group);
                        const ungrouped = items.filter((b: any) => !b.subgroup);
                        const subgroupNames = Array.from(new Set(items.filter((b: any) => b.subgroup).map((b: any) => b.subgroup as string)))
                          .sort((a, b) => {
                            const pa = subgroups.find((sg: any) => sg.name === a && sg.group === group)?.position ?? 0;
                            const pb = subgroups.find((sg: any) => sg.name === b && sg.group === group)?.position ?? 0;
                            return pa - pb;
                          });
                        const ds = groupDisplaySettings[group] || { viewMode: 'list', iconSize: 'small', visibleCount: 'all' };
                        const iconSizeClass = ds.iconSize === 'large' ? 'w-8 h-8' : ds.iconSize === 'medium' ? 'w-5 h-5' : 'w-3.5 h-3.5';
                        const bmHandlers = (bookmark: any) => ({
                            draggable: isEditMode,
                            onDragStart: () => { if (isEditMode) { setDraggedId(bookmark.id); setDraggedGroup(bookmark.group); } },
                            onDragEnd: () => { setDraggedId(null); setDraggedGroup(null); },
                            onDragOver: (e: React.DragEvent) => { if (draggedId && draggedId !== bookmark.id) e.preventDefault(); },
                            onDrop: (e: React.DragEvent) => { e.preventDefault(); if (draggedId && draggedId !== bookmark.id) { const db = bookmarks.find((b: any) => b.id === draggedId); if (db) { updateBookmark.mutate({ ...db, group: bookmark.group, position: bookmark.position }); updateBookmark.mutate({ ...bookmark, position: db.position }); } } },
                            onClick: (e: React.MouseEvent) => {
                              if (e.ctrlKey || e.metaKey) { if (!admin) return; e.stopPropagation(); const s = new Set(selectedBookmarks); s.has(bookmark.id) ? s.delete(bookmark.id) : s.add(bookmark.id); setSelectedBookmarks(s); }
                              else if (isEditMode) { e.stopPropagation(); }
                              else { window.open(bookmark.url); trackVisit.mutate(bookmark.id); if (clearSearchOnClick && search) setSearch(""); }
                            },
                            onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (!admin) return; if (!selectedBookmarks.has(bookmark.id)) { const s = new Set(selectedBookmarks); s.add(bookmark.id); setSelectedBookmarks(s); } setContextMenu({ x: e.clientX, y: e.clientY, bookmark }); },
                        });
                        const renderBookmark = (bookmark: any) => {
                          const selClass = selectedBookmarks.has(bookmark.id) ? 'bg-blue-50 dark:bg-blue-900/20' : '';
                          const dragClass = draggedId === bookmark.id ? 'opacity-50' : '';
                          const imgSrc = bookmark.icon || `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`;
                          const imgErr = (e: any) => { e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`; };
                          if (ds.viewMode === 'icons') return (
                            <div key={bookmark.id} className={`inline-flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all hover:scale-105 ${selClass} ${dragClass}`} {...bmHandlers(bookmark)}>
                              <img src={imgSrc} alt="" className={iconSizeClass} onError={imgErr} />
                              <span className="text-[10px] text-center truncate w-16 text-slate-600 dark:text-slate-300">{bookmark.title}</span>
                            </div>
                          );
                          if (ds.viewMode === 'cloud') return (
                            <span key={bookmark.id} className={`inline-flex items-center gap-1 px-2 py-1 m-0.5 rounded-full border text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all hover:scale-105 ${selClass} ${dragClass}`} {...bmHandlers(bookmark)}>
                              <img src={imgSrc} alt="" className="w-3 h-3" onError={imgErr} />
                              {bookmark.title}
                            </span>
                          );
                          if (ds.viewMode === 'detailed') return (
                            <div key={bookmark.id} className={`px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-all hover:scale-105 ${selClass} ${dragClass}`} {...bmHandlers(bookmark)}>
                              {isEditMode && <GripVerticalIcon className="w-3 h-3 text-slate-300 shrink-0" />}
                              <img src={imgSrc} alt="" className={iconSizeClass} onError={imgErr} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-slate-700 dark:text-slate-200">{bookmark.title}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{bookmark.url}</div>
                                {bookmark.description && <div className="text-[10px] text-slate-400 truncate">{bookmark.description}</div>}
                              </div>
                            </div>
                          );
                          // default: list
                          return (
                            <div key={bookmark.id} className={`px-2 py-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex items-center gap-1.5 group border-b border-slate-100 dark:border-slate-800 last:border-0 transition-all hover:scale-105 ${selClass} ${dragClass}`} {...bmHandlers(bookmark)}>
                              {isEditMode && <GripVerticalIcon className="w-3 h-3 text-slate-300 shrink-0" />}
                              <StarIcon className={`w-3 h-3 ${bookmark.favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} shrink-0`} />
                              <img src={imgSrc} alt="" className={iconSizeClass} onError={imgErr} />
                              <div className="flex-1 truncate">
                                <div className="font-medium truncate text-slate-700 dark:text-slate-200">{bookmark.title}</div>
                              </div>
                            </div>
                          );
                        };
                        return (
                          <>
                            {(() => {
                              const activeSort = groupSorts[group] || 'none';
                              const allItems: any[] = [
                                ...subgroupNames.map(sgName => {
                                  const sg = subgroups.find((s: any) => s.name === sgName && s.group === group);
                                  return { type: 'subgroup', name: sgName, position: sg?.position ?? 0 };
                                }),
                                ...ungrouped.map((b: any, i: number) => ({ type: 'bookmark', data: b, position: activeSort !== 'none' ? i : (b.position ?? 0) })),
                              ].sort((a, b) => a.position - b.position);

                              const visLimit = ds.visibleCount !== 'all' ? parseInt(ds.visibleCount) : Infinity;
                              const limitedItems = allItems.slice(0, visLimit);

                              const DropZone = ({ toIndex }: { toIndex: number }) => (
                                <div
                                  className={`h-1 transition-all ${draggedSubgroup ? 'hover:h-6 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded' : ''}`}
                                  onDragOver={(e) => { if (draggedSubgroup) e.preventDefault(); }}
                                  onDrop={(e) => { e.preventDefault(); if (draggedSubgroup) { const fromIndex = allItems.findIndex(it => it.type === 'subgroup' && it.name === draggedSubgroup.name); handleSubgroupDrop(group, fromIndex, toIndex, allItems); } }}
                                />
                              );

                              return limitedItems.map((item, index) => (
                                <div key={item.type === 'subgroup' ? item.name : item.data.id}>
                                  <DropZone toIndex={index} />
                                  {item.type === 'subgroup' ? (() => {
                                    const sgName = item.name;
                                    const sgKey = `${group}::${sgName}`;
                                    const sgItems = items.filter((b: any) => b.subgroup === sgName);
                                    const isCollapsed = collapsedSubgroups[sgKey];
                                    const subgroupData = subgroups.find((sg: any) => sg.name === sgName && sg.group === group);
                                    return (
                                      <>
                                        <div
                                          className={`flex items-center gap-1.5 px-2.5 py-0.5 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 select-none ${draggedSubgroup?.name === sgName && draggedSubgroup?.group === group ? 'opacity-50' : ''}`}
                                          style={{ backgroundColor: `rgba(248,250,252,${subgroupOpacity})` }}
                                          draggable={isEditMode}
                                          onDragStart={() => { if (isEditMode) setDraggedSubgroup({ name: sgName, group }); }}
                                          onDragEnd={() => setDraggedSubgroup(null)}
                                          onDragOver={(e) => { if (draggedSubgroup && isEditMode) e.preventDefault(); }}
                                          onDrop={(e) => { e.preventDefault(); if (draggedSubgroup && isEditMode) { const fromIndex = allItems.findIndex(it => it.type === 'subgroup' && it.name === draggedSubgroup.name); const toIndex = index; handleSubgroupDrop(group, fromIndex, toIndex, allItems); } }}
                                          onClick={() => { const updated = { ...collapsedSubgroups, [sgKey]: !isCollapsed }; setCollapsedSubgroups(updated); saveSettings.mutate({ collapsedSubgroups: updated }); }}
                                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (!admin) return; setContextMenu({ x: e.clientX, y: e.clientY, bookmark: { isSubgroup: true, name: sgName, group, subgroupData } }); }}
                                        >
                                          <GripVerticalIcon className="w-3 h-3 text-slate-300 shrink-0" />
                                          <ChevronRightIcon className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isCollapsed ? '' : 'rotate-90'}`} />
                                          {subgroupData?.icon && <img src={subgroupData.icon} className="w-3.5 h-3.5 shrink-0" />}
                                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-1 truncate">{sgName}</span>
                                          <span className="text-[9px] text-slate-400 bg-slate-200 dark:bg-slate-700 px-1 rounded">{sgItems.length}</span>
                                        </div>
                                        <div className="collapse-grid" data-open={!isCollapsed}>
                                        <div className="collapse-inner">
                                        {sgItems.map((b: any) => (
                                          <div key={b.id} className="pl-3" style={{ backgroundColor: `rgba(239,246,255,${subgroupBmOpacity})` }}>{renderBookmark(b)}</div>
                                        ))}
                                        </div>
                                        </div>
                                      </>
                                    );
                                  })() : (
                                    renderBookmark(item.data)
                                  )}
                                  {index === limitedItems.length - 1 && <DropZone toIndex={limitedItems.length} />}
                                </div>
                              ));
                            })()}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  </div>
                  </div>
                </section>
              </div>
              ); })())}
            </div>
          );
        })}
      </div>
      {contextMenu && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setContextMenu(null)} />
      )}
      {contextMenu && (
        <div className="fixed z-50 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border w-72 animate-in fade-in zoom-in-95 duration-150" style={{ top: contextMenu.y + 500 > window.innerHeight ? Math.max(0, contextMenu.y - 500) : contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 300) }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {contextMenu.bookmark.isSubgroup ? 'Subgroup' : contextMenu.bookmark.isSticky ? 'Sticky Note' : 'Bookmark'}
            </span>
            <button onClick={() => setContextMenu(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <XIcon className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          {contextMenu.bookmark.isSticky && (
            <button onClick={() => { createStickyNote.mutate({ id: Date.now().toString(), content: "", color: "yellow", position: 0, floating: true, x: 120, y: 80 }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
              <PlusIcon className="w-4 h-4 text-green-500" /> Add Sticky Note
            </button>
          )}
          {contextMenu.bookmark.isSubgroup ? (
            <>
              <button onClick={() => { setRenamingSubgroup({ name: contextMenu.bookmark.name, group: contextMenu.bookmark.group, data: contextMenu.bookmark.subgroupData }); setRenameSubgroupValue(contextMenu.bookmark.name); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <Edit2Icon className="w-4 h-4 text-blue-500" /> Rename
              </button>
              <button onClick={() => { const sg = contextMenu.bookmark; setIconPickerSubgroup({ name: sg.name, group: sg.group, data: sg.subgroupData }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <UploadIcon className="w-4 h-4 text-orange-500" /> Change Icon
              </button>
              <button onClick={() => { const bms = bookmarks.filter((b: any) => b.subgroup === contextMenu.bookmark.name && b.group === contextMenu.bookmark.group); bms.forEach((b: any) => updateBookmark.mutate({ ...b, subgroup: '' })); if (contextMenu.bookmark.subgroupData) { deleteSubgroup.mutate(contextMenu.bookmark.subgroupData.id); } setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <MinusIcon className="w-4 h-4 text-blue-500" /> Ungroup
              </button>
              {contextMenu.bookmark.subgroupData?.icon && (
                <button onClick={() => { updateSubgroup.mutate({ ...contextMenu.bookmark.subgroupData, icon: '' }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                  <XIcon className="w-4 h-4 text-slate-400" /> Remove Icon
                </button>
              )}
              <button onClick={() => { setConfirmDialog({ title: 'Delete Subgroup', message: `Delete "${contextMenu.bookmark.name}" and move all bookmarks to main group?`, onConfirm: () => { const bms = bookmarks.filter((b: any) => b.subgroup === contextMenu.bookmark.name && b.group === contextMenu.bookmark.group); bulkUpdateBookmarks.mutate(bms.map((b: any) => ({ ...b, subgroup: '' }))); if (contextMenu.bookmark.subgroupData) { deleteSubgroup.mutate(contextMenu.bookmark.subgroupData.id); } } }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <TrashIcon className="w-4 h-4 text-red-500" /> Delete
              </button>
            </>
          ) : contextMenu.bookmark.isSticky ? (
            <>
              <button onClick={() => { setPromptDialog({ title: 'Change Title', placeholder: 'Note title...', defaultValue: contextMenu.bookmark.note.title || '', onConfirm: (val) => updateStickyNote.mutate({ ...contextMenu.bookmark.note, title: val }) }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <Edit2Icon className="w-4 h-4 text-blue-500" /> Change Title
              </button>
              <button onClick={() => { const tmp = document.createElement('div'); tmp.innerHTML = contextMenu.bookmark.note.content || ''; navigator.clipboard.writeText(tmp.textContent || ''); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <CopyIcon className="w-4 h-4 text-green-500" /> Copy
              </button>
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Color</label>
                <div className="flex gap-1 flex-wrap">
                  {['yellow', 'blue', 'green', 'pink', 'purple', 'orange'].map(color => (
                    <button key={color} onClick={() => { updateStickyNote.mutate({ ...contextMenu.bookmark.note, color }); setContextMenu(null); }} className={`w-6 h-6 rounded border-2 ${contextMenu.bookmark.note.color === color ? 'border-slate-800' : 'border-slate-300'}`} style={{ backgroundColor: color === 'yellow' ? '#fef3c7' : color === 'blue' ? '#dbeafe' : color === 'green' ? '#d1fae5' : color === 'pink' ? '#fce7f3' : color === 'purple' ? '#e9d5ff' : '#fed7aa' }} />
                  ))}
                </div>
              </div>
              <button onClick={() => { updateStickyNote.mutate({ ...contextMenu.bookmark.note, collapsed: !contextMenu.bookmark.note.collapsed }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <MinusIcon className="w-4 h-4 text-slate-500" /> {contextMenu.bookmark.note.collapsed ? 'Show' : 'Hide'} Content
              </button>
              <button onClick={() => { updateStickyNote.mutate({ ...contextMenu.bookmark.note, floating: false }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <Edit2Icon className="w-4 h-4 text-blue-500" /> Edit in Modal
              </button>
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Transparency: {Math.round((tempOpacity ?? contextMenu.bookmark.note.opacity ?? 1) * 100)}%</label>
                <input type="range" min="0.3" max="1" step="0.1" value={tempOpacity ?? contextMenu.bookmark.note.opacity ?? 1} onChange={(e) => { const val = parseFloat(e.target.value); setTempOpacity(val); updateStickyNote.mutate({ ...contextMenu.bookmark.note, opacity: val }); }} className="w-full" />
              </div>
              <button onClick={() => { const n = contextMenu.bookmark.note; const hasContent = n.content && n.content.replace(/<[^>]*>/g, '').trim(); if (hasContent) { setConfirmDialog({ title: 'Delete Sticky Note', message: 'This note has content. Are you sure you want to delete it?', onConfirm: () => deleteStickyNote.mutate(n.id) }); } else { deleteStickyNote.mutate(n.id); } setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <TrashIcon className="w-4 h-4 text-red-500" /> Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditModal({ id: Date.now().toString(), title: '', url: '', group: contextMenu.bookmark.group || 'General', tags: '', favorite: false, position: bookmarks.length, notes: '', icon: '', description: '' }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <PlusIcon className="w-4 h-4 text-green-500" /> Add Bookmark
              </button>
              <button onClick={() => { setEditModal(contextMenu.bookmark); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <Edit2Icon className="w-4 h-4 text-blue-500" /> Edit
              </button>
              <button onClick={() => { updateBookmark.mutate({ ...contextMenu.bookmark, favorite: !contextMenu.bookmark.favorite }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <StarIcon className={`w-4 h-4 ${contextMenu.bookmark.favorite ? 'text-amber-500' : 'text-slate-400'}`} /> {contextMenu.bookmark.favorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(contextMenu.bookmark.url); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <CopyIcon className="w-4 h-4 text-green-500" /> Copy URL
              </button>
              <button onClick={() => { navigator.clipboard.writeText(contextMenu.bookmark.title); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <CopyIcon className="w-4 h-4 text-green-500" /> Copy Title
              </button>
              <button onClick={() => { setIconPickerBookmark(contextMenu.bookmark); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <UploadIcon className="w-4 h-4 text-orange-500" /> Change Icon
              </button>
              <button onClick={() => { window.open(contextMenu.bookmark.url, '_blank'); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <BookmarkIcon className="w-4 h-4 text-blue-500" /> Open
              </button>
              <button onClick={() => { window.open(contextMenu.bookmark.url, '_blank'); trackVisit.mutate(contextMenu.bookmark.id); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <BookmarkIcon className="w-4 h-4 text-blue-500" /> Open & Track
              </button>
              <div className="border-t my-0.5"></div>
              <div className="relative group">
                <button className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                  <Edit2Icon className="w-4 h-4 text-purple-500" /> Move to Group
                  <ChevronRightIcon className="w-3 h-3 ml-auto" />
                </button>
                <div className="absolute left-full top-0 ml-1 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-1.5 w-40 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                  {groups.map((g: string) => (
                    <button key={g} onClick={() => { updateBookmark.mutate({ ...contextMenu.bookmark, group: g }); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300">
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative group">
                <button className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                  <Edit2Icon className="w-4 h-4 text-purple-500" /> Move to Subgroup
                  <ChevronRightIcon className="w-3 h-3 ml-auto" />
                </button>
                <div className="absolute left-full top-0 ml-1 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border p-1.5 w-40 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                  <button onClick={() => { updateBookmark.mutate({ ...contextMenu.bookmark, subgroup: '' }); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300">
                    None
                  </button>
                  {Array.from(new Set(subgroups.map((sg: any) => sg.name))).map((sgName) => (
                    <button key={sgName as string} onClick={() => { updateBookmark.mutate({ ...contextMenu.bookmark, subgroup: sgName }); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300">
                      {sgName as string}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { const newBookmark = { ...contextMenu.bookmark, id: Date.now().toString(), title: contextMenu.bookmark.title + ' (Copy)' }; createBookmark.mutate(newBookmark); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <CopyIcon className="w-4 h-4 text-blue-500" /> Duplicate
              </button>
              <div className="border-t my-0.5"></div>
              {selectedBookmarks.size > 1 && (
                <>
                <button onClick={() => { setIconPickerMulti(Array.from(selectedBookmarks)); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                  <UploadIcon className="w-4 h-4 text-orange-500" /> Change Icon ({selectedBookmarks.size})
                </button>
                <button onClick={() => { setConfirmDialog({ title: 'Delete Selected', message: `Delete ${selectedBookmarks.size} selected bookmarks?`, onConfirm: () => { bulkDeleteBookmarks.mutate(Array.from(selectedBookmarks)); setSelectedBookmarks(new Set()); } }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg text-[13px] flex items-center gap-3">
                  <TrashIcon className="w-4 h-4" /> Delete Selected ({selectedBookmarks.size})
                </button>
                </>
              )}
              <button onClick={() => { setConfirmDialog({ title: 'Delete Bookmark', message: `Are you sure you want to delete "${contextMenu.bookmark.title}"?`, onConfirm: () => deleteBookmarkWithUndo(contextMenu.bookmark) }); setContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
                <TrashIcon className="w-4 h-4 text-red-500" /> Delete
              </button>
            </>
          )}
        </div>
      )}
      {iconPickerBookmark && (
        <AnimatedModal isOpen={!!iconPickerBookmark} onClose={() => setIconPickerBookmark(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Change Bookmark Icon</h3>
              <button onClick={() => setIconPickerBookmark(null)}><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Paste icon URL..." className="text-xs flex-1" id="bookmark-icon-input" />
              <label className="px-3 py-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 flex items-center">
                <UploadIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) { const reader = new FileReader(); reader.onload = ev => { const url = ev.target?.result as string; updateBookmark.mutate({ ...iconPickerBookmark, icon: url }); setIconPickerBookmark(null); }; reader.readAsDataURL(file); }
                }} />
              </label>
              <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[13px]" onClick={() => {
                const val = (document.getElementById('bookmark-icon-input') as HTMLInputElement)?.value.trim();
                if (val) { updateBookmark.mutate({ ...iconPickerBookmark, icon: val }); } setIconPickerBookmark(null);
              }}>Set</button>
            </div>
            {(savedIcons.length > 0 || bookmarks.some((b: any) => b.icon)) && (
              <div className="grid grid-cols-8 gap-2 p-2 border rounded-lg max-h-40 overflow-y-auto">
                {Array.from(new Set([...savedIcons, ...bookmarks.map((b: any) => b.icon).filter(Boolean)])).map((icon: string, idx: number) => (
                  <img key={idx} src={icon} className="w-10 h-10 cursor-pointer hover:ring-2 ring-blue-500 rounded border" onClick={() => {
                    updateBookmark.mutate({ ...iconPickerBookmark, icon }); setIconPickerBookmark(null);
                  }} />
                ))}
              </div>
            )}
          </div>
        </AnimatedModal>
      )}
      {iconPickerMulti && (
        <AnimatedModal isOpen={!!iconPickerMulti} onClose={() => setIconPickerMulti(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Change Icon ({iconPickerMulti.length} bookmarks)</h3>
              <button onClick={() => setIconPickerMulti(null)}><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Paste icon URL..." className="text-xs flex-1" id="multi-icon-input" />
              <label className="px-3 py-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 flex items-center">
                <UploadIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) { const reader = new FileReader(); reader.onload = ev => { const url = ev.target?.result as string; bulkUpdateBookmarks.mutate(iconPickerMulti.map(id => bookmarks.find((b: any) => b.id === id)).filter(Boolean).map((b: any) => ({ ...b, icon: url }))); setIconPickerMulti(null); setSelectedBookmarks(new Set()); }; reader.readAsDataURL(file); }
                }} />
              </label>
              <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[13px]" onClick={() => {
                const val = (document.getElementById('multi-icon-input') as HTMLInputElement)?.value.trim();
                if (val) { bulkUpdateBookmarks.mutate(iconPickerMulti.map(id => bookmarks.find((b: any) => b.id === id)).filter(Boolean).map((b: any) => ({ ...b, icon: val }))); setSelectedBookmarks(new Set()); }
                setIconPickerMulti(null);
              }}>Set</button>
            </div>
            {(savedIcons.length > 0 || bookmarks.some((b: any) => b.icon)) && (
              <div className="grid grid-cols-8 gap-2 p-2 border rounded-lg max-h-40 overflow-y-auto">
                {Array.from(new Set([...savedIcons, ...bookmarks.map((b: any) => b.icon).filter(Boolean)])).map((icon: string, idx: number) => (
                  <img key={idx} src={icon} className="w-10 h-10 cursor-pointer hover:ring-2 ring-blue-500 rounded border" onClick={() => {
                    bulkUpdateBookmarks.mutate(iconPickerMulti.map(id => bookmarks.find((b: any) => b.id === id)).filter(Boolean).map((b: any) => ({ ...b, icon }))); setIconPickerMulti(null); setSelectedBookmarks(new Set());
                  }} />
                ))}
              </div>
            )}
          </div>
        </AnimatedModal>
      )}
      {iconPickerSubgroup && (
        <AnimatedModal isOpen={!!iconPickerSubgroup} onClose={() => setIconPickerSubgroup(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Change Subgroup Icon</h3>
              <button onClick={() => setIconPickerSubgroup(null)}><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Paste icon URL..." className="text-xs flex-1" id="subgroup-icon-input" />
              <label className="px-3 py-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 flex items-center">
                <UploadIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) { const reader = new FileReader(); reader.onload = ev => { const url = ev.target?.result as string; if (iconPickerSubgroup.group === '__groupicon__') { saveGroupIcons({ ...groupIcons, [iconPickerSubgroup.name]: url }); } else if (iconPickerSubgroup.data) { updateSubgroup.mutate({ ...iconPickerSubgroup.data, icon: url }); } else { createSubgroup.mutate({ id: Date.now().toString(), name: iconPickerSubgroup.name, group: iconPickerSubgroup.group, icon: url, position: 0 }); } setIconPickerSubgroup(null); }; reader.readAsDataURL(file); }
                }} />
              </label>
              <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[13px]" onClick={() => {
                const val = (document.getElementById('subgroup-icon-input') as HTMLInputElement)?.value.trim();
                if (val) { if (iconPickerSubgroup.group === '__groupicon__') { saveGroupIcons({ ...groupIcons, [iconPickerSubgroup.name]: val }); } else if (iconPickerSubgroup.data) { updateSubgroup.mutate({ ...iconPickerSubgroup.data, icon: val }); } else { createSubgroup.mutate({ id: Date.now().toString(), name: iconPickerSubgroup.name, group: iconPickerSubgroup.group, icon: val, position: 0 }); } } setIconPickerSubgroup(null);
              }}>Set</button>
            </div>
            {(savedIcons.length > 0 || bookmarks.some((b: any) => b.icon)) && (
              <div className="grid grid-cols-8 gap-2 p-2 border rounded-lg max-h-40 overflow-y-auto">
                {Array.from(new Set([...savedIcons, ...bookmarks.map((b: any) => b.icon).filter(Boolean)])).map((icon: string, idx: number) => (
                  <img key={idx} src={icon} className="w-10 h-10 cursor-pointer hover:ring-2 ring-blue-500 rounded border" onClick={() => {
                    if (iconPickerSubgroup.group === '__groupicon__') { saveGroupIcons({ ...groupIcons, [iconPickerSubgroup.name]: icon }); } else if (iconPickerSubgroup.data) { updateSubgroup.mutate({ ...iconPickerSubgroup.data, icon }); } else { createSubgroup.mutate({ id: Date.now().toString(), name: iconPickerSubgroup.name, group: iconPickerSubgroup.group, icon, position: 0 }); } setIconPickerSubgroup(null);
                  }} />
                ))}
              </div>
            )}
          </div>
        </AnimatedModal>
      )}
      {editModal && (
        <AnimatedModal isOpen={!!editModal} onClose={() => setEditModal(null)} closeOnBackdrop={false}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">{editModal.id && bookmarks.find((b: any) => b.id === editModal.id) ? 'Edit Bookmark' : 'Add Bookmark'}</h3>
              <button onClick={() => setEditModal(null)}><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Title</label>
                <Input value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">URL</label>
                <Input value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} className="mt-1" onBlur={async (e) => {
                  const url = e.target.value.trim();
                  if (!url) return;
                  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                  try {
                    const meta = await (await apiFetch(`/api/metadata?url=${encodeURIComponent(fullUrl)}`)).json();
                    if (meta.title && !tempTitle) setTempTitle(meta.title);
                    if (meta.icon && !tempIcon) setTempIcon(meta.icon);
                    if (meta.description && !tempDescription) setTempDescription(meta.description);
                    if (!tempUrl.startsWith('http')) setTempUrl(fullUrl);
                  } catch {
                    // Fallback to Google favicons if metadata fetch fails
                    if (!tempIcon) setTempIcon(`https://www.google.com/s2/favicons?domain=${new URL(fullUrl).hostname}&sz=64`);
                  }
                }} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Icon</label>
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center gap-2 flex-1">
                    {tempIcon && (
                      <img 
                        src={tempIcon} 
                        alt="Icon preview" 
                        className="w-8 h-8 rounded border bg-white p-1 shrink-0" 
                        onError={(e) => {
                          e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${tempUrl}&sz=64`;
                        }}
                      />
                    )}
                    <Input 
                      value={tempIcon} 
                      onChange={(e) => setTempIcon(e.target.value)} 
                      className="flex-1" 
                      placeholder="Icon URL or upload file"
                    />
                  </div>
                  <label className="px-3 py-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 flex items-center">
                    <UploadIcon className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { const reader = new FileReader(); reader.onload = ev => setTempIcon(ev.target?.result as string); reader.readAsDataURL(file); }
                    }} />
                  </label>
                  <Button size="sm" className="px-3" onClick={async () => { 
                    const url = tempUrl.trim(); 
                    if (!url) return; 
                    const fullUrl = url.startsWith('http') ? url : `https://${url}`; 
                    try { 
                      const meta = await (await apiFetch(`/api/metadata?url=${encodeURIComponent(fullUrl)}`)).json(); 
                      setTempIcon(meta.icon || `https://www.google.com/s2/favicons?domain=${fullUrl}&sz=64`); 
                    } catch { 
                      setTempIcon(`https://www.google.com/s2/favicons?domain=${fullUrl}&sz=64`); 
                    } 
                  }} disabled={!tempUrl.trim()}>
                    🔍
                  </Button>
                </div>
                <div className="grid grid-cols-8 gap-2 mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg max-h-32 overflow-y-auto">
                  {Array.from(new Set([...savedIcons, ...bookmarks.map((b: any) => b.icon).filter(Boolean)])).map((icon: string, idx: number) => (
                    <img key={idx} src={icon} className="w-8 h-8 cursor-pointer hover:ring-2 ring-blue-500 rounded border" onClick={() => setTempIcon(icon)} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Tags</label>
                <Input value={tempTags} onChange={(e) => setTempTags(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Description</label>
                <Textarea value={tempDescription} onChange={(e) => setTempDescription(e.target.value)} className="mt-1 resize-none" rows={3} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Notes</label>
                <Textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} className="mt-1 resize-none" rows={3} />
              </div>
            </div>
              <Button onClick={() => {
                if (editModal.id && bookmarks.find((b: any) => b.id === editModal.id)) {
                  updateBookmark.mutate({
                    ...editModal,
                    title: tempTitle,
                    url: tempUrl,
                    tags: tempTags,
                    icon: tempIcon,
                    description: tempDescription,
                    notes: tempNotes
                  });
                } else {
                  createBookmark.mutate({
                    ...editModal,
                    title: tempTitle,
                    url: tempUrl,
                    tags: tempTags,
                    icon: tempIcon,
                    description: tempDescription,
                    notes: tempNotes
                  });
                }
                setEditModal(null);
              }} disabled={updateBookmark.isPending || createBookmark.isPending} className="w-full bg-red-500 hover:bg-red-600 text-white">
                {updateBookmark.isPending || createBookmark.isPending ? 'Saving...' : 'UPDATE'}
              </Button>
          </div>
        </AnimatedModal>
      )}
      {showSubgroupModal && (
        <AnimatedModal isOpen={showSubgroupModal} onClose={() => setShowSubgroupModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Create Subgroup</h3>
              <button onClick={() => setShowSubgroupModal(false)}><XIcon className="w-5 h-5" /></button>
            </div>
            <Input placeholder="Subgroup name..." value={subgroupName} onChange={(e) => setSubgroupName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && subgroupName.trim()) { console.log('Creating subgroup:', subgroupName, 'for bookmarks:', Array.from(selectedBookmarks)); const ids = Array.from(selectedBookmarks); const items = ids.map(id => bookmarks.find((b: any) => b.id === id)).filter(Boolean); console.log('Found items:', items); bulkUpdateBookmarks.mutate(items.map(b => ({ ...b, subgroup: subgroupName.trim() }))); setSelectedBookmarks(new Set()); setShowSubgroupModal(false); setSubgroupName(""); } }} autoFocus />
            <div className="flex gap-2">
              <Button onClick={() => { setShowSubgroupModal(false); setSubgroupName(""); }} variant="secondary" size="sm" className="flex-1">Cancel</Button>
              <Button onClick={() => { 
                console.log('Create button clicked!');
                console.log('Stored selected bookmarks:', Array.from(selectedBookmarksForSubgroup));
                
                if (!subgroupName.trim()) {
                  console.log('No subgroup name provided');
                  return;
                }
                
                if (selectedBookmarksForSubgroup.size === 0) {
                  alert('No bookmarks were selected!');
                  return;
                }
                
                // Check if subgroup already exists
                const existingSubgroup = subgroups.find((sg: any) => sg.name === subgroupName.trim() && sg.group === bookmarks.find((b: any) => selectedBookmarksForSubgroup.has(b.id))?.group);
                if (!existingSubgroup) {
                  // Create subgroup first
                  const firstBookmark = bookmarks.find((b: any) => selectedBookmarksForSubgroup.has(b.id));
                  if (firstBookmark) {
                    createSubgroup.mutate({ 
                      id: Date.now().toString(), 
                      name: subgroupName.trim(), 
                      group: firstBookmark.group, 
                      position: 0 
                    });
                  }
                }
                
                Array.from(selectedBookmarksForSubgroup).forEach(bookmarkId => {
                  const bookmark = bookmarks.find((b: any) => b.id === bookmarkId);
                  if (bookmark) {
                    console.log('Updating bookmark:', bookmark.id, bookmark.title);
                    updateBookmark.mutate({ ...bookmark, subgroup: subgroupName.trim() });
                  }
                });
                
                setSelectedBookmarks(new Set()); 
                setSelectedBookmarksForSubgroup(new Set());
                setShowSubgroupModal(false); 
                setSubgroupName(""); 
              }} disabled={updateBookmark.isPending} size="sm" className="flex-1">
                {updateBookmark.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </AnimatedModal>
      )}
      {groupContextMenu && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => { setGroupContextMenu(null); setDisplaySettingsGroup(null); }} />
      )}
      {groupContextMenu && (
        <div className={`fixed z-50 bg-white dark:bg-slate-900 shadow-2xl rounded-lg border animate-in fade-in zoom-in-95 duration-150 w-72`} style={{ top: groupContextMenu.y + 600 > window.innerHeight ? groupContextMenu.y - 600 : groupContextMenu.y, left: Math.min(groupContextMenu.x, window.innerWidth - 320) }} onClick={(e) => e.stopPropagation()}>
          {displaySettingsGroup ? (() => {
            const ds = groupDisplaySettings[displaySettingsGroup] || { viewMode: 'list', iconSize: 'small', visibleCount: 'all' };
            const update = (patch: Partial<typeof ds>) => { const next = { ...groupDisplaySettings, [displaySettingsGroup]: { ...ds, ...patch } }; setGroupDisplaySettings(next); saveSettings.mutate({ groupDisplaySettings: next }); };
            return (<>
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <div className="flex items-center gap-3">
                  <button onClick={() => setDisplaySettingsGroup(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ArrowLeftIcon className="w-4 h-4 text-slate-500" /></button>
                  <span className="text-base font-semibold text-slate-800 dark:text-slate-100">Display settings</span>
                </div>
                <button onClick={() => { setDisplaySettingsGroup(null); setGroupContextMenu(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><XIcon className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Show Bookmarks</label>
                {(['list', 'detailed', 'icons', 'cloud'] as const).map(mode => (
                  <label key={mode} className={`flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer text-[13px] ${ds.viewMode === mode ? 'bg-blue-50 dark:bg-blue-900/20 text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <input type="radio" name="viewMode" checked={ds.viewMode === mode} onChange={() => update({ viewMode: mode })} className="accent-primary w-3.5 h-3.5" />
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </label>
                ))}
              </div>
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Icon Size</label>
                <select value={ds.iconSize} onChange={(e) => update({ iconSize: e.target.value })} className="w-full px-3 py-2 text-[13px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="px-3 py-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Visible Bookmarks</label>
                <select value={ds.visibleCount} onChange={(e) => update({ visibleCount: e.target.value })} className="w-full px-3 py-2 text-[13px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  <option value="all">All</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div className="px-3 py-2 border-t">
                <button onClick={() => { const next = { ...groupDisplaySettings }; Object.keys(next).forEach(k => { next[k] = { ...ds }; }); setGroupDisplaySettings(next); saveSettings.mutate({ groupDisplaySettings: next }); }} className="text-[13px] text-primary hover:underline">Apply to all groups</button>
              </div>
            </>);
          })() : (<>
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-base font-semibold text-slate-800 dark:text-slate-100">Group Settings</span>
            <button onClick={() => setGroupContextMenu(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <XIcon className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <button onClick={() => { setEditModal({ id: Date.now().toString(), title: '', url: '', group: groupContextMenu.group, tags: '', favorite: false, position: bookmarks.length, notes: '', icon: '', description: '' }); setGroupContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
            <PlusIcon className="w-4 h-4 text-green-500" /> Add Bookmark
          </button>
          {/* Group Color */}
          <div className="px-4 py-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Group Color</label>
            <select value={groupColors[groupContextMenu.group] || '#64748b'} onChange={(e) => { const c = { ...groupColors, [groupContextMenu.group]: e.target.value }; setGroupColors(c); saveSettings.mutate({ groupColors: c }); }} className="w-full px-3 py-2 text-[13px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" style={{ color: groupColors[groupContextMenu.group] || '#64748b' }}>
              <option value="#64748b" style={{color:'#64748b'}}>Gray</option>
              <option value="#3b82f6" style={{color:'#3b82f6'}}>Blue</option>
              <option value="#10b981" style={{color:'#10b981'}}>Green</option>
              <option value="#f59e0b" style={{color:'#f59e0b'}}>Orange</option>
              <option value="#ef4444" style={{color:'#ef4444'}}>Red</option>
              <option value="#8b5cf6" style={{color:'#8b5cf6'}}>Purple</option>
              <option value="#ec4899" style={{color:'#ec4899'}}>Pink</option>
              <option value="#06b6d4" style={{color:'#06b6d4'}}>Cyan</option>
            </select>
          </div>
          {/* Column */}
          <div className="px-4 py-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Column</label>
            <select value={groupColumns[groupContextMenu.group] || 0} onChange={(e) => { const c = { ...groupColumns, [groupContextMenu.group]: Number(e.target.value) }; setGroupColumns(c); saveSettings.mutate({ groupColumns: c }); }} className="w-full px-3 py-2 text-[13px] border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
              {Array.from({ length: columns }, (_, i) => <option key={i} value={i}>Column {i + 1}</option>)}
            </select>
          </div>
          {/* Group Icon */}
          <div className="px-4 py-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Group Icon</label>
            <div className="flex gap-1.5">
              <input id="grp-icon-input" defaultValue={groupIcons[groupContextMenu.group] || ''} placeholder="Paste URL..." className="flex-1 text-[13px] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 min-w-0" />
              <label className="px-2 py-1 bg-secondary rounded cursor-pointer hover:bg-secondary/80 flex items-center shrink-0">
                <UploadIcon className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const url = ev.target?.result as string; saveGroupIcons({ ...groupIcons, [groupContextMenu.group]: url }); setGroupContextMenu(null); }; reader.readAsDataURL(file); }} />
              </label>
              <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[13px] shrink-0" onClick={() => { const val = (document.getElementById('grp-icon-input') as HTMLInputElement)?.value.trim(); const updated = { ...groupIcons }; if (val) updated[groupContextMenu.group] = val; else delete updated[groupContextMenu.group]; saveGroupIcons(updated); setGroupContextMenu(null); }}>Set</button>
            </div>
            {(savedIcons.length > 0 || bookmarks.some((b: any) => b.icon)) && (
              <div className="grid grid-cols-8 gap-1 mt-1.5 p-1 border rounded max-h-24 overflow-y-auto">
                {Array.from(new Set([...savedIcons, ...bookmarks.map((b: any) => b.icon).filter(Boolean)])).map((icon: string, idx: number) => (
                  <img key={idx} src={icon} className={`w-6 h-6 cursor-pointer rounded hover:ring-2 ring-blue-500 ${groupIcons[groupContextMenu.group] === icon ? 'ring-2 ring-blue-500' : ''}`} onClick={() => { saveGroupIcons({ ...groupIcons, [groupContextMenu.group]: icon }); setGroupContextMenu(null); }} />
                ))}
              </div>
            )}
            {groupIcons[groupContextMenu.group] && (
              <button className="text-[12px] text-red-400 hover:text-red-600 mt-1.5" onClick={() => { const u = { ...groupIcons }; delete u[groupContextMenu.group]; saveGroupIcons(u); setGroupContextMenu(null); }}>Remove icon</button>
            )}
          </div>
          {/* Rename */}
          <div className="px-4 py-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Rename</label>
            <div className="flex gap-1.5">
              <input id="grp-rename-input" defaultValue={groupContextMenu.group} className="flex-1 text-[13px] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800" onKeyDown={(e) => { if (e.key !== 'Enter') return; const val = (e.target as HTMLInputElement).value.trim(); renameGroup(groupContextMenu.group, val); setGroupContextMenu(null); }} />
              <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[13px]" onClick={() => { const val = (document.getElementById('grp-rename-input') as HTMLInputElement)?.value.trim(); if (val) renameGroup(groupContextMenu.group, val); setGroupContextMenu(null); }}>OK</button>
            </div>
          </div>
          <button onClick={() => { const c = { ...groupColors, [groupContextMenu.group]: '#64748b' }; setGroupColors(c); saveSettings.mutate({ groupColors: c }); setGroupContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300">Reset Color</button>
          <button onClick={() => { getGroupBookmarks(groupContextMenu.group).forEach((b: any) => window.open(b.url, '_blank')); setGroupContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300">Open All</button>
          <button onClick={() => { const newName = `${groupContextMenu.group} - copy`; if (groups.includes(newName)) return; updateGroups.mutate([...groups, newName]); getGroupBookmarks(groupContextMenu.group).forEach((b: any) => createBookmark.mutate({ ...b, id: Date.now().toString() + Math.random(), group: newName })); setGroupContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300">Duplicate Group</button>
          <button onClick={async () => { try { const text = await navigator.clipboard.readText(); if (text.startsWith('http')) { createBookmark.mutate({ id: Date.now().toString(), title: text.split('/')[2] || text, url: text, group: groupContextMenu.group, tags: '', favorite: false, position: bookmarks.length, notes: '', icon: '', description: '' }); } } catch {} setGroupContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300">Paste URL from Clipboard</button>
          <button onClick={async () => { const items = getGroupBookmarks(groupContextMenu.group); for (const b of items) { try { const res = await apiFetch(`/api/metadata?url=${encodeURIComponent(b.url)}`); console.log(b.url, res.ok ? 'ok' : 'dead'); } catch {} } setGroupContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300">Check Link Health</button>
          <button onClick={() => { setConfirmDialog({ title: 'Delete Group', message: `Delete "${groupContextMenu.group}" and all its bookmarks?`, onConfirm: () => { const ids = bookmarks.filter((b: any) => b.group === groupContextMenu.group).map((b: any) => b.id); if (ids.length) bulkDeleteBookmarks.mutate(ids); updateGroups.mutate(groups.filter((g: string) => g !== groupContextMenu.group)); } }); setGroupContextMenu(null); }} className="w-full text-left px-4 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg text-[13px] flex items-center gap-3">
            <TrashIcon className="w-4 h-4" /> Delete Group
          </button>
          <div className="border-t my-0.5"></div>
          <button onClick={() => setDisplaySettingsGroup(groupContextMenu.group)} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 flex items-center gap-3">
            <MonitorIcon className="w-4 h-4 text-blue-500" /> Display Settings
          </button>
          </>)}
        </div>
      )}
      {renamingSubgroup && (
        <AnimatedModal isOpen={!!renamingSubgroup} onClose={() => setRenamingSubgroup(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Rename Subgroup</h3>
              <button onClick={() => setRenamingSubgroup(null)}><XIcon className="w-5 h-5" /></button>
            </div>
            <Input placeholder="Subgroup name..." value={renameSubgroupValue} onChange={(e) => setRenameSubgroupValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && renameSubgroupValue.trim() && (() => { const bms = bookmarks.filter((b: any) => b.subgroup === renamingSubgroup.name && b.group === renamingSubgroup.group); bulkUpdateBookmarks.mutate(bms.map((b: any) => ({ ...b, subgroup: renameSubgroupValue.trim() }))); if (renamingSubgroup.data) { updateSubgroup.mutate({ ...renamingSubgroup.data, name: renameSubgroupValue.trim() }); } setRenamingSubgroup(null); })()} autoFocus />
            <div className="flex gap-2">
              <Button onClick={() => setRenamingSubgroup(null)} variant="secondary" size="sm" className="flex-1">Cancel</Button>
              <Button onClick={() => { if (!renameSubgroupValue.trim()) return; const bms = bookmarks.filter((b: any) => b.subgroup === renamingSubgroup.name && b.group === renamingSubgroup.group); bulkUpdateBookmarks.mutate(bms.map((b: any) => ({ ...b, subgroup: renameSubgroupValue.trim() }))); if (renamingSubgroup.data) { updateSubgroup.mutate({ ...renamingSubgroup.data, name: renameSubgroupValue.trim() }); } setRenamingSubgroup(null); }} size="sm" className="flex-1">Rename</Button>
            </div>
          </div>
        </AnimatedModal>
      )}
      {htmlImportPreview && (
        <AnimatedModal isOpen={!!htmlImportPreview} onClose={() => setHtmlImportPreview(null)} zClass="z-[60]">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Import Bookmarks ({htmlImportPreview.filter(b => b.selected).length} / {htmlImportPreview.length} selected)</h3>
              <button onClick={() => setHtmlImportPreview(null)}><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => setHtmlImportPreview(htmlImportPreview.map(b => ({ ...b, selected: true })))} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200">Select All</button>
              <button onClick={() => setHtmlImportPreview(htmlImportPreview.map(b => ({ ...b, selected: false })))} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200">Deselect All</button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {Array.from(new Set(htmlImportPreview.map(b => b.group))).map(grp => {
                const grpItems = htmlImportPreview.map((b, i) => ({ ...b, i })).filter(b => b.group === grp);
                const allSelected = grpItems.every(b => b.selected);
                return (
                  <div key={grp}>
                    <label className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded cursor-pointer">
                      <input type="checkbox" checked={allSelected} onChange={() => setHtmlImportPreview(htmlImportPreview.map((b, i) => grpItems.find(g => g.i === i) ? { ...b, selected: !allSelected } : b))} className="shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-1">{grp}</span>
                      <span className="text-[10px] text-slate-400">{grpItems.filter(b => b.selected).length}/{grpItems.length}</span>
                    </label>
                    {grpItems.map(({ i, ...b }) => (
                      <label key={i} className="flex items-center gap-2 px-2 py-1 pl-6 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        <input type="checkbox" checked={b.selected} onChange={() => setHtmlImportPreview(htmlImportPreview.map((x, j) => j === i ? { ...x, selected: !x.selected } : x))} className="shrink-0" />
                        <img src={b.icon} className="w-4 h-4 shrink-0" onError={e => { e.currentTarget.style.display = 'none'; }} />
                        <span className="text-sm truncate flex-1 text-slate-700 dark:text-slate-200">{b.title || b.url}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{b.url}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setHtmlImportPreview(null)}>Cancel</Button>
              <Button size="sm" className="flex-1" disabled={htmlImporting || htmlImportPreview.every(b => !b.selected)} onClick={async () => {
                setHtmlImporting(true);
                const selected = htmlImportPreview.filter(x => x.selected);
                const importGroups = Array.from(new Set(selected.map(b => b.group || 'General')));
                const newGroups = importGroups.filter(g => !(groups as string[]).includes(g));
                if (newGroups.length > 0) {
                  updateGroups.mutate([...groups, ...newGroups]);
                }
                for (const b of selected) {
                  await apiFetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Date.now().toString() + Math.random(), title: b.title || b.url, url: b.url, group: b.group || 'General', tags: '', favorite: false, position: bookmarks.length, notes: '', icon: b.icon, description: '' }) });
                }
                queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
                setHtmlImporting(false);
                setHtmlImportPreview(null);
              }}>{htmlImporting ? 'Importing...' : `Import ${htmlImportPreview.filter(b => b.selected).length}`}</Button>
            </div>
          </div>
        </AnimatedModal>
      )}
      {promptDialog && (
        <AnimatedModal isOpen={!!promptDialog} onClose={() => setPromptDialog(null)} zClass="z-[70]">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold uppercase text-slate-500">{promptDialog.title}</h3>
              <button onClick={() => setPromptDialog(null)}><XIcon className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <input
              autoFocus
              defaultValue={promptDialog.defaultValue}
              placeholder={promptDialog.placeholder}
              id="prompt-dialog-input"
              onKeyDown={(e) => { if (e.key === 'Enter') { const val = (document.getElementById('prompt-dialog-input') as HTMLInputElement).value.trim(); if (val) { promptDialog.onConfirm(val); setPromptDialog(null); } } if (e.key === 'Escape') setPromptDialog(null); }}
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]"
            />
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPromptDialog(null)}>Cancel</Button>
              <Button size="sm" className="flex-1" onClick={() => { const val = (document.getElementById('prompt-dialog-input') as HTMLInputElement).value.trim(); if (val) { promptDialog.onConfirm(val); setPromptDialog(null); } }}>Confirm</Button>
            </div>
          </div>
        </AnimatedModal>
      )}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        groups={groups}
        onSaveGroups={(g) => updateGroups.mutate(g)}
        customIcons={Array.from(new Set([...savedIcons, ...bookmarks.map((b: any) => b.icon).filter(Boolean)]))}
        onSaveIcons={() => {}}
        accentColor={accentColor}
        onSaveColor={(color) => {
          setAccentColor(color);
          applyAccentColor(color);

          saveSettings.mutate({ accentColor: color });
        }}
        columns={columns}
        onSaveColumns={(cols) => {
          setColumns(cols);

          saveSettings.mutate({ bmColumns: cols });
        }}
        rows={rows}
        onSaveRows={(r) => {
          setRows(r);

          saveSettings.mutate({ bmRows: r });
        }}
        fontSize={fontSize}
        onSaveFontSize={(size) => {
          setFontSize(size);

          saveSettings.mutate({ fontSize: size });
        }}
        fontFamily={fontFamily}
        onSaveFontFamily={(family) => {
          setFontFamily(family);

          saveSettings.mutate({ fontFamily: family });
        }}
        groupColumns={groupColumns}
        onSaveGroupColumns={(cols) => {
          setGroupColumns(cols);

          saveSettings.mutate({ groupColumns: cols });
        }}
        groupColors={groupColors}
        onSaveGroupColors={(colors) => {
          setGroupColors(colors);

          saveSettings.mutate({ groupColors: colors });
        }}
        onExportJSON={async () => {
          const data = await (await apiFetch('/api/backup')).json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); const d = new Date(); a.download = `go-home-backup-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`; a.click();
        }}
        onImportJSON={async (file) => {
          const text = await file.text();
          const data = JSON.parse(text);
          // Full backup — has tasks/notes/etc, route to restore
          if (data.tasks || data.notes || data.stickyNotes) {
            if (!confirm('This looks like a full backup. Merge with existing data?')) return;
            setRestoreOverlay(true);
            try {
              await apiFetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
              await queryClient.invalidateQueries();
              await queryClient.refetchQueries();
            } finally {
              setRestoreOverlay(false);
            }
            return;
          }
          const items: any[] = Array.isArray(data) ? data : (data.bookmarks ?? []);
          setHtmlImportPreview(items.filter(b => b.url).map(b => { try { const icon = b.icon || `https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=64`; return { title: b.title || b.url, url: b.url, icon, group: b.group || 'General', selected: true }; } catch { return null; } }).filter(Boolean) as any[]);
        }}
        onRestoreJSON={async (file) => {
          const text = await file.text();
          return new Promise<void>((resolve) => {
            setConfirmDialog({
              title: 'Restore Backup',
              message: 'This will merge backup data with your existing data. Continue?',
              onConfirm: async () => {
                setRestoreOverlay(true);
                try {
                  const data = JSON.parse(text);
                  await apiFetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                  await queryClient.invalidateQueries();
                  await queryClient.refetchQueries();
                } finally {
                  setRestoreOverlay(false);
                }
                resolve();
              },
            });
          });
        }}
        backupPath={backupPath}
        onSaveBackupPath={(p) => { setBackupPath(p); saveSettings.mutate({ backupPath: p }); }}
        autoBackup={autoBackup}
        onToggleAutoBackup={(v) => { setAutoBackup(v); saveSettings.mutate({ autoBackup: v }); }}
        onImportCSV={async (file) => {
          const text = await file.text();
          const [header, ...rows] = text.trim().split('\n');
          const cols = header.split(',').map((c: string) => c.trim().toLowerCase());
          const parsed = rows.map(row => { const vals = row.split(','); const b: any = {}; cols.forEach((c, i) => { b[c] = vals[i]?.trim().replace(/^"|"$/g, '') ?? ''; }); return b; }).filter(b => b.url);
          setHtmlImportPreview(parsed.map(b => ({ title: b.title || b.url, url: b.url, icon: `https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=64`, group: b.group || 'General', selected: true })));
        }}
        onImportHTML={async (file) => {
          const text = await file.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const links = Array.from(doc.querySelectorAll('a[href]'));
          const parsed = links
            .map(link => ({ url: link.getAttribute('href') || '', title: link.textContent?.trim() || '', icon: link.getAttribute('icon') || '' }))
            .filter(b => b.url.startsWith('http'))
            .map(b => ({ ...b, icon: b.icon || `https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=64`, group: 'General', selected: true }));
          setHtmlImportPreview(parsed);
        }}
        savedIcons={savedIcons}
        onDeleteIcon={async (icon) => { await apiFetch('/api/icons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ icon }) }); queryClient.invalidateQueries({ queryKey: ['icons'] }); }}
        onIconAdded={() => queryClient.invalidateQueries({ queryKey: ['icons'] })}
        bookmarkIcons={bookmarks.map((b: any) => b.icon).filter(Boolean)}
        groupIcons={groupIcons}
        subgroupIcons={subgroups.map((s: any) => s.icon).filter(Boolean)}
        showClock={showClock}
        onToggleClock={(v) => { setShowClock(v); saveSettings.mutate({ showClock: v }); }}
        hideGroupBorder={hideGroupBorder}
        onToggleGroupBorder={(v) => { setHideGroupBorder(v); saveSettings.mutate({ hideGroupBorder: v }); }}
        hideWidgetBorder={hideWidgetBorder}
        onToggleWidgetBorder={(v) => { setHideWidgetBorder(v); saveSettings.mutate({ hideWidgetBorder: v }); }}
        groupOpacity={groupOpacity}
        onSaveGroupOpacity={(v) => { setGroupOpacity(v); saveSettings.mutate({ groupOpacity: v }); }}
        subgroupOpacity={subgroupOpacity}
        onSaveSubgroupOpacity={(v) => { setSubgroupOpacity(v); saveSettings.mutate({ subgroupOpacity: v }); }}
        subgroupBmOpacity={subgroupBmOpacity}
        onSaveSubgroupBmOpacity={(v) => { setSubgroupBmOpacity(v); saveSettings.mutate({ subgroupBmOpacity: v }); }}
        widgetOpacity={widgetOpacity}
        onSaveWidgetOpacity={(v) => { setWidgetOpacity(v); saveSettings.mutate({ widgetOpacity: v }); }}
        showSubgroupsOnly={showSubgroupsOnly}
        onToggleSubgroupsOnly={(v) => { setShowSubgroupsOnly(v); saveSettings.mutate({ showSubgroupsOnly: v }); }}
        showTopButtons={showTopButtons}
        onToggleTopButtons={(v) => { setShowTopButtons(v); saveSettings.mutate({ showTopButtons: v }); }}
        onRenameGroup={(oldName, newName) => {
          const updatedBookmarks = bookmarks.map((b: any) => b.group === oldName ? { ...b, group: newName } : b);
          bulkUpdateBookmarks.mutate(updatedBookmarks);
        }}
        onRestoreFromServer={async (filename) => {
          setRestoreOverlay(true);
          try {
            const r = await apiFetch(`/api/backup/download?file=${encodeURIComponent(filename)}`);
            const data = await r.json();
            await apiFetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            await queryClient.invalidateQueries();
            await queryClient.refetchQueries();
          } finally {
            setRestoreOverlay(false);
          }
        }}
        onConfirm={(opts) => setConfirmDialog(opts)}
        bgImage={bgImage}
        onSaveBgImage={(url) => { setBgImage(url); saveSettings.mutate({ bgImage: url }); }}
        bgOpacity={bgOpacity}
        onSaveBgOpacity={(v) => { setBgOpacity(v); saveSettings.mutate({ bgOpacity: v }); }}
        bgBlur={bgBlur}
        onSaveBgBlur={(v) => { setBgBlur(v); saveSettings.mutate({ bgBlur: v }); }}
        maintenanceMode={!!settings.maintenanceMode}
        onMaintenanceToggle={(v) => { saveSettings.mutate({ maintenanceMode: v }); queryClient.setQueryData(['settings'], { ...settings, maintenanceMode: v }); }}
        clearSearchOnClick={clearSearchOnClick}
        onToggleClearSearchOnClick={(v) => { setClearSearchOnClick(v); saveSettings.mutate({ clearSearchOnClick: v }); }}
      />
      {!search && stickyNotes.filter((note: any) => note.floating === false).map((note: any) => (
        <StickyEditor
          key={note.id}
          note={note}
          onSave={(content, title) => { updateStickyNote.mutate({ ...note, content, title, floating: true }); }}
          onClose={() => updateStickyNote.mutate({ ...note, floating: true })}
          onUpdateFont={(font) => updateStickyNote.mutate({ ...note, fontFamily: font })}
        />
      ))}
      {!search && widgets.filter((w: any) => w.floating).map((w: any) => (
        <WidgetPanel key={w.id} widget={w} tasks={allTasks} notes={allNotes} totalColumns={columns}
          onUpdate={(data) => updateWidget.mutate({ ...w, ...data })}
          onDelete={(id) => deleteWidget.mutate(id)} />
      ))}
      {!search && stickyNotes.filter((note: any) => note.floating !== false).map((note: any) => (
        <StickyNote
          key={note.id}
          note={note}
          onUpdate={(data) => updateStickyNote.mutate({ ...note, ...data })}
          onDelete={(id) => { const n = stickyNotes.find((s: any) => s.id === id); const hasContent = n?.content && n.content.replace(/<[^>]*>/g, '').trim(); if (hasContent) { setConfirmDialog({ title: 'Delete Sticky Note', message: 'This note has content. Are you sure you want to delete it?', onConfirm: () => deleteStickyNote.mutate(id) }); } else { deleteStickyNote.mutate(id); } }}
          onContextMenu={(e) => { e.preventDefault(); if (!admin) return; setContextMenu({ x: e.clientX, y: e.clientY, bookmark: { isSticky: true, note } }); }}
        />
      ))}
    </div>
    </>
  );
}
