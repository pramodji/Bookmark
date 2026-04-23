"use client";

export function VersionBadge() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
  return (
    <span className="fixed bottom-2 right-3 z-50 text-[10px] text-slate-400/60 dark:text-slate-600/60 select-none pointer-events-none">
      v{version}
    </span>
  );
}
