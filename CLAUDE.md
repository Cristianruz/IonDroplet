# CLAUDE.md - IonDroplet

## Project Overview

IonDroplet is an IoT agricultural monitoring and control system for intelligent irrigation and water ionization. It monitors environmental (temperature, humidity) and electrical (voltage, current) parameters in real-time, controlling water pumps and ionization systems through AI-driven decisions. The system communicates with ESP32/ESP8266 microcontrollers via serial port (USB) and HTTP.

## Repository Structure

```
IonDroplet/
├── IonDroplet Completo/
│   ├── IonDroplet-Front/          # Next.js 16 + React 19 frontend (TypeScript)
│   │   ├── app/                   # Next.js App Router pages
│   │   │   ├── page.tsx           # Main dashboard
│   │   │   ├── login/page.tsx     # Authentication page
│   │   │   ├── cultivo/page.tsx   # Crop management page
│   │   │   └── layout.tsx         # Root layout (Spanish locale, dark theme)
│   │   ├── components/
│   │   │   ├── dashboard/         # 13 dashboard components (sensors, charts, AI, devices)
│   │   │   └── ui/                # shadcn/ui component library (~50 components)
│   │   ├── hooks/                 # Custom React hooks
│   │   │   └── use-sensor-data.ts # Core hook: sensor data, system status, alerts, devices
│   │   └── lib/                   # Utility functions (cn helper)
│   ├── iondroplet-backend/        # Express.js backend (JavaScript, CommonJS)
│   │   └── server.js              # Single-file API server
│   └── INICIAR_SISTEMA.bat        # Windows startup script (launches both servers)
├── .gitignore
└── package-lock.json
```

## Tech Stack

**Frontend:** Next.js 16.2.0, React 19, TypeScript 5.7.3, Tailwind CSS 4, shadcn/ui (Radix UI), Recharts, React Hook Form + Zod, Lucide React icons

**Backend:** Express.js 5, SQLite 3 (primary DB), JWT auth (bcryptjs), SerialPort 13 (ESP32 communication), dotenv

**AI Integration:** Anthropic Claude API (claude-haiku-4-5-20251001) for ionization control decisions and conversational assistant

## Development Setup

### Prerequisites
- Node.js (18+)
- npm or pnpm
- ESP32/ESP8266 on serial port (optional, for hardware features)

### Backend
```bash
cd "IonDroplet Completo/iondroplet-backend"
npm install
# Create .env with JWT_SECRET and ANTHROPIC_API_KEY
node server.js          # Runs on http://localhost:3001
```

### Frontend
```bash
cd "IonDroplet Completo/IonDroplet-Front"
npm install             # or: pnpm install
npm run dev             # Dev server on http://localhost:3000
npm run build           # Production build
npm run lint            # ESLint
```

### Environment Variables (.env in backend root)
- `JWT_SECRET` - JWT signing key
- `ANTHROPIC_API_KEY` - Claude API key for AI features

## Key Architecture Decisions

- **Single-file backend:** All API routes live in `server.js` (~360 lines). No route splitting.
- **SQLite for storage:** Database file at `./iondroplet.db`, auto-created on startup.
- **Auth disabled for demo:** `authMiddleware` in server.js calls `next()` unconditionally.
- **Frontend API URL hardcoded:** `http://localhost:3001` in `hooks/use-sensor-data.ts`.
- **Spanish language throughout:** All UI text, comments, variable names in backend are in Spanish.
- **Dark theme default:** Root layout sets `className="dark"` on `<html lang="es">`.
- **TypeScript build errors ignored:** `next.config.mjs` has `ignoreBuildErrors: true`.
- **No formal tests:** Neither frontend nor backend have test infrastructure.
- **No CI/CD:** No GitHub Actions, no pipelines configured.

## Database Schema (SQLite)

| Table | Key Columns |
|---|---|
| `sensor_readings` | temperature, humidity, voltage, current, device_id, timestamp |
| `thresholds` | temp_max, hum_max, volt_min, volt_max, curr_max |
| `users` | email (unique), password (bcrypt hash) |
| `devices` | ionization_on (boolean) |
| `ionization_log` | device_id, state (boolean), timestamp |

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | User login (JWT) |
| POST | `/api/auth/register` | User registration |
| POST | `/api/sensors/data` | Ingest sensor readings |
| GET | `/api/sensors/latest` | Latest sensor reading |
| GET | `/api/sensors/history?hours=N` | Historical readings |
| POST | `/api/ionization/toggle` | Toggle ionizer on/off |
| GET | `/api/thresholds` | Get threshold config |
| POST | `/api/thresholds` | Update thresholds |
| GET | `/api/devices` | List devices |
| POST | `/api/esp/data` | ESP32 sensor data ingestion (WiFi) |
| POST | `/api/esp/control` | Control pump/auto mode |
| GET | `/api/esp/status` | Get ESP32 system state |
| POST | `/api/ai/analyze` | AI ionization recommendation |

## Code Conventions

- **Frontend files:** kebab-case (`sensor-card.tsx`, `use-sensor-data.ts`)
- **React components:** PascalCase exports (`SensorCard`, `AlertsPanel`)
- **Backend variables:** camelCase; database fields use snake_case
- **Styling:** Tailwind CSS utility classes only (no CSS modules)
- **UI components:** shadcn/ui pattern - components in `components/ui/`, composed in `components/dashboard/`
- **Path aliases:** `@/*` maps to project root (tsconfig paths)
- **Language:** Spanish for all user-facing text, comments, and many variable names (e.g., `humedad`, `bomba`)

## Hardware Integration

- **Serial port:** COM12 at 115200 baud (hardcoded in server.js for Windows)
- **Protocol:** JSON over serial (`{"humedad": 45.2}`) and command strings (`BOMBA:0\n` / `BOMBA:1\n`)
- **WiFi ESP32:** HTTP REST communication when device IP is known
- **Auto-pump logic:** If humidity < threshold, pump turns on (in auto mode)

## Common Tasks

### Adding a new dashboard component
1. Create component in `IonDroplet Completo/IonDroplet-Front/components/dashboard/`
2. Import and place it in `app/page.tsx` (main dashboard grid)
3. Use data from the `useSensorData()` hook in `hooks/use-sensor-data.ts`

### Adding a new API endpoint
1. Add route handler in `IonDroplet Completo/iondroplet-backend/server.js`
2. Use `authMiddleware` for protected routes
3. Access database via the `db` variable (sqlite async wrapper)

### Adding a new UI primitive
Use shadcn/ui CLI or manually add to `components/ui/` following existing Radix UI patterns.

## Gotchas

- Directory name has a space: `"IonDroplet Completo"` - always quote paths in shell commands
- Serial port config is Windows-specific (COM12) - change for Linux/Mac (`/dev/ttyUSB0`, `/dev/cu.usbserial-*`)
- Frontend makes direct browser-side calls to the Anthropic API in `ai-chat.tsx` (requires `NEXT_PUBLIC_ANTHROPIC_API_KEY`)
- The `use-sensor-data.ts` hook generates static fallback data to avoid React hydration errors
- `next.config.mjs` ignores TypeScript errors on build - type issues won't block deploys but should still be fixed
- Weather data uses Open-Meteo API with hardcoded Chihuahua, MX coordinates (28.6333, -106.0833)
