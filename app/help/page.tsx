"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { signOut } from "@/components/login-gate";
import {
  BookmarkIcon, CheckSquareIcon, CalendarDaysIcon, FileTextIcon, BellRingIcon,
  LogOutIcon, TrendingUpIcon, HelpCircleIcon, KeyboardIcon, SettingsIcon,
  DownloadIcon, UploadIcon, SearchIcon, StickyNoteIcon, LayoutGridIcon,
} from "lucide-react";

const sections = [
  {
    icon: BookmarkIcon, title: "Bookmarks", color: "text-orange-500",
    items: [
      "Add bookmarks with title, URL, icon, and group",
      "Organize into groups and subgroups",
      "Drag & drop to reorder bookmarks and groups",
      "Right-click a bookmark for edit/delete options",
      "Multi-select with Ctrl+Click for bulk actions",
      "Import from HTML (browser export), CSV, or JSON",
      "Export all bookmarks as JSON backup",
    ],
  },
  {
    icon: CheckSquareIcon, title: "Tasks", color: "text-blue-500",
    items: [
      "Create tasks with title, priority (high/medium/low), and due date",
      "Mark tasks complete with the checkbox",
      "Filter by priority, status, or due date",
      "Overdue tasks appear on the dashboard",
    ],
  },
  {
    icon: FileTextIcon, title: "Notes", color: "text-purple-500",
    items: [
      "Rich text editor with formatting support",
      "Organize notes by date",
      "Use note templates for quick creation",
      "Notes for today appear on the dashboard",
    ],
  },
  {
    icon: CalendarDaysIcon, title: "Diary / Calendar", color: "text-blue-500",
    items: [
      "Calendar view of your notes and tasks",
      "Click a date to view or create entries",
    ],
  },
  {
    icon: BellRingIcon, title: "Reminders", color: "text-red-500",
    items: [
      "Set reminders with date/time and optional alarm sound",
      "Due reminders show a bell notification and appear on the dashboard",
      "Dismiss or snooze reminders when they fire",
    ],
  },
  {
    icon: StickyNoteIcon, title: "Sticky Notes", color: "text-yellow-500",
    items: [
      "Create floating sticky notes on the bookmarks page",
      "Drag to reposition, resize as needed",
      "Choose custom fonts per sticky note",
    ],
  },
  {
    icon: LayoutGridIcon, title: "Widgets", color: "text-teal-500",
    items: [
      "Add floating widget panels (tasks, notes) to the bookmarks page",
      "Drag and resize widgets freely",
    ],
  },
  {
    icon: SearchIcon, title: "Search", color: "text-indigo-500",
    items: [
      "Ctrl+B — Focus bookmark search bar",
      "Ctrl+K — Spotlight search across all data (bookmarks, tasks, notes, reminders)",
      "Use arrow keys to navigate results, Enter to open",
    ],
  },
  {
    icon: KeyboardIcon, title: "Keyboard Shortcuts", color: "text-slate-500",
    items: [
      "Ctrl+/ — Show keyboard shortcuts panel",
      "Ctrl+B — Focus bookmark search",
      "Ctrl+K — Spotlight search",
      "Escape — Close any open modal or search",
    ],
  },
  {
    icon: DownloadIcon, title: "Backup & Restore", color: "text-green-500",
    items: [
      "Export a full JSON backup from Settings (includes bookmarks, tasks, notes, reminders, sticky notes)",
      "Import a backup JSON to merge with existing data",
      "Auto-backup option saves to the server on a schedule",
      "Restore from server-side backups in Settings",
    ],
  },
  {
    icon: SettingsIcon, title: "Settings & Customization", color: "text-slate-400",
    items: [
      "Dark / Light mode toggle",
      "Custom background images per page with opacity control",
      "Accent color picker",
      "Group, subgroup, and widget opacity controls",
      "Toggle clock, group borders, widget borders, top buttons",
      "Manage saved icons for bookmarks",
      "Maintenance mode (admin only)",
    ],
  },
];

export default function HelpPage() {
  const { theme, toggleTheme } = useStore();
  const navHidden = useScrollDirection();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Top bar — matches dashboard */}
      <div className={`sticky top-0 z-40 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-3 flex items-center gap-3 shadow-sm transition-transform duration-300 ${navHidden ? "-translate-y-full" : "translate-y-0"}`}>
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
        <Link href="/reminders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
          <BellRingIcon className="w-3.5 h-3.5" /> Reminders
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleTheme} className="text-xs px-3 py-1.5 rounded-lg hover:bg-secondary transition-all">
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-secondary text-red-500 transition-all">
            <LogOutIcon className="w-4 h-4" />
          </button>
          <Link href="/help" className="p-1.5 rounded-lg hover:bg-secondary transition-all">
            <HelpCircleIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6 relative z-10">
        <div className="rounded-2xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-lg border border-white/30 dark:border-slate-700/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircleIcon className="w-6 h-6 text-primary" /> Help & Guide
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Everything you need to know about using Go-Home.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {sections.map((s) => (
            <div key={s.title} className="rounded-2xl border border-white/30 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/40 backdrop-blur-lg p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
              <h2 className={`text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2 ${s.color}`}>
                <s.icon className="w-4 h-4" /> {s.title}
              </h2>
              <ul className="space-y-1.5">
                {s.items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                    <span className="text-muted-foreground shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
