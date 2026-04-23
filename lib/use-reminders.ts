import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-fetch";

export function useReminders() {
  const queryClient = useQueryClient();
  const notifiedRef = useRef<Set<string>>(new Set());

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => (await apiFetch("/api/reminders")).json(),
    refetchInterval: 60_000,
  });

  const create = useMutation({
    mutationFn: async (data: any) =>
      (await apiFetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const update = useMutation({
    mutationFn: async (data: any) =>
      (await apiFetch("/api/reminders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/reminders?id=${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const dismiss = (reminder: any) => {
    if (reminder.repeat) {
      const next = new Date(reminder.remindAt);
      if (reminder.repeat === "daily") next.setDate(next.getDate() + 1);
      else if (reminder.repeat === "weekly") next.setDate(next.getDate() + 7);
      else if (reminder.repeat === "monthly") next.setMonth(next.getMonth() + 1);
      update.mutate({ id: reminder.id, remindAt: next.toISOString(), dismissed: false });
    } else {
      update.mutate({ id: reminder.id, dismissed: true });
    }
  };

  // Browser notifications for due reminders
  useEffect(() => {
    const now = new Date();
    const due = reminders.filter((r: any) => !r.dismissed && new Date(r.remindAt) <= now && !notifiedRef.current.has(r.id));
    if (due.length === 0) return;
    if (Notification.permission === "default") Notification.requestPermission();
    if (Notification.permission === "granted") {
      due.forEach((r: any) => {
        new Notification(r.title, { body: r.description || "Reminder is due!", icon: "/favicon.svg" });
        notifiedRef.current.add(r.id);
      });
    }
  }, [reminders]);

  const active = reminders.filter((r: any) => !r.dismissed);
  const dueNow = active.filter((r: any) => new Date(r.remindAt) <= new Date());
  const upcoming = active.filter((r: any) => new Date(r.remindAt) > new Date());

  return { reminders, active, dueNow, upcoming, create, update, remove, dismiss };
}
