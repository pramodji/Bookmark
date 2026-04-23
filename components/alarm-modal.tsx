"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useReminders } from "@/lib/use-reminders";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { BellRingIcon, XIcon, ClockIcon, CheckIcon, Volume2Icon, VolumeXIcon } from "lucide-react";

function playAlarmSound(ctx: AudioContext) {
  const now = ctx.currentTime;
  // Play a 3-beep pattern
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, now + i * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.4 + 0.3);
    osc.start(now + i * 0.4);
    osc.stop(now + i * 0.4 + 0.3);
  }
}

export function AlarmModal() {
  const { dueNow, dismiss, update } = useReminders();
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Also check overdue tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await apiFetch("/api/tasks")).json(),
    refetchInterval: 60_000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter((t: any) => t.dueDate && !t.completed && t.dueDate <= today);

  // Combine due reminders + overdue tasks into alarm items
  const alarmItems = useMemo(() => [
    ...dueNow.filter((r: any) => !snoozed.has(r.id)).map((r: any) => ({
      id: r.id, type: "reminder" as const, title: r.title, description: r.description, raw: r,
    })),
    ...overdueTasks.filter((t: any) => !snoozed.has(t.id)).map((t: any) => ({
      id: t.id, type: "task" as const, title: t.title, description: t.dueDate, raw: t,
    })),
  ], [dueNow, overdueTasks, snoozed]);

  const visible = alarmItems.length > 0;

  // Play alarm sound when new items appear
  useEffect(() => {
    if (!visible || muted) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    const hasNew = alarmItems.some(a => !playedRef.current.has(a.id));
    if (!hasNew && intervalRef.current) return;

    alarmItems.forEach(a => playedRef.current.add(a.id));

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;

    playAlarmSound(ctx);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => playAlarmSound(ctx), 5000);

    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [visible, muted, alarmItems]);

  const handleSnooze = useCallback((item: typeof alarmItems[0], minutes: number) => {
    setSnoozed(s => new Set(s).add(item.id));
    if (item.type === "reminder") {
      const newTime = new Date(Date.now() + minutes * 60_000).toISOString();
      update.mutate({ id: item.id, remindAt: newTime, dismissed: false });
    }
    // For tasks, just hide from alarm for this session
    setTimeout(() => setSnoozed(s => { const n = new Set(s); n.delete(item.id); return n; }), minutes * 60_000);
  }, [update]);

  const handleDismiss = useCallback((item: typeof alarmItems[0]) => {
    if (item.type === "reminder") dismiss(item.raw);
    else setSnoozed(s => new Set(s).add(item.id)); // hide task from alarm this session
  }, [dismiss]);

  const handleDismissAll = useCallback(() => {
    alarmItems.forEach(item => handleDismiss(item));
  }, [alarmItems, handleDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-500 text-white px-5 py-3 flex items-center gap-3">
          <BellRingIcon className="w-5 h-5 animate-bounce" />
          <span className="font-bold text-sm flex-1">
            {alarmItems.length} item{alarmItems.length > 1 ? "s" : ""} need attention!
          </span>
          <button onClick={() => setMuted(!muted)} className="p-1 rounded hover:bg-white/20" title={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeXIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
          </button>
          <button onClick={handleDismissAll} className="p-1 rounded hover:bg-white/20" title="Dismiss all">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-2">
          {alarmItems.map(item => (
            <div key={item.id} className="border rounded-xl p-3 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <span className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  {item.type === "reminder" ? "Reminder" : "Task"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <button onClick={() => handleDismiss(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">
                  <CheckIcon className="w-3 h-3" /> Dismiss
                </button>
                {[5, 10, 15].map(m => (
                  <button key={m} onClick={() => handleSnooze(item, m)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-xs font-medium hover:bg-secondary/80 transition-colors">
                    <ClockIcon className="w-3 h-3" /> {m}m
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
