# DEPLOYMENT.md — QTNXT LMS (local server, no AI needed)

Single-port deploy: Django API + all 3 built UIs on **`http://<server-ip>:8000`**.

| URL | What |
| --- | --- |
| `/` | Learner app |
| `/teach/` | Instructor app |
| `/admin/` | Admin UI |
| `/api/v1/` | Backend API |
| `/djadmin/` | Django admin (moved here so `/admin/` serves the Admin UI) |
| `/media/` | Uploads (avatars, covers, PDFs) |

## 1. Prerequisites (install once on the server)

- Python 3.11+ and `uv` (`powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`)
- Node.js 22 LTS (20.19+ minimum — older 20.x breaks Vite builds) and pnpm 10 (`npm i -g pnpm`)
- Git. XAMPP/MySQL optional (see §3). Firewall inbound allow on TCP 8000
  (admin PowerShell: `netsh advfirewall firewall add rule name="LMS 8000" dir=in action=allow protocol=TCP localport=8000`).

## 2. First-time setup

```powershell
git clone <repo-url>
cd verbose-memory-lms

# Backend
cd backend
uv sync
copy .env.example .env   # then edit .env, see §4
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py check

# Frontends (from repo root)
cd ..
pnpm install
$env:VITE_API_URL='/api/v1'; pnpm build
```

`VITE_API_URL=/api/v1` (relative) is important: page and API stay same-origin on
any host (`localhost`, LAN IP, public IP) so CORS can never break login.

## 3. Database

Default is sqlite (`backend/db.sqlite3`, zero setup). To use MySQL/MariaDB:

- Needs MySQL 8.0+ or MariaDB **10.5+**. XAMPP's bundled MariaDB 10.4 is rejected
  by Django 5 (`NotSupportedError: MariaDB 10.5 or later is required`).
- In `backend/.env`: `DATABASE_URL=mysql://user:pass@127.0.0.1:3306/masterlms`
  (encode `@` in password as `%40`), then `uv run python manage.py migrate`.

## 4. `backend/.env` reference

```env
SECRET_KEY=<random-32-chars-min>   # never ship the default; JWT signs with this
DEBUG=True                         # True = fixed OTP 1234, mock payments, /media/ served
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.0.103,183.82.2.222
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
# DATABASE_URL=...                # uncomment for MySQL (see §3)
# RAZORPAY_KEY_ID= / RAZORPAY_KEY_SECRET=   # blank = mock payments (enroll works)
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_MODEL=gemini-3.6-flash        # 2.0-flash is retired (Google returns 404)
LLM_API_KEY=AIza...               # real key from https://aistudio.google.com/apikey
```

Rules: add every host/IP you open the app with to `ALLOWED_HOSTS` or Django
returns 400 `DisallowedHost`. **Any `.env` change needs a backend restart.**
Edit single lines; never rewrite the whole file (you'll lose other settings).

Behaviour switches: `DEBUG=True` → OTP is always `1234`, Razorpay runs in mock
mode when keys are blank, Gemini extract needs a valid `LLM_API_KEY` regardless.

## 5. Running

Dev (testing only, dies with your terminal):
```powershell
cd backend
uv run python manage.py runserver 0.0.0.0:8000
```

Production (what the server uses):
```powershell
cd backend
.\start-waitress.bat   # waitress on 0.0.0.0:8000, logs to backend\server.log
```

Autostart: `QTNXT Backend.lnk` in Windows Startup folder
(`shell:startup`) runs `start-waitress.bat` on every logon. For start without
logon, use NSSM to run the same `.bat` as a Windows service.

## 6. Updating

```powershell
cd verbose-memory-lms
git pull
cd backend
uv sync
uv run python manage.py migrate
cd ..
$env:VITE_API_URL='/api/v1'; pnpm build   # only needed if frontend/shared changed
# restart backend (kill :8000 listener, rerun start-waitress.bat)
```

Find who holds the port: `netstat -ano | findstr :8000` → `taskkill /PID <pid> /F`.

## 7. Smoke test (after any change)

- `http://<server>:8000/` → learner landing (title QTNXT)
- `http://<server>:8000/teach/` → instructor studio
- `http://<server>:8000/admin/` → admin panel
- `http://<server>:8000/api/v1/courses/` → `{"data":[...]}`
- Login: mobile (10 digits, starts 6–9) → Send OTP → `1234` → complete profile.
- Paid enroll works with blank Razorpay keys (mock order `order_mock_*`).
- Hard-refresh (`Ctrl+Shift+R`) after every frontend rebuild — browsers cache old JS.

## 8. Troubleshooting

| Symptom | Cause → fix |
| --- | --- |
| `Port 8000 is already in use` | Another server holds it (§6 kill command). Note: a second Django app (e.g. Saree Elegance on `192.168.0.103:8001`) is unrelated. |
| `NotSupportedError: MariaDB 10.5 or later is required (found 10.4.x)` | XAMPP's MariaDB too old → use sqlite or install MySQL 8 (§3). |
| `TypeError: failed to fetch` on login | Page can't reach API: backend down, firewall blocking LAN, or stale cached JS → hard-refresh. Same-machine `localhost` vs LAN-IP mix is safe (relative API). |
| `DisallowedHost` / HTTP 400 everywhere | Host missing from `ALLOWED_HOSTS` → add + restart (§4). |
| OTP `Invalid or expired OTP` | Code is `1234` only when `DEBUG=True`; expires in 5 min; resend invalidates old codes; 5 wrong tries lock it; max 5 sends/hour. Mobile must match `[6-9]\d{9}`. |
| `Enter a valid URL` on profile save | Avatar/cover must be absolute URL (uploaded via `/upload/`), never `data:` or relative path. Fixed in `absoluteMediaUrl` (shared client). |
| Enroll `Authentication failed` | Dead Razorpay keys force live mode → blank both keys for mock mode (§4). |
| `No questions found in this PDF` | Dead/retired Gemini setup: needs valid `LLM_API_KEY` + current `LLM_MODEL` (§4). Scanned image-only PDFs give `No readable text` instead — use a text PDF or Generate mode. |
| `rolldown ... Cannot find native binding` on `pnpm dev` | Broken install → `pnpm install --force`; ensure Node ≥20.19 and pnpm 10. |
| App down after reboot/logout | Expected without autostart — log in (Startup shortcut runs it) or set up NSSM (§5). Check `backend\server.log`. |
| `vite` warns Node version | Upgrade to Node 22 LTS. |

## 9. Before exposing to real users

`DEBUG=True`, fixed OTP, mock payments, and dev `SECRET_KEY` are demo settings.
For real use: fresh `SECRET_KEY`, `DEBUG=False` (+ serve `/media/` via web server),
real Razorpay + Gemini keys, MySQL with backups, HTTPS.
