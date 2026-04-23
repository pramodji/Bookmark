import { headers } from "next/headers";

export function getUserId(): string {
  const h = headers();
  return h.get("x-user-id") || "admin";
}
