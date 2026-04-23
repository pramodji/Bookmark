# Windows SSO (NTLM/Kerberos) — Implementation Plan

## Overview

Hybrid authentication: users with `autoLogin` enabled are automatically authenticated via their Windows domain credentials (NTLM/Kerberos). All other users see the normal login form.

## Architecture

```
Browser → IIS (Windows Auth enabled) → Docker container (Next.js :3000)
           ↓                              ↓
           Negotiates NTLM/Kerberos       Reads X-Remote-User header
           Adds X-Remote-User header      Checks if user has autoLogin=true
                                          Auto-authenticates or shows login form
```

- IIS handles the NTLM/Kerberos handshake natively
- Docker container only reads a trusted header — no Windows auth libraries needed
- Container must only be accessible from IIS (bind to `127.0.0.1:3000`)

---

## Step 1: Prisma Schema Changes

Add two fields to the `User` model in `prisma/schema.prisma`:

```prisma
model User {
  id             String   @id @default(uuid())
  username       String   @unique
  password       String
  firstName      String   @default("")
  lastName       String   @default("")
  role           String   @default("user")
  approved       Boolean  @default(false)
  autoLogin      Boolean  @default(false)    // NEW — enable SSO for this user
  domainUsername  String?                     // NEW — Windows domain username (e.g. "DOMAIN\\jdoe")
  createdAt      String   @default("")
}
```

After editing, run:
```bash
npx prisma generate
npx prisma db push
```

---

## Step 2: SSO API Route

Create `app/api/auth/sso/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  // IIS sets this header after NTLM/Kerberos negotiation
  const remoteUser = req.headers.get("x-remote-user");

  if (!remoteUser) {
    return NextResponse.json({ sso: false, reason: "no-header" });
  }

  // Normalize: "DOMAIN\jdoe" → "DOMAIN\jdoe" (handle both \ and \\)
  const normalized = remoteUser.replace(/\\\\/g, "\\").trim().toLowerCase();

  // Find a user with autoLogin enabled and matching domainUsername
  const users = await prisma.user.findMany({
    where: { autoLogin: true, approved: true },
  });

  const user = users.find(
    (u) => u.domainUsername?.toLowerCase() === normalized
  );

  if (!user) {
    return NextResponse.json({ sso: false, reason: "no-match" });
  }

  // Check maintenance mode for non-admins
  if (user.role !== "admin") {
    const maint = await prisma.setting.findUnique({ where: { key: "maintenanceMode" } });
    if (maint?.value === "true") {
      return NextResponse.json({ sso: false, reason: "maintenance" });
    }
  }

  // Create session
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const session = await prisma.session.create({
    data: {
      username: user.username,
      ip,
      userAgent: ua,
      loginAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    },
  });

  return NextResponse.json({
    sso: true,
    username: user.username,
    role: user.role,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    sessionId: session.id,
  });
}
```

---

## Step 3: Login Gate Changes

In `components/login-gate.tsx`, add an SSO check that runs before showing the login form:

```ts
// Inside LoginGate component, add useEffect for SSO check:

const [ssoChecked, setSsoChecked] = useState(false);

useEffect(() => {
  // Skip if already authenticated
  if (localStorage.getItem("authUser")) {
    setSsoChecked(true);
    return;
  }

  fetch("/api/auth/sso")
    .then((r) => r.json())
    .then((data) => {
      if (data.sso) {
        // Auto-login succeeded — store credentials and navigate
        localStorage.setItem("authUser", data.username);
        localStorage.setItem("authRole", data.role);
        localStorage.setItem("firstName", data.firstName);
        localStorage.setItem("lastName", data.lastName);
        localStorage.setItem("sessionId", data.sessionId);
        window.location.href = window.location.pathname;
      } else {
        setSsoChecked(true); // Show normal login form
      }
    })
    .catch(() => setSsoChecked(true));
}, []);

// Don't render login form until SSO check completes
if (!ssoChecked && !localStorage.getItem("authUser")) {
  return null; // or a loading spinner
}
```

---

## Step 4: User Management UI Changes

In `components/settings-panel.tsx` (Users tab), add fields for each user:

- **Auto Login** — checkbox toggle
- **Domain Username** — text input (e.g. `DOMAIN\jdoe`)

These fields should be visible to admins only and included in the user edit form.

Update the `PUT /api/users` route to accept `autoLogin` and `domainUsername` fields.

---

## Step 5: Docker Configuration

Bind the container to localhost only so users can't bypass IIS:

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - ./data:/app/data
```

---

## Step 6: IIS Configuration

> This is infrastructure setup — may require IT team assistance.

### 6a. Install IIS Features

```powershell
# Run in elevated PowerShell
Install-WindowsFeature Web-Server, Web-Windows-Auth, Web-Url-Auth
# Or via "Turn Windows features on or off" on Windows 10/11:
#   - Internet Information Services
#   - World Wide Web Services → Security → Windows Authentication
```

### 6b. Create IIS Site

1. Open IIS Manager
2. Add a new site pointing to an empty folder (IIS just proxies, no static files)
3. Set binding to port 80 (or 443 with SSL)

### 6c. Enable Windows Authentication

1. Select the site → Authentication
2. Disable "Anonymous Authentication"
3. Enable "Windows Authentication"

### 6d. Configure Reverse Proxy

Install **URL Rewrite** and **Application Request Routing (ARR)** modules for IIS.

Add to the site's `web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3000/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_REMOTE_USER" value="{LOGON_USER}" />
          </serverVariables>
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

This passes the authenticated Windows username as `X-Remote-User` header to the Next.js app.

### 6e. Register SPN (for Kerberos)

```powershell
# Run on domain controller or with domain admin privileges
setspn -S HTTP/your-server-hostname DOMAIN\ServiceAccount
```

If Kerberos isn't configured, NTLM will be used as fallback (still works, just slightly slower).

---

## Security Considerations

- **Trust boundary**: The `X-Remote-User` header is only trustworthy if it comes from IIS. The Docker container must NOT be directly accessible from the network.
- **Header spoofing**: If someone can reach the container directly, they can fake the header. The `127.0.0.1` binding prevents this.
- **Fallback**: Users without `autoLogin` enabled are unaffected — they use the normal login form.
- **Domain username format**: Store as `DOMAIN\username` to avoid ambiguity across domains.

---

## Testing Without IIS

For local development/testing without IIS, you can simulate the SSO header:

```bash
# Test the SSO endpoint with a fake header
curl -H "X-Remote-User: DOMAIN\jdoe" http://localhost:3000/api/auth/sso
```

Or add a temporary dev-only toggle in the SSO route that reads from a query param when `NODE_ENV === "development"`.

---

## Summary of Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `autoLogin` and `domainUsername` fields to User model |
| `app/api/auth/sso/route.ts` | NEW — SSO endpoint that checks X-Remote-User header |
| `components/login-gate.tsx` | Add SSO check before showing login form |
| `components/settings-panel.tsx` | Add autoLogin toggle + domainUsername input in Users tab |
| `app/api/users/route.ts` | Accept `autoLogin` and `domainUsername` in PUT |
| `docker-compose.yml` | Bind to `127.0.0.1:3000` |
| IIS `web.config` | Reverse proxy + Windows Auth config |
