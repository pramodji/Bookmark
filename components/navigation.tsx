"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, MoonIcon, SunIcon, CalendarDaysIcon, BellIcon, MenuIcon, LogOutIcon, BookOpenIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut } from "@/components/login-gate";

export function Navigation({ onHide }: { onHide: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useStore();
  const [floatOpen, setFloatOpen] = useState(false);

  const links = [
    { href: "/bookmarks", icon: BookmarkIcon, label: "Bookmarks" },
    { href: "/calendar", icon: CalendarDaysIcon, label: "Diary" },
    { href: "/reminders", icon: BellIcon, label: "Reminders" },
    { href: "/notebooks", icon: BookOpenIcon, label: "Notebooks" },
  ];

  return (
    <nav className="w-64 border-r p-6 flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={onHide} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <MenuIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
      >
        {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        <span>{theme === "dark" ? "Light" : "Dark"} Mode</span>
      </button>
      <button
        onClick={signOut}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-red-500"
      >
        <LogOutIcon className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    </nav>
  );
}

export function FloatingNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useStore();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/bookmarks", icon: BookmarkIcon, label: "Bookmarks" },
    { href: "/calendar", icon: CalendarDaysIcon, label: "Diary" },
    { href: "/reminders", icon: BellIcon, label: "Reminders" },
    { href: "/notebooks", icon: BookOpenIcon, label: "Notebooks" },
  ];

  return (
    <div className="absolute top-3 left-3 z-50">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors bg-white dark:bg-slate-900 shadow-md border">
        <MenuIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute top-10 left-0 bg-white dark:bg-slate-900 border rounded-xl shadow-2xl p-2 w-48 space-y-1 animate-in fade-in zoom-in-95 duration-150" onClick={() => setOpen(false)}>
          <p className="text-xs font-bold uppercase text-slate-400 px-3 py-1">Dashboard</p>
          {links.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm", pathname === href ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
          <div className="border-t pt-1">
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
              {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
              <span>{theme === "dark" ? "Light" : "Dark"} Mode</span>
            </button>
            <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm text-red-500">
              <LogOutIcon className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
