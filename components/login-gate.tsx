"use client";

import { useState, useEffect } from "react";
import { LockIcon, EyeIcon, EyeOffIcon, WrenchIcon, UserPlusIcon, ClockIcon } from "lucide-react";

function initSession() {
  if (typeof window === "undefined") return;
  const hasCookie = document.cookie.split(";").some(c => c.trim().startsWith("browserSession="));
  if (!hasCookie) {
    localStorage.removeItem("authed");
    localStorage.removeItem("authUser");
    localStorage.removeItem("authRole");
    localStorage.removeItem("sessionId");
  }
  document.cookie = "browserSession=1;path=/;SameSite=Lax";
}

export function getAuthUser() {
  if (typeof window === "undefined") return null;
  initSession();
  const username = localStorage.getItem("authUser");
  const role = localStorage.getItem("authRole");
  const firstName = localStorage.getItem("authFirstName") || "";
  const lastName = localStorage.getItem("authLastName") || "";
  return username ? { username, role, firstName, lastName } : null;
}

export function isAdmin() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("authRole") === "admin";
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("authed") === "true";
}

export function signOut() {
  const sid = localStorage.getItem("sessionId");
  localStorage.removeItem("authed");
  localStorage.removeItem("authUser");
  localStorage.removeItem("authRole");
  localStorage.removeItem("authFirstName");
  localStorage.removeItem("authLastName");
  localStorage.removeItem("sessionId");
  document.cookie = "browserSession=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  if (sid) navigator.sendBeacon("/api/auth/logout", JSON.stringify({ sessionId: sid }));
  window.location.href = "/bookmarks";
}

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    initSession();
    const isAuthed = localStorage.getItem("authed") === "true";
    setAuthed(isAuthed);
    if (isAuthed && localStorage.getItem("authRole") !== "admin") {
      fetch("/api/settings").then(r => r.json()).then(s => {
        if (s.maintenanceMode === true || s.maintenanceMode === 'true') setMaintenance(true);
      }).catch(() => {});
    }
  }, []);

  // Heartbeat
  useEffect(() => {
    const sid = localStorage.getItem("sessionId");
    if (!sid) return;
    const ping = () => fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: sid }) }).catch(() => {});
    ping();
    const iv = setInterval(ping, 60_000);
    return () => clearInterval(iv);
  }, [authed]);

  if (authed === null) return null;
  if (maintenance) return <MaintenanceScreen />;
  if (authed) return <>{children}</>;

  return (
    <>
      <div className="fixed inset-0 z-[9999]">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className="relative flex items-center justify-center min-h-screen p-4">
          <AuthPanel onSuccess={() => { setAuthed(true); }} onMaintenance={() => setMaintenance(true)} />
        </div>
      </div>
      <div className="blur-lg pointer-events-none select-none">{children}</div>
    </>
  );
}

function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-4 p-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
          <WrenchIcon className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-white">Under Maintenance</h1>
        <p className="text-slate-400 text-sm max-w-sm">We&apos;re currently performing scheduled maintenance. Please check back shortly.</p>
      </div>
    </div>
  );
}

function AuthPanel({ onSuccess, onMaintenance }: { onSuccess: () => void; onMaintenance: () => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "pending">("login");

  if (mode === "pending") {
    return (
      <div
        className="w-full max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        style={{ animation: "modal-scale-in 0.3s ease-out" }}
      >
        <div className="flex flex-col items-center gap-2 pt-8 pb-4 bg-gradient-to-b from-amber-500/10 to-transparent">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <ClockIcon className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Pending Approval</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-6">Your account has been created and is waiting for admin approval.</p>
        </div>
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={() => setMode("login")}
            className="w-full py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (mode === "signup") {
    return <SignupForm onPending={() => setMode("pending")} onBack={() => setMode("login")} />;
  }

  return <LoginForm onSuccess={onSuccess} onMaintenance={onMaintenance} onPending={() => setMode("pending")} onSignup={() => setMode("signup")} />;
}

function LoginForm({ onSuccess, onMaintenance, onPending, onSignup }: { onSuccess: () => void; onMaintenance: () => void; onPending: () => void; onSignup: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("authed", "true");
        localStorage.setItem("authUser", data.username);
        localStorage.setItem("authRole", data.role);
        localStorage.setItem("authFirstName", data.firstName || "");
        localStorage.setItem("authLastName", data.lastName || "");
        if (data.sessionId) localStorage.setItem("sessionId", data.sessionId);
        document.cookie = "browserSession=1;path=/;SameSite=Lax";
        window.location.href = window.location.pathname;
        return;
      }
      const data = await res.json();
      if (data.maintenance) { onMaintenance(); return; }
      if (data.pending) { onPending(); return; }
      setError(data.message || "Invalid credentials");
    } catch { setError("Connection error"); }
    setLoading(false);
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      style={{ animation: "modal-scale-in 0.3s ease-out" }}
    >
      <div className="flex flex-col items-center gap-2 pt-8 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <LockIcon className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Welcome Back</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to continue</p>
      </div>

      <div className="px-6 pb-6 pt-2 flex flex-col gap-3">
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 text-center">
            {error}
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/40 transition"
            autoFocus
            autoComplete="username"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/40 transition"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPw ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="mt-1 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Signing in\u2026" : "Sign In"}
        </button>
        <div className="text-center">
          <button type="button" onClick={onSignup} className="text-xs text-primary hover:underline">
            Don&apos;t have an account? Sign up
          </button>
        </div>
      </div>
    </form>
  );
}

function SignupForm({ onPending, onBack }: { onPending: () => void; onBack: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), username: username.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) { onPending(); return; }
      setError(data.error || "Signup failed");
    } catch { setError("Connection error"); }
    setLoading(false);
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      style={{ animation: "modal-scale-in 0.3s ease-out" }}
    >
      <div className="flex flex-col items-center gap-2 pt-8 pb-4 bg-gradient-to-b from-emerald-500/10 to-transparent">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <UserPlusIcon className="w-6 h-6 text-emerald-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Create Account</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Requires admin approval</p>
      </div>

      <div className="px-6 pb-6 pt-2 flex flex-col gap-3">
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 text-center">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              autoFocus
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            autoComplete="username"
            minLength={3}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              autoComplete="new-password"
              minLength={4}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPw ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Confirm Password</label>
          <input
            type={showPw ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !firstName || !lastName || !username || !password || !confirm}
          className="mt-1 w-full py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition"
        >
          {loading ? "Creating\u2026" : "Sign Up"}
        </button>
        <div className="text-center">
          <button type="button" onClick={onBack} className="text-xs text-primary hover:underline">
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </form>
  );
}
