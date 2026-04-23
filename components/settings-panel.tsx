"use client";


import { apiFetch } from "@/lib/api-fetch";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XIcon, PlusIcon, Edit2Icon, TrashIcon, UploadIcon, CheckIcon, GripVerticalIcon, UsersIcon, SettingsIcon, EyeIcon, EyeOffIcon, ShieldIcon, UserIcon, WrenchIcon, MonitorIcon, LogOutIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MoonIcon, SunIcon } from "lucide-react";
import { AnimatedModal } from "@/components/animated-modal";
import { getAuthUser } from "@/components/login-gate";
import { useStore } from "@/lib/store";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  groups: string[];
  onSaveGroups: (groups: string[]) => void;
  customIcons: string[];
  onSaveIcons: (icons: string[]) => void;
  accentColor: string;
  onSaveColor: (color: string) => void;
  columns: number;
  onSaveColumns: (n: number) => void;
  rows: number;
  onSaveRows: (n: number) => void;
  onImportJSON: (file: File) => void;
  onImportCSV: (file: File) => void;
  onImportHTML: (file: File) => void;
  onExportJSON: () => void;
  onRestoreJSON: (file: File) => Promise<void>;
  backupPath: string;
  onSaveBackupPath: (path: string) => void;
  autoBackup: boolean;
  onToggleAutoBackup: (v: boolean) => void;
  savedIcons: string[];
  onDeleteIcon: (icon: string) => void;
  onIconAdded: () => void;
  bookmarkIcons: string[];
  groupIcons: Record<string, string>;
  subgroupIcons: string[];
  fontSize: number;
  onSaveFontSize: (n: number) => void;
  fontFamily: string;
  onSaveFontFamily: (f: string) => void;
  groupColumns: Record<string, number>;
  onSaveGroupColumns: (cols: Record<string, number>) => void;
  groupColors: Record<string, string>;
  onSaveGroupColors: (colors: Record<string, string>) => void;
  onRenameGroup?: (oldName: string, newName: string) => void;
  showClock: boolean;
  onToggleClock: (v: boolean) => void;
  hideGroupBorder: boolean;
  onToggleGroupBorder: (v: boolean) => void;
  hideWidgetBorder: boolean;
  onToggleWidgetBorder: (v: boolean) => void;
  groupOpacity: number;
  onSaveGroupOpacity: (v: number) => void;
  subgroupOpacity: number;
  onSaveSubgroupOpacity: (v: number) => void;
  subgroupBmOpacity: number;
  onSaveSubgroupBmOpacity: (v: number) => void;
  widgetOpacity: number;
  onSaveWidgetOpacity: (v: number) => void;
  showSubgroupsOnly: boolean;
  onToggleSubgroupsOnly: (v: boolean) => void;
  showTopButtons: boolean;
  onToggleTopButtons: (v: boolean) => void;
  onRestoreFromServer: (filename: string) => Promise<void>;
  onConfirm: (opts: { title: string; message: string; onConfirm: () => void }) => void;
  bgImage: string;
  onSaveBgImage: (url: string) => void;
  bgOpacity: number;
  onSaveBgOpacity: (v: number) => void;
  bgBlur?: number;
  onSaveBgBlur?: (v: number) => void;
  onMaintenanceToggle?: (v: boolean) => void;
  maintenanceMode?: boolean;
  clearSearchOnClick?: boolean;
  onToggleClearSearchOnClick?: (v: boolean) => void;
}
const themeColors: Record<string, { hex: string; hsl: string }> = {
  blue:    { hex: "#2563eb", hsl: "221.2 83.2% 53.3%" },
  emerald: { hex: "#10b981", hsl: "160 60% 45%" },
  purple:  { hex: "#8b5cf6", hsl: "263 70% 65%" },
  rose:    { hex: "#f43f5e", hsl: "350 89% 60%" },
  amber:   { hex: "#f59e0b", hsl: "38 92% 50%" },
  red:     { hex: "#ef4444", hsl: "0 84% 60%" },
  orange:  { hex: "#f97316", hsl: "25 95% 53%" },
  cyan:    { hex: "#06b6d4", hsl: "189 94% 43%" },
};

export function applyAccentColor(color: string) {
  const c = themeColors[color];
  if (!c) return;
  document.documentElement.style.setProperty("--primary", c.hsl);
}

export function SettingsPanel({ isOpen, onClose, groups, onSaveGroups, customIcons, onSaveIcons, accentColor, onSaveColor, columns, onSaveColumns, rows, onSaveRows, onImportJSON, onImportCSV, onImportHTML, onExportJSON, onRestoreJSON, savedIcons, onDeleteIcon, bookmarkIcons, groupIcons: groupIconsProp, subgroupIcons, fontSize, onSaveFontSize, fontFamily, onSaveFontFamily, groupColumns, onSaveGroupColumns, groupColors, onSaveGroupColors, onRenameGroup, showClock, onToggleClock, hideGroupBorder, onToggleGroupBorder, hideWidgetBorder, onToggleWidgetBorder, groupOpacity, onSaveGroupOpacity, subgroupOpacity, onSaveSubgroupOpacity, subgroupBmOpacity, onSaveSubgroupBmOpacity, widgetOpacity, onSaveWidgetOpacity, showSubgroupsOnly, onToggleSubgroupsOnly, showTopButtons, onToggleTopButtons, backupPath, onSaveBackupPath, autoBackup, onToggleAutoBackup, onRestoreFromServer, onConfirm, onIconAdded, bgImage, onSaveBgImage, bgOpacity, onSaveBgOpacity, bgBlur, onSaveBgBlur, maintenanceMode, onMaintenanceToggle, clearSearchOnClick, onToggleClearSearchOnClick }: SettingsPanelProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingVal, setEditingVal] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newIconUrl, setNewIconUrl] = useState("");
  const [backupPathInput, setBackupPathInput] = useState(backupPath || './backups');
  const [backupStatus, setBackupStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [backupFiles, setBackupFiles] = useState<{ name: string; size: number }[] | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [viewBackup, setViewBackup] = useState<{ name: string; data: any } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');
  const authUser = getAuthUser();
  const isAdmin = authUser?.role === 'admin';
  const { theme, toggleTheme } = useStore();

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted && !restoring) return null;

  const saveGroupEdit = () => {
    if (editingIdx === null || !editingVal.trim()) return;
    const oldName = groups[editingIdx];
    const newName = editingVal.trim();
    const updated = [...groups];
    updated[editingIdx] = newName;
    onSaveGroups(updated);
    if (oldName !== newName) onRenameGroup?.(oldName, newName);
    setEditingIdx(null);
  };

  const deleteGroup = (i: number) => {
    onSaveGroups(groups.filter((_, idx) => idx !== i));
  };

  const addGroup = () => {
    if (!newGroup.trim() || groups.includes(newGroup.trim())) return;
    onSaveGroups([...groups, newGroup.trim()]);
    setNewGroup("");
  };

  const handleDrop = (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const updated = [...groups];
    const [moved] = updated.splice(dragIdx.current, 1);
    updated.splice(targetIdx, 0, moved);
    onSaveGroups(updated);
    dragIdx.current = null;
  };

  const addIconFromUrl = async () => {
    if (!newIconUrl.trim()) return;
    await apiFetch('/api/icons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ icon: newIconUrl.trim() }) });
    setNewIconUrl("");
    onIconAdded();
  };

  const addIconFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      await apiFetch('/api/icons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ icon: url }) });
      onIconAdded();
    };
    reader.readAsDataURL(file);
  };

  const usedIconSet = new Set([...bookmarkIcons, ...Object.values(groupIconsProp), ...subgroupIcons]);
  const orphanIcons = savedIcons.filter(icon => !usedIconSet.has(icon));

  return (
    <>
      {restoring && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[260px]">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Restoring backup…</p>
            <p className="text-xs text-slate-400 text-center">Please wait, do not close or refresh the page.</p>
          </div>
        </div>
      )}
      {mounted && (
      <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`relative w-96 bg-white dark:bg-slate-900 h-full shadow-2xl border-l dark:border-slate-800 overflow-y-auto transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Settings</h3>
            <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
          </div>

          {isAdmin && (
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'settings' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <SettingsIcon className="w-3.5 h-3.5" /> General
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'users' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <UsersIcon className="w-3.5 h-3.5" /> Users
              </button>
            </div>
          )}

          {activeTab === 'users' && isAdmin ? <UserManagement /> : (<>

          {/* Maintenance Mode */}
          {isAdmin && onMaintenanceToggle && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <WrenchIcon className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Maintenance Mode</span>
              </div>
              <button onClick={() => onMaintenanceToggle(!maintenanceMode)} className={`w-10 h-5 rounded-full transition-colors ${maintenanceMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )}

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <MoonIcon className="w-4 h-4 text-blue-400" /> : <SunIcon className="w-4 h-4 text-amber-500" />}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</span>
            </div>
            <button onClick={toggleTheme} className={`w-10 h-5 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Wallpaper */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase text-slate-400 block">Wallpaper</label>
            <div className="flex gap-2">
              <Input placeholder="Image URL..." value={bgImage} onChange={(e) => onSaveBgImage(e.target.value)} className="h-9 text-xs flex-1" />
              <label className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 flex items-center shrink-0">
                <UploadIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => onSaveBgImage(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }} />
              </label>
              {bgImage && <button onClick={() => onSaveBgImage('')} className="px-2 text-red-400 hover:text-red-600"><XIcon className="w-4 h-4" /></button>}
            </div>
            {bgImage && (<>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Image Opacity</span>
                  <span className="text-xs text-slate-400 tabular-nums">{Math.round(bgOpacity * 100)}%</span>
                </div>
                <input type="range" min="0.05" max="1" step="0.05" value={bgOpacity} onChange={(e) => onSaveBgOpacity(parseFloat(e.target.value))} className="w-full" />
              </div>
              {onSaveBgBlur && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Image Blur</span>
                  <span className="text-xs text-slate-400 tabular-nums">{bgBlur ?? 0}px</span>
                </div>
                <input type="range" min="0" max="20" step="1" value={bgBlur ?? 0} onChange={(e) => onSaveBgBlur(parseInt(e.target.value))} className="w-full" />
              </div>
              )}
            </>)}
          </div>

          {/* Accent Color */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase text-slate-400 block">Accent Color</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(themeColors).map(([color, { hex }]) => (
                <button
                  key={color}
                  onClick={() => { onSaveColor(color); applyAccentColor(color); }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${accentColor === color ? "border-white ring-2 ring-slate-400 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Navbar */}
          <div className="space-y-3 pt-4 border-t">
            <label className="text-xs font-bold uppercase text-slate-400 block">Navbar</label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Show Clock</span>
              <button onClick={() => onToggleClock(!showClock)} className={`w-10 h-5 rounded-full transition-colors ${showClock ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${showClock ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Show Group Borders</span>
              <button onClick={() => onToggleGroupBorder(!hideGroupBorder)} className={`w-10 h-5 rounded-full transition-colors ${!hideGroupBorder ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${!hideGroupBorder ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Show Widget Borders</span>
              <button onClick={() => onToggleWidgetBorder(!hideWidgetBorder)} className={`w-10 h-5 rounded-full transition-colors ${!hideWidgetBorder ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${!hideWidgetBorder ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Group Opacity</span>
                <span className="text-xs text-slate-400 tabular-nums">{Math.round(groupOpacity * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={groupOpacity} onChange={(e) => onSaveGroupOpacity(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Subgroup Opacity</span>
                <span className="text-xs text-slate-400 tabular-nums">{Math.round(subgroupOpacity * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={subgroupOpacity} onChange={(e) => onSaveSubgroupOpacity(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Subgroup Items Opacity</span>
                <span className="text-xs text-slate-400 tabular-nums">{Math.round(subgroupBmOpacity * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={subgroupBmOpacity} onChange={(e) => onSaveSubgroupBmOpacity(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Widget Opacity</span>
                <span className="text-xs text-slate-400 tabular-nums">{Math.round(widgetOpacity * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={widgetOpacity} onChange={(e) => onSaveWidgetOpacity(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Show Subgroups Only</span>
              <button onClick={() => onToggleSubgroupsOnly(!showSubgroupsOnly)} className={`w-10 h-5 rounded-full transition-colors ${showSubgroupsOnly ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${showSubgroupsOnly ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Show Top Buttons</span>
              <button onClick={() => onToggleTopButtons(!showTopButtons)} className={`w-10 h-5 rounded-full transition-colors ${showTopButtons ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${showTopButtons ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {onToggleClearSearchOnClick && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Clear Search on Click</span>
                <button onClick={() => onToggleClearSearchOnClick(!clearSearchOnClick)} className={`w-10 h-5 rounded-full transition-colors ${clearSearchOnClick ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${clearSearchOnClick ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            )}
          </div>

          {/* Layout */}
          <div className="space-y-3 pt-4 border-t">
            <label className="text-xs font-bold uppercase text-slate-400 block">Layout</label>
            {[{ label: "Columns", value: columns, min: 1, max: 12, onChange: onSaveColumns }, { label: "Rows (max visible)", value: rows, min: 1, max: 20, onChange: onSaveRows }, { label: "Font Size", value: fontSize, min: 10, max: 32, onChange: onSaveFontSize }].map(({ label, value, min, max, onChange }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-sm font-bold">−</button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
                  <button onClick={() => onChange(Math.min(max, value + 1))} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-sm font-bold">+</button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Font Family</span>
              <select value={fontFamily} onChange={(e) => onSaveFontFamily(e.target.value)} className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg border-none">
                <option value="system-ui">System</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="monospace">Monospace</option>
                <option value="Verdana">Verdana</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
              </select>
            </div>
          </div>

          {/* Group Management */}
          <div className="space-y-3 pt-4 border-t">
            <label className="text-xs font-bold uppercase text-slate-400 block">Groups</label>
            <div className="space-y-1">
              {groups.map((g, i) => (
                <div
                  key={g}
                  draggable
                  onDragStart={() => { dragIdx.current = i; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(i)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 group"
                >
                  <GripVerticalIcon className="w-3.5 h-3.5 text-slate-300 cursor-grab shrink-0" />
                  {editingIdx === i ? (
                    <>
                      <Input value={editingVal} onChange={(e) => setEditingVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveGroupEdit()} className="h-7 text-xs flex-1" autoFocus />
                      <button onClick={saveGroupEdit} className="text-green-500 hover:text-green-600"><CheckIcon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingIdx(null)} className="text-slate-400 hover:text-slate-600"><XIcon className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{g}</span>
                      <select 
                        value={groupColumns[g] || 0}
                        onChange={(e) => onSaveGroupColumns({ ...groupColumns, [g]: Number(e.target.value) })}
                        className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded border-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Array.from({ length: columns }, (_, i) => (
                          <option key={i} value={i}>Col {i + 1}</option>
                        ))}
                      </select>
                      <select 
                        value={groupColors[g] || '#64748b'}
                        onChange={(e) => onSaveGroupColors({ ...groupColors, [g]: e.target.value })}
                        className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded border-none"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: groupColors[g] || '#64748b' }}
                      >
                        <option value="#64748b" style={{ color: '#64748b' }}>Gray</option>
                        <option value="#3b82f6" style={{ color: '#3b82f6' }}>Blue</option>
                        <option value="#10b981" style={{ color: '#10b981' }}>Green</option>
                        <option value="#f59e0b" style={{ color: '#f59e0b' }}>Orange</option>
                        <option value="#ef4444" style={{ color: '#ef4444' }}>Red</option>
                        <option value="#8b5cf6" style={{ color: '#8b5cf6' }}>Purple</option>
                        <option value="#ec4899" style={{ color: '#ec4899' }}>Pink</option>
                        <option value="#06b6d4" style={{ color: '#06b6d4' }}>Cyan</option>
                      </select>
                      <button onClick={() => { setEditingIdx(i); setEditingVal(g); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500"><Edit2Icon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteGroup(i)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><TrashIcon className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGroup()} placeholder="New group name..." className="h-8 text-xs" />
              <Button size="sm" onClick={addGroup} className="h-8 px-3"><PlusIcon className="w-3.5 h-3.5" /></Button>
            </div>
          </div>

          {/* Import & Export */}
          <div className="space-y-3 pt-4 border-t">
            <label className="text-xs font-bold uppercase text-slate-400 block">Icon Library</label>
            <div className="flex gap-2">
              <Input value={newIconUrl} onChange={(e) => setNewIconUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addIconFromUrl()} placeholder="SVG code or URL" className="h-9 text-xs flex-1" />
              <Button size="sm" onClick={addIconFromUrl} className="h-9 px-3"><PlusIcon className="w-4 h-4" /></Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} className="h-9 px-3"><UploadIcon className="w-4 h-4" /></Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addIconFromFile(e.target.files[0])} />
            </div>
            {savedIcons.length > 0 && (
              <div className="grid grid-cols-6 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg max-h-60 overflow-y-auto">
                {savedIcons.map((icon, idx) => (
                  <div key={idx} className="relative">
                    <img src={icon} className={`w-10 h-10 rounded border ${!usedIconSet.has(icon) ? 'border-red-300 dark:border-red-700 opacity-50' : 'border-slate-200 dark:border-slate-700'}`} />
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteIcon(icon); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer z-10"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            {orphanIcons.length > 0 && (
              <button
                onClick={() => onConfirm({ title: 'Delete Orphan Icons', message: `Delete ${orphanIcons.length} unused icon(s) from the library?`, onConfirm: () => orphanIcons.forEach(icon => onDeleteIcon(icon)) })}
                className="w-full p-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center justify-between"
              >
                <span>Delete {orphanIcons.length} orphan icon{orphanIcons.length > 1 ? 's' : ''}</span>
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Import & Export */}
          <div className="space-y-3 pt-4 border-t">
            <label className="text-xs font-bold uppercase text-slate-400 block">Import & Export</label>
            <div className="flex flex-col gap-2">
              <label className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs hover:bg-slate-100 cursor-pointer">
                <span>Import Browser Bookmarks (HTML)</span><UploadIcon className="w-4 h-4" />
                <input type="file" accept=".html,.htm" className="hidden" onChange={(e) => e.target.files?.[0] && onImportHTML(e.target.files[0])} />
              </label>
              <label className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs hover:bg-slate-100 cursor-pointer">
                <span>Import JSON</span><UploadIcon className="w-4 h-4" />
                <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && onImportJSON(e.target.files[0])} />
              </label>
              <label className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs hover:bg-slate-100 cursor-pointer">
                <span>Import CSV</span><UploadIcon className="w-4 h-4" />
                <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onImportCSV(e.target.files[0])} />
              </label>
              <button onClick={onExportJSON} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs hover:bg-slate-100">
                <span>Export Full Backup (JSON)</span><span>⬇️</span>
              </button>
              <label className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs hover:bg-slate-100 cursor-pointer">
                <span>Restore Full Backup (JSON)</span><UploadIcon className="w-4 h-4" />
                <input type="file" accept=".json" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await onRestoreJSON(file);
                }} />
              </label>
            </div>
          </div>

          {/* Auto Backup */}
          <div className="space-y-3 pt-4 border-t">
            <label className="text-xs font-bold uppercase text-slate-400 block">Daily Auto Backup</label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Enable Daily Backup</span>
              <button onClick={() => onToggleAutoBackup(!autoBackup)} className={`w-10 h-5 rounded-full transition-colors ${autoBackup ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${autoBackup ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500">Backup folder path (inside Docker container)</span>
              <div className="flex gap-2">
                <Input value={backupPathInput} onChange={(e) => setBackupPathInput(e.target.value)} placeholder="./backups" className="h-8 text-xs flex-1" />
                <Button size="sm" className="h-8 px-3" onClick={() => onSaveBackupPath(backupPathInput)}>Save</Button>
              </div>
              <p className="text-[10px] text-slate-400">Mount this path in docker-compose to access backups on your host.</p>
            </div>
            <button
              onClick={async () => {
                setBackupStatus('loading');
                try {
                  const r = await apiFetch('/api/backup?scheduled=1&force=1');
                  if (r.ok) {
                    setBackupStatus('ok');
                    const list = await apiFetch(`/api/backup/list?t=${Date.now()}`);
                    setBackupFiles(list.ok ? await list.json() : []);
                  } else {
                    setBackupStatus('err');
                  }
                } catch { setBackupStatus('err'); }
                setTimeout(() => setBackupStatus('idle'), 3000);
              }}
              disabled={backupStatus === 'loading'}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs hover:bg-slate-100 flex items-center justify-between disabled:opacity-50"
            >
              <span>Backup Now</span>
              <span>{backupStatus === 'loading' ? '⏳' : backupStatus === 'ok' ? '✅' : backupStatus === 'err' ? '❌' : '💾'}</span>
            </button>
            <button
              onClick={async () => {
                setLoadingFiles(true);
                try {
                  const r = await apiFetch(`/api/backup/list?t=${Date.now()}`);
                  setBackupFiles(r.ok ? await r.json() : []);
                } catch { setBackupFiles([]); }
                setLoadingFiles(false);
              }}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs hover:bg-slate-100 flex items-center justify-between"
            >
              <span>View Backup Files</span>
              <span>{loadingFiles ? '⏳' : '📂'}</span>
            </button>
            {backupFiles && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {backupFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">No backup files found</p>
                ) : backupFiles.map(f => (
                  <div key={f.name} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">{f.name.replace('go-home-backup-', '').replace('.json', '')}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={async () => {
                          setViewLoading(true);
                          try {
                            const r = await apiFetch(`/api/backup/download?file=${encodeURIComponent(f.name)}`);
                            if (r.ok) setViewBackup({ name: f.name, data: await r.json() });
                          } catch {} finally { setViewLoading(false); }
                        }}
                        disabled={viewLoading}
                        className="flex-1 py-1 text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded disabled:opacity-50"
                      >👁 View</button>
                      <a
                        href={`/api/backup/download?file=${encodeURIComponent(f.name)}`}
                        download={f.name}
                        className="flex-1 text-center py-1 text-[10px] font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded"
                      >⬇ Download</a>
                      <button
                        onClick={() => {
                          onConfirm({ title: 'Restore Backup', message: `Restore from "${f.name}"? This will merge with existing data.`, onConfirm: async () => {
                            try { await onRestoreFromServer(f.name); } catch {}
                          }});
                        }}
                        className="flex-1 py-1 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 rounded"
                      >↩ Restore</button>
                      <button
                        onClick={() => {
                          onConfirm({ title: 'Delete Backup', message: `Delete "${f.name}"?`, onConfirm: async () => {
                            await apiFetch(`/api/backup/delete?file=${encodeURIComponent(f.name)}`, { method: 'DELETE' });
                            setBackupFiles(prev => prev?.filter(x => x.name !== f.name) ?? null);
                          }});
                        }}
                        className="flex-1 py-1 text-[10px] font-medium bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/60 text-red-600 dark:text-red-400 rounded"
                      >🗑 Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>)}
        </div>
      </div>
    </div>
      )}
    {viewLoading && (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[260px]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading backup…</p>
        </div>
      </div>
    )}
    {viewBackup && (
      <AnimatedModal isOpen={!!viewBackup} onClose={() => setViewBackup(null)} zClass="z-[60]">
        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-sm font-bold uppercase text-muted-foreground truncate">{viewBackup.name}</h3>
            <button onClick={() => setViewBackup(null)}><XIcon className="w-5 h-5" /></button>
          </div>
          <pre className="flex-1 overflow-auto text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-4 whitespace-pre-wrap break-words">{JSON.stringify(viewBackup.data, null, 2)}</pre>
        </div>
      </AnimatedModal>
    )}
    </>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<{ id: string; username: string; firstName: string; lastName: string; role: string; approved: boolean; createdAt: string }[]>([]);
  const [sessions, setSessions] = useState<{ id: string; username: string; ip: string; userAgent: string; loginAt: string; lastSeen: string }[]>([]);
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editRole, setEditRole] = useState('');
  const [showEditPass, setShowEditPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [migrateSource, setMigrateSource] = useState('');
  const [migrateTarget, setMigrateTarget] = useState('');
  const [migrateStatus, setMigrateStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [migrateResult, setMigrateResult] = useState('');
  const [migrateConfirm, setMigrateConfirm] = useState(false);

  const load = async () => {
    try {
      const [uRes, sRes] = await Promise.all([apiFetch('/api/users'), apiFetch('/api/sessions')]);
      if (uRes.ok) setUsers(await uRes.json());
      if (sRes.ok) setSessions(await sRes.json());
    } catch (e) { console.error('Failed to load users/sessions', e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addUser = async () => {
    setError('');
    if (!newUser.trim() || !newPass.trim()) return;
    const res = await apiFetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUser.trim(), password: newPass, role: newRole, firstName: newFirstName.trim(), lastName: newLastName.trim() }),
    });
    if (res.ok) { setNewUser(''); setNewPass(''); setNewRole('user'); setNewFirstName(''); setNewLastName(''); load(); }
    else { const d = await res.json(); setError(d.error || 'Failed'); }
  };

  const updateUser = async (id: string) => {
    const data: any = { id, firstName: editFirstName, lastName: editLastName };
    if (editUsername) data.username = editUsername;
    if (editPass) data.password = editPass;
    if (editRole) data.role = editRole;
    await apiFetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setEditId(null); setEditUsername(''); setEditFirstName(''); setEditLastName(''); setEditPass(''); setEditRole(''); setShowEditPass(false); load();
  };

  const deleteUser = async (id: string) => {
    await apiFetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  const kickSession = async (id: string) => {
    await apiFetch('/api/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  const approveUser = async (id: string) => {
    await apiFetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, approved: true }) });
    load();
  };

  const rejectUser = async (id: string) => {
    await apiFetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  const parseUA = (ua: string) => {
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0]?.split('/')[0] || 'Browser';
    const os = ua.match(/\(([^)]+)\)/)?.[1]?.split(';')[0] || 'Unknown OS';
    return `${browser} · ${os}`;
  };

  if (loading) return <div className="text-xs text-slate-400 text-center py-8">Loading users…</div>;

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div className="space-y-4">
      <label className="text-xs font-bold uppercase text-slate-400 block">User Management</label>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
            <label className="text-xs font-bold uppercase text-amber-500">Pending Approval ({pendingUsers.length})</label>
          </div>
          {pendingUsers.map(u => (
            <div key={u.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : u.username}</span>
                  <span className="text-[10px] text-slate-400">{u.username} · {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
                <button onClick={() => approveUser(u.id)} className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 text-emerald-600 dark:text-emerald-400" title="Approve">
                  <CheckCircleIcon className="w-4 h-4" />
                </button>
                <button onClick={() => rejectUser(u.id)} className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-600 dark:text-red-400" title="Reject">
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approved User list */}
      <div className="space-y-1.5">
        {approvedUsers.map(u => (
          <div key={u.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 group">
            {editId === u.id ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} placeholder="First Name" className="h-8 text-xs flex-1" />
                  <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} placeholder="Last Name" className="h-8 text-xs flex-1" />
                </div>
                <div className="flex items-center gap-2">
                  <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Username" className="h-8 text-xs flex-1" />
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="text-xs px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div className="relative">
                  <Input
                    type={showEditPass ? 'text' : 'password'}
                    value={editPass}
                    onChange={(e) => setEditPass(e.target.value)}
                    placeholder="New password (leave empty to keep)"
                    className="h-8 text-xs pr-8"
                  />
                  <button type="button" onClick={() => setShowEditPass(!showEditPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    {showEditPass ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs" onClick={() => updateUser(u.id)}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditId(null); setEditUsername(''); setEditFirstName(''); setEditLastName(''); setEditPass(''); setShowEditPass(false); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {u.role === 'admin' ? <ShieldIcon className="w-3.5 h-3.5 text-primary" /> : <UserIcon className="w-3.5 h-3.5 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : u.username}</span>
                  <span className="text-[10px] text-slate-400">{u.username} · {u.role}</span>
                </div>
                <button onClick={() => { setEditId(u.id); setEditUsername(u.username); setEditFirstName(u.firstName || ''); setEditLastName(u.lastName || ''); setEditRole(u.role); setEditPass(''); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500"><Edit2Icon className="w-3.5 h-3.5" /></button>
                {u.username !== 'admin' && (
                  <button onClick={() => deleteUser(u.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><TrashIcon className="w-3.5 h-3.5" /></button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active Sessions */}
      <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase text-slate-400">Active Sessions</label>
          <button onClick={load} className="text-[10px] text-primary hover:underline">Refresh</button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">No active sessions</p>
        ) : (
          <div className="space-y-1.5">
            {sessions.map(s => (
              <div key={s.id} className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 group">
                <div className="flex items-center gap-2">
                  <MonitorIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{s.username}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{parseUA(s.userAgent)}</span>
                    <span className="text-[10px] text-slate-400">IP: {s.ip} · {new Date(s.loginAt).toLocaleString()}</span>
                  </div>
                  <button onClick={() => kickSession(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 shrink-0" title="Kick session">
                    <LogOutIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Migration */}
      <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
        <label className="text-xs font-bold uppercase text-slate-400 block">Profile Migration</label>
        <p className="text-[10px] text-slate-400">Copy all data (bookmarks, groups, notes, tasks, widgets, etc.) from one user to another.</p>
        <div className="flex gap-2">
          <select value={migrateSource} onChange={(e) => setMigrateSource(e.target.value)} className="flex-1 text-xs px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border-none">
            <option value="">Source user…</option>
            {approvedUsers.map(u => <option key={u.id} value={u.username}>{u.firstName || u.username}</option>)}
          </select>
          <span className="text-xs text-slate-400 self-center">→</span>
          <select value={migrateTarget} onChange={(e) => setMigrateTarget(e.target.value)} className="flex-1 text-xs px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border-none">
            <option value="">Target user…</option>
            {approvedUsers.filter(u => u.username !== migrateSource).map(u => <option key={u.id} value={u.username}>{u.firstName || u.username}</option>)}
          </select>
        </div>
        <Button size="sm" className="w-full h-8" disabled={!migrateSource || !migrateTarget || migrateStatus === 'loading'} onClick={() => setMigrateConfirm(true)}>
          {migrateStatus === 'loading' ? '⏳ Migrating…' : '📋 Copy Profile'}
        </Button>
        {migrateResult && (
          <p className={`text-[10px] p-2 rounded-lg ${migrateStatus === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>{migrateResult}</p>
        )}
        {migrateConfirm && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">Copy Profile?</h2>
              <p className="text-sm text-slate-500 mb-5">Copy all data from &quot;<span className="font-medium text-slate-700 dark:text-slate-300">{migrateSource}</span>&quot; to &quot;<span className="font-medium text-slate-700 dark:text-slate-300">{migrateTarget}</span>&quot;? This will NOT delete existing data on the target.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setMigrateConfirm(false)} className="px-4 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={async () => {
                  setMigrateConfirm(false); setMigrateStatus('loading'); setMigrateResult('');
                  try {
                    const res = await apiFetch('/api/profile-migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceUserId: migrateSource, targetUserId: migrateTarget }) });
                    const data = await res.json();
                    if (res.ok) { setMigrateStatus('ok'); const c = data.copied; setMigrateResult(`Copied: ${c.bookmarks} bookmarks, ${c.groups} groups, ${c.notes} notes, ${c.tasks} tasks, ${c.widgets} widgets, ${c.settings} settings`); }
                    else { setMigrateStatus('err'); setMigrateResult(data.error || 'Migration failed'); }
                  } catch { setMigrateStatus('err'); setMigrateResult('Migration failed'); }
                  setTimeout(() => setMigrateStatus('idle'), 5000);
                }} className="px-4 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Copy</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Add new user */}
      <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
        <label className="text-xs font-bold uppercase text-slate-400 block">Add New User</label>
        {error && <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1.5">{error}</div>}
        <div className="flex gap-2">
          <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="First Name" className="h-8 text-xs flex-1" />
          <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Last Name" className="h-8 text-xs flex-1" />
        </div>
        <Input value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="Username" className="h-8 text-xs" />
        <div className="relative">
          <Input
            type={showPass ? 'text' : 'password'}
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Password"
            className="h-8 text-xs pr-8"
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
            {showPass ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex gap-2">
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="text-xs px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border-none flex-1">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <Button size="sm" onClick={addUser} disabled={!newUser.trim() || !newPass.trim()} className="h-8 px-4">
            <PlusIcon className="w-3.5 h-3.5 mr-1" /> Add User
          </Button>
        </div>
      </div>
    </div>
  );
}
