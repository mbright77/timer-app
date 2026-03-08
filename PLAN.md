# PWA Timer Wheel — Comprehensive Implementation Plan

## Resolved Design Decisions

| Question | Decision |
|---|---|
| Max duration | **160 minutes** — display switches to `H:mm:ss` format above 59:59 |
| Time snapping | **Snap to 1-minute intervals** |
| Tick marks | **Yes** — small radial lines every minute (60 marks per rotation) |
| Multi-rotation wheel | **Overlapping arc with rotation counter** (e.g. 1h + 40 min shown as arc filling again + badge) |
| Alarm on silent | **Attempt audio always**, fall back to visual flash + vibration |
| Color scheme | **System-follows dark/light mode** — components styled neutrally |
| Deployment | **GitHub Pages project page** (`/<repo-name>/`) |
| .NET version | **.NET 9 Blazor WebAssembly** |
| Rotation inertia | **Not in scope** — wheel snaps directly to nearest minute, no momentum/coasting |
| Timer on screen lock | **Not in scope** — browser timers may be throttled; no background keep-alive mechanism |

---

## Repository Structure

```
timer-app/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD
├── docs/
│   ├── PRE_REQUIREMENT.md
│   └── Inspiration.jpg
├── src/
│   └── TimerApp/                 # Blazor WASM PWA project
│       ├── TimerApp.csproj
│       ├── Program.cs
│       ├── App.razor
│       ├── _Imports.razor
│       ├── wwwroot/
│       │   ├── index.html        # base href = /timer-app/
│       │   ├── manifest.webmanifest
│       │   ├── service-worker.js
│       │   ├── service-worker.published.js
│       │   ├── app.css           # global styles + CSS variables (light/dark)
│       │   ├── icons/            # PWA icons (192px, 512px, maskable)
│       │   └── audio/
│       │       └── alarm.mp3
│       ├── Pages/
│       │   └── TimerPage.razor
│       ├── Components/
│       │   ├── TimerWheel.razor        # SVG wheel + touch/mouse interaction
│       │   ├── TimeDisplay.razor       # Large time readout
│       │   └── ControlButtons.razor    # Start / Pause / Reset / Repeat
│       ├── Services/
│       │   └── TimerService.cs         # Countdown logic, state machine
│       └── Interop/
│           ├── AudioInterop.cs         # C# wrapper for audio + vibration JS
│           └── audioInterop.js         # JS module for audio context + play
├── PLAN.md                       # This file
├── AGENTS.md                     # Agent requirements & guidelines
├── SUB_AGENTS.md                 # Code review sub-agent definitions
└── .gitignore                    # standard .NET gitignore
```

---

## Component Architecture

### State Machine (`TimerService.cs`)
```
Idle → SetTime → Running → Finished
                   ↑            |
                   └── Reset ←──┘
                   └── Pause/Resume (Running ↔ Paused)
```

- `TimerService` holds the canonical state and exposes an `OnTick` event
- Uses `System.Timers.Timer` or `PeriodicTimer` firing every second
- No persistence — pure in-memory state

### `TimerWheel.razor`
- Renders an **SVG** element (recommended in requirements)
- **Track ring**: gray background circle arc (full 360°)
- **Progress arc**: colored `stroke-dasharray` / `stroke-dashoffset` arc representing elapsed portion within the current 60-min rotation
- **Rotation counter badge**: small badge overlaid when time > 60 min (e.g. `+1h`)
- **Tick marks**: 60 `<line>` elements distributed at 6° intervals, longer every 5th
- **Touch + Mouse events**: `touchstart`/`touchmove`/`touchend` + `mousedown`/`mousemove`/`mouseup` via `@on*` Blazor event handlers
- Angle → minutes mapping: 360° = 60 min, snapped to nearest whole minute
- Multi-rotation: track full rotation count separately; total minutes = (rotations × 60) + current arc minutes, capped at 160

### `TimeDisplay.razor`
- Shows `mm:ss` when ≤ 59:59, `H:mm:ss` when > 59:59 (e.g. `1:40:00`)
- Large font, centered, high contrast
- During **Idle/SetTime**: shows set duration in the same format
- During **Running**: shows remaining time, updates every second
- During **Finished**: shows `"Time's up!"`

### `ControlButtons.razor`
- **Idle / SetTime state**: `[Start]` button (disabled when time = 0)
- **Running state**: `[Pause]` + `[Reset]`
- **Paused state**: `[Resume]` + `[Reset]`
- **Finished state**: `[Reset]` + `[Repeat]`
- Full-width pill buttons, touch-friendly (min 48px hit targets)

### `AudioInterop.cs` + JS
- Thin C# wrapper calling JS functions via `IJSRuntime`
- JS: preloads `alarm.mp3` on first user interaction (to satisfy autoplay policy)
- On alarm trigger: `audio.play()` + `navigator.vibrate([500, 200, 500])` if available
- Handles `NotAllowedError` gracefully (visual-only fallback)

---

## PWA Configuration

### `manifest.webmanifest`
```json
{
  "name": "Timer Wheel",
  "short_name": "Timer",
  "start_url": "/timer-app/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [...]
}
```
> Note: `background_color` and `theme_color` use light-mode defaults. Dark mode theming is handled entirely by CSS (`prefers-color-scheme`) — the manifest does not support per-theme overrides in all browsers.

### Service Worker
- Use the **Blazor-generated** `service-worker.published.js` (cache-first strategy)
- Caches all static assets including `alarm.mp3` for full offline support
- Versioned cache key updated on each deploy

### Icons
- Generate from a single source SVG at build/design time
- Sizes: 192×192, 512×512, maskable variant (safe-zone padding)

---

## Mobile-First UI Layout

```
┌─────────────────────────┐
│  [app name / status bar]│  ← small, subtle
│                         │
│       06:30             │  ← TimeDisplay (large, ~20vw font)
│                         │
│    ╔═══════════╗        │
│    ║  ○─────   ║        │  ← TimerWheel (SVG, ~80vw diameter)
│    ║  tick marks║       │     max-width: 360px on desktop
│    ╚═══════════╝        │
│                         │
│   [  Start  ] [Reset]   │  ← ControlButtons (full-width or side-by-side)
└─────────────────────────┘
```

- Layout: CSS Flexbox column, `height: 100dvh` (dynamic viewport height — avoids mobile browser chrome issues)
- Wheel: `min(80vw, 360px)` diameter — large on phones, constrained on desktop
- Buttons: `min-height: 52px`, `border-radius: 26px` (pill shape)
- `touch-action: none` on the wheel SVG to prevent scroll interference
- `user-select: none` to prevent text selection during drag
- Safe area insets (`env(safe-area-inset-*)`) for notched devices

### Dark / Light Mode
- CSS custom properties on `:root` and `@media (prefers-color-scheme: dark)`
- Token set: `--bg`, `--surface`, `--text`, `--accent`, `--track`, `--arc`
- No JS required for theme switching (pure CSS media query)

---

## GitHub Actions CI/CD Pipeline (`.github/workflows/deploy.yml`)

```
Trigger: push to main branch

Steps:
1. actions/checkout
2. actions/setup-dotnet@v4  (.NET 9)
3. dotnet restore
4. dotnet publish -c Release -o publish/
5. Fix GitHub Pages SPA routing:
   - Copy index.html → 404.html (Blazor SPA redirect trick)
   - Create .nojekyll file (prevents Jekyll processing)
6. actions/upload-pages-artifact (from publish/wwwroot/)
7. actions/deploy-pages
```

- Uses the official `actions/deploy-pages` action (no `gh-pages` branch tricks)
- **Base href** in `index.html` must be `/timer-app/` (matched to repo name)
- SPA routing: the `404.html` trick is standard for Blazor on GitHub Pages

---

## Implementation Phases

### Phase 1 — Project Scaffold
- `dotnet new blazorwasm --pwa -o src/TimerApp`
- Configure `.gitignore` (standard .NET)
- Set `<base href="/timer-app/" />` in `index.html`
- Update `manifest.webmanifest` with correct `start_url`
- Verify local `dotnet run` works
- **Review**: Run sub-agents (QA, UI/UX, Architect) before committing

### Phase 2 — Core Timer Logic
- Implement `TimerService` state machine
- Wire `PeriodicTimer` countdown
- Unit-testable pure C# logic
- **Review**: Run sub-agents (QA, UI/UX, Architect) before committing

### Phase 3 — Timer Wheel Component
- SVG structure (track, arc, tick marks)
- Touch/mouse drag → angle calculation → minute snapping
- Multi-rotation tracking (cap at 160 min)
- Dark/light CSS variables
- **Review**: Run sub-agents (QA, UI/UX, Architect) before committing

### Phase 4 — UI Assembly
- `TimeDisplay` component with format switching
- `ControlButtons` component per state
- `TimerPage` layout (Flexbox column, `100dvh`)
- Alarm completion state (wheel flash animation via CSS keyframes)
- **Review**: Run sub-agents (QA, UI/UX, Architect) before committing

### Phase 5 — Audio & Vibration
- Add `alarm.mp3` to `wwwroot/audio/`
- JS interop module (`audioInterop.js`)
- `AudioInterop.cs` wrapper
- User-gesture unlock pattern for autoplay
- **Review**: Run sub-agents (QA, UI/UX, Architect) before committing

### Phase 6 — PWA Polish
- App icons (192, 512, maskable)
- Service worker cache includes audio file
- Lighthouse PWA audit — target ≥ 90 score (consistent with Success Criteria)
- **Review**: Run sub-agents (QA, UI/UX, Architect) before committing

### Phase 7 — CI/CD Pipeline
- `.github/workflows/deploy.yml`
- Enable GitHub Pages (source: GitHub Actions) in repo settings
- Verify end-to-end deploy
- **Review**: Run sub-agents (QA, UI/UX, Architect) before committing

### Phase 8 — Accessibility Pass
- `aria-label` on wheel SVG, buttons
- Keyboard fallback: `+1 min` / `-1 min` buttons alongside wheel
- Focus styles visible in both themes
- **Review**: Run sub-agents (QA, UI/UX, Architect) before committing

---

## Key Technical Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Blazor WASM initial load size (~8 MB) | Enable AOT trimming + compression in publish; service worker caches after first load |
| Touch autoplay restriction on iOS/Android | Pre-unlock audio context on first `touchstart` anywhere on page |
| Blazor SPA 404 on GitHub Pages direct URL | Copy `index.html` → `404.html` in deploy step |
| `100dvh` inconsistency on older Android | Fallback to `100vh` with `env(safe-area-inset-*)` padding |
| Multi-rotation UX confusion | Show clear badge (`+60m`, `+120m`) + haptic bump via vibration API at each full rotation |

---

## Success Criteria

- ✅ Smooth 60fps touch wheel interaction (no jank on modern mobile devices)
- ✅ Reliable countdown timer (±1 second accuracy)
- ✅ Functional PWA install on iOS and Android
- ✅ Full offline capability after first load
- ✅ Lighthouse PWA score ≥ 90
- ✅ Mobile-first responsive layout works on all modern devices (viewport range: 320px – 2560px)
- ✅ Dark/light mode support via system preference
- ✅ Alarm audio + vibration feedback
- ✅ Clean, maintainable Blazor component architecture

---

## Next Steps

Proceed with **Phase 1 — Project Scaffold** to initialize the Blazor WASM PWA project and verify local build/run.

---

## Phase 9 — Seconds-Based Timer Refactor

### Background

Post-implementation refactor to introduce dynamic step sizes, reduce max duration, and improve alarm sound.

### Resolved Design Decisions

| Question | Decision |
|---|---|
| Max duration | **30 minutes (1800 seconds)** — reduced from 160 minutes |
| Step size below 5 min | **1-second increments** |
| Step size at/above 5 min | **60-second (1-minute) increments** |
| Threshold crossing mid-drag | **Immediate** — step size switches instantly as 5-min boundary is crossed during drag |
| Wheel scale | **One full rotation = 30 minutes** |
| Tick marks | **60 ticks** (one per 30 seconds), long tick every 5 minutes (every 10th tick) |
| Minute-based API members | **Removed entirely** — clean break; no shims |
| Alarm sound | **Web Notification API** (triggers OS sound on desktop) with **440 Hz sine-wave beep** as always-on fallback |

### Overview of Changes

| File | What Changes |
|---|---|
| `ITimerService.cs` | Replace minute-based members with seconds-based equivalents |
| `TimerService.cs` | `MaxSeconds = 1800`; `SecondsPerRotation = 1800`; `SetDuration(int totalSeconds)`; `AddSeconds(int seconds)`; computed `TotalSeconds`, `CurrentRotationSeconds` |
| `TimerWheel.razor` | Dual-step drag; 60 tick marks (30s each); seconds-based parameters; updated ARIA |
| `TimeDisplay.razor` | SetTime mode: `M:SS` for <5 min, `X min` for ≥5 min |
| `TimerPage.razor` | Wire `OnSecondsChanged`; request Notification permission on first interaction |
| `AudioInterop.cs` | Add `RequestNotificationPermissionAsync` |
| `audioInterop.js` | Notification API call + 440 Hz sine-wave fallback beep |
| `TimerServiceTests.cs` | Update all minute-based assertions; add threshold/boundary tests |
| `timer.spec.js` | Update display regex for seconds format; re-baseline snapshots |

### Detailed Design

#### `ITimerService` + `TimerService`

Remove all minute-based members (`MaxMinutes`, `MinutesPerRotation`, `TotalMinutes`, `CurrentRotationMinutes`, `AddMinutes`).

Add seconds-based equivalents:
```csharp
int MaxSeconds { get; }           // = 1800
int SecondsPerRotation { get; }   // = 1800
int TotalSeconds { get; }
int CurrentRotationSeconds { get; }
void SetDuration(int totalSeconds);
void AddSeconds(int seconds);
```

`Rotations` is kept but will always be 0 or 1 at max (1800 s = 1 rotation).

#### `TimerWheel.razor` — Dual-Step Drag Logic

The threshold is 300 seconds (5 minutes). Step size is determined by current `TotalSeconds` at the moment of each pointer event:

```
stepSize = TotalSeconds >= 300 ? 60 : 1          // seconds
degreesPerStep = (360.0 / 1800.0) * stepSize     // 12°/step at ≥5 min, 0.2°/step below
steps = (int)(_accumulatedDelta / degreesPerStep)
```

Crossing the threshold mid-drag immediately changes step size for subsequent movement.

**Progress arc:**
```
progress = CurrentRotationSeconds / 1800.0
offset   = Circumference * (1 - progress)
```

**Tick marks:** 60 ticks at 6° intervals; long tick every 10th (= every 5 minutes).

**Keyboard fallback buttons:** Apply same threshold rule — `+1` adds `stepSize` seconds, `-1` subtracts.

**ARIA:**
```html
aria-valuemax="1800"
aria-valuenow="@TotalSeconds"
aria-valuetext="@FormatAriaValueText()"
```

#### `TimeDisplay.razor` — SetTime Format

```
TotalSeconds == 0       →  "0 min"
0 < TotalSeconds < 300  →  "M:SS"   (e.g. "4:30")
TotalSeconds >= 300     →  "X min"  (e.g. "5 min")
```

Running/paused mode display is unchanged (already uses `RemainingTime` as `TimeSpan`).

#### `AudioInterop.js` — Alarm Sequence

1. If `Notification.permission === 'granted'`: fire `new Notification('Timer finished!')` to trigger OS sound.
2. Always play a 440 Hz sine-wave beep (1.5 s, exponential gain fade) as audible in-page fallback.
3. `requestNotificationPermission()` called once on first user interaction.

### Implementation Order

1. `ITimerService.cs` + `TimerService.cs`
2. `TimerPage.razor`
3. `TimerWheel.razor`
4. `TimeDisplay.razor`
5. `AudioInterop.cs` + `audioInterop.js`
6. `TimerServiceTests.cs`
7. `timer.spec.js`

### New Unit Tests to Add

- `SetDuration(299)` — `TotalSeconds == 299`, `TotalMinutes == 4`
- `SetDuration(300)` — boundary exact
- `SetDuration(1800)` — at max
- `SetDuration(1801)` — clamped to 1800
- `AddSeconds(1)` from 299 → 300 (threshold crossing up)
- `AddSeconds(-1)` from 300 → 299 (threshold crossing down)
- `AddSeconds` floor at 0, ceiling at 1800
