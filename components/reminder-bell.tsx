"use client";

import { useState } from "react";
import { BellIcon, BellRingIcon, PlusIcon, XIcon, CheckIcon, RepeatIcon, Trash2Icon } from "lucide-react";
import { useReminders } from "@/lib/use-reminders";

export function ReminderBell() {
  const { active, dueNow, upcoming, create, dismiss, remove } = useReminders();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [repeat, setRepeat] = useState("");

  const hasDue = dueNow.length > 0;

  const handleAdd = () => {
    if (!title || !remindAt) return;
    create.mutate({ title, remindAt: new Date(remindAt).toISOString(), repeat });
    setTitle(""); setRemindAt(""); setRepeat(""); setAdding(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-secondary hover:scale-105 text-xs font-medium transition-all duration-200">
        {hasDue ? <BellRingIcon className="w-3.5 h-3.5 text-orange-500 animate-bounce" /> : <BellIcon className="w-3.5 h-3.5 text-slate-500" />}
        Reminders
        {active.length > 0 && (
          <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${hasDue ? "bg-red-500 text-white" : "bg-primary/20 text-primary"}`}>
            {active.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-10 right-0 z-50 w-80 bg-white dark:bg-slate-900 border rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-bold">Reminders</span>
            <div className="flex gap-1">
              <button onClick={() => setAdding(!adding)} className="p-1 rounded hover:bg-secondary"><PlusIcon className="w-4 h-4" /></button>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary"><XIcon className="w-4 h-4" /></button>
            </div>
          </div>

          {adding && (
            <div className="p-3 border-b space-y-2 bg-secondary/30">
              <input placeholder="Reminder title" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full h-8 rounded-lg border bg-background px-2 text-xs" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
              <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)}
                className="w-full h-8 rounded-lg border bg-background px-2 text-xs" />
              <div className="flex gap-2 items-center">
                <select value={repeat} onChange={(e) => setRepeat(e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-xs flex-1">
                  <option value="">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <button onClick={handleAdd} disabled={!title || !remindAt}
                  className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">Add</button>
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {dueNow.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase text-red-500 px-4 pt-3 pb-1">Overdue / Due Now</p>
                {dueNow.map((r: any) => (
                  <ReminderItem key={r.id} reminder={r} onDismiss={() => dismiss(r)} onDelete={() => remove.mutate(r.id)} isDue />
                ))}
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground px-4 pt-3 pb-1">Upcoming</p>
                {upcoming.map((r: any) => (
                  <ReminderItem key={r.id} reminder={r} onDismiss={() => dismiss(r)} onDelete={() => remove.mutate(r.id)} />
                ))}
              </div>
            )}
            {active.length === 0 && !adding && (
              <p className="text-center text-muted-foreground text-xs py-8">No reminders</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReminderItem({ reminder, onDismiss, onDelete, isDue }: { reminder: any; onDismiss: () => void; onDelete: () => void; isDue?: boolean }) {
  const dt = new Date(reminder.remindAt);
  const timeStr = dt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex items-start gap-2 px-4 py-2 hover:bg-secondary/50 transition-colors ${isDue ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{reminder.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[11px] ${isDue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>{timeStr}</span>
          {reminder.repeat && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><RepeatIcon className="w-2.5 h-2.5" />{reminder.repeat}</span>}
        </div>
      </div>
      <button onClick={onDismiss} title={reminder.repeat ? "Snooze to next" : "Dismiss"} className="p-1 rounded hover:bg-secondary shrink-0">
        <CheckIcon className="w-3.5 h-3.5 text-green-500" />
      </button>
      <button onClick={onDelete} title="Delete" className="p-1 rounded hover:bg-secondary shrink-0">
        <Trash2Icon className="w-3.5 h-3.5 text-red-400" />
      </button>
    </div>
  );
}
