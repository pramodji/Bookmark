export function apiFetch(url: string, opts?: RequestInit): Promise<Response> {
  const userId = typeof window !== "undefined" ? localStorage.getItem("authUser") || "admin" : "admin";
  const headers = new Headers(opts?.headers);
  headers.set("x-user-id", userId);
  if (!headers.has("Content-Type") && opts?.body) headers.set("Content-Type", "application/json");
  return fetch(url, { ...opts, headers });
}
