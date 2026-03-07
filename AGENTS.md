# AGENTS.md — OpenCode Agent Guidelines for PWA Timer Wheel

## Project Context

This is a **Blazor WebAssembly Progressive Web App (PWA)** called **Timer Wheel**, designed for mobile-first interaction. See `PLAN.md` for the full technical specification and `docs/PRE_REQUIREMENT.md` for functional requirements.

**Tech Stack:**
- `.NET 9` Blazor WebAssembly
- C# / Razor Components
- SVG for wheel rendering
- CSS custom properties for theming (light/dark mode)
- JavaScript interop for audio + vibration
- GitHub Actions CI/CD → GitHub Pages deployment (`/timer-app/` subpath)

---

## Critical Rules for Code Changes

### ⚠️ NEVER Auto-Commit or Auto-Push

**You must NEVER automatically commit changes to git and push them to the remote repository unless the user explicitly requests it.**

Examples of explicit requests:
- "Commit your changes"
- "Create a commit with..."
- "Push this to GitHub"
- "Make a git commit"

If you make code changes, you MUST:
1. Show the user what was changed
2. Explain the changes clearly
3. Ask if they want to commit and push, OR wait for explicit instruction
4. Only commit/push if the user explicitly approves

**Exception:** If a pre-commit hook automatically modifies files (e.g., linter, formatter) and you are creating a commit that the user requested, you may amend to include those auto-modifications. But this is rare and requires that the commit was already created at the user's request.

---

## Development Practices

### Code Quality
- All C# code follows Microsoft's [C# Coding Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- Blazor components use `.razor` syntax; keep component logic minimal, extract to services
- SVG rendering in `TimerWheel.razor` must be optimized for touch interaction (avoid deep DOM trees)
- CSS uses design tokens (CSS custom properties) for theming — no hardcoded colors in component styles

### Accessibility (a11y)
- All interactive elements must have semantic HTML + ARIA labels
- Keyboard support: wheel interaction should have `+1 min` / `-1 min` button fallbacks
- Focus styles must be visible in both light and dark modes
- Test with screen readers (NVDA / JAWS or browser DevTools)

### Mobile-First Design
- Base viewport: 320px width (minimum modern support)
- Largest viewport: 2560px (desktop + tablets)
- Touch targets: minimum 48px × 48px
- Use `touch-action: none` on interactive SVG to prevent scroll
- Test on real devices or browser DevTools device emulation

### Testing
- Unit tests for `TimerService` state machine (mock time, verify state transitions)
- Manual testing on iOS Safari + Chrome Mobile (audio autoplay policies differ)
- Lighthouse audit before each major milestone (target PWA score ≥ 90)
- **Playwright integration tests**: Use Playwright to automate visual design verification, accessibility checks, and UI interaction flows. Take snapshots of both light and dark modes across multiple viewport sizes (320px, 768px, 1024px, 2560px) to ensure responsive design compliance. Verify touch/mouse interactions, button states, and animations.

### Performance
- Blazor publish with AOT trimming enabled (`.csproj` setting)
- Service worker caching strategy: cache-first for static assets, network-first for API (N/A here)
- Initial load time target: < 3 seconds on 4G mobile

---

## File Naming & Organization

```
src/TimerApp/
├── Pages/
│   └── TimerPage.razor              # Main app page (route: /)
├── Components/
│   ├── TimerWheel.razor             # SVG wheel + interaction logic
│   ├── TimeDisplay.razor            # Time readout (mm:ss or HH:mm:ss)
│   └── ControlButtons.razor         # Start/Pause/Reset/Repeat buttons
├── Services/
│   └── TimerService.cs              # Core countdown state machine
├── Interop/
│   ├── AudioInterop.cs              # C# wrapper for audio/vibration JS
│   └── audioInterop.js              # JS module for audio context + play└── wwwroot/
    ├── app.css                      # Global styles + CSS tokens
    ├── index.html                   # Entry point (base href: /timer-app/)
    ├── manifest.webmanifest         # PWA manifest
    ├── icons/                       # App icons (192px, 512px, maskable)
    ├── audio/
    │   └── alarm.mp3                # Alarm sound
    └── service-worker.*             # Blazor-generated PWA files
```

---

## Branching & Commits

- **Main branch**: `main` — stable, deployable code
- **Feature branches**: `feature/...` for new work (e.g. `feature/timer-wheel-interaction`)
- **Bug fix branches**: `fix/...` for bug fixes (e.g. `fix/audio-autoplay-ios`)

**Commit message style:**
```
Type: Short imperative summary (50 chars max)

Longer explanation if needed. Reference issues with #123.
- Bullet points for notable changes
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

Example:
```
feat: Add multi-rotation wheel with 160-minute cap

- Track full rotation count separately
- Display +1h, +2h badge when time > 60 min
- Snap to 1-minute intervals
- Add vibration feedback on rotation boundary
```

---

## Common Tasks & Workflows

### Adding a New Component
1. Create `src/TimerApp/Components/MyComponent.razor`
2. Follow Blazor component structure:
   ```razor
   @namespace TimerApp.Components
   @implements IAsyncDisposable

   <div class="my-component">
       <!-- UI here -->
   </div>

   @code {
       // Component logic here
   }
   ```
3. Register in `_Imports.razor` if needed (or use full namespace)
4. Add responsive styles to `wwwroot/app.css` or component-scoped CSS

### Modifying the Timer State Machine
1. Edit `src/TimerApp/Services/TimerService.cs`
2. Ensure state transitions are valid (consult `PLAN.md` state diagram)
3. Test with unit tests (target: 100% code coverage for `TimerService`)
4. Update components that depend on state changes

### Updating Styles for Dark Mode
1. Use CSS custom properties: `var(--bg)`, `var(--text)`, `var(--accent)`, etc.
2. Define tokens in `:root` (light mode) and `@media (prefers-color-scheme: dark)` (dark mode)
3. No hardcoded hex colors in component styles

### Publishing a Release
1. Ensure `main` branch is tested and passes Lighthouse
2. Create a git tag: `git tag v1.0.0`
3. Push tag: `git push origin v1.0.0`
4. CI/CD pipeline automatically deploys to GitHub Pages

---

## Product Quality Process

Code review and quality assurance are automated via **sub-agents** as defined in `SUB_AGENTS.md`. The quality process ensures:

- **Correctness & Testing** (QA Tester Agent): Reviews for bugs, edge cases, logical errors, and missing tests
- **Accessibility & UX** (UI/UX Designer Agent): Evaluates UI components for usability, accessibility, and design compliance
- **Architecture & Maintainability** (Architect / Code Reviewer Agent): Reviews structure, modularity, and SOLID principles adherence

**Trigger:** Sub-agents are invoked automatically after code tasks complete (based on task size and scope per `SUB_AGENTS.md`).

**Report Format:** All findings use the standard output structure defined in `SUB_AGENTS.md`:
- Severity (critical / high / medium / low / info)
- Agent name
- File & line location
- Issue description
- Concrete suggestion
- Conflict risk flag

**Prioritization:** Address findings in order: `critical` → `high` → `medium` → `low` / `info`

Refer to `SUB_AGENTS.md` for full definitions, conflict resolution rules, and task size reference.

---

## Known Constraints

- **No persistence**: Timer state does not survive page reload. By design.
- **Offline capability**: First load must be online; thereafter works offline via service worker.
- **iOS audio quirks**: Must unlock audio context via user gesture (touch/tap); no autoplay without user interaction.
- **GitHub Pages SPA routing**: Direct URL navigation requires `404.html` trick (copy of `index.html`); CI/CD handles this automatically.
- **PWA manifest base path**: `start_url` must match deployment subpath (`/timer-app/`); update if deployment path changes.

---

## Resources

- Blazor docs: https://learn.microsoft.com/en-us/aspnet/core/blazor/
- PWA checklist: https://web.dev/pwa-checklist/
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- CSS custom properties: https://developer.mozilla.org/en-us/docs/Web/CSS/--*
- Touch events: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events

---

## Questions or Clarifications?

If an agent encounters ambiguity or needs clarification on design decisions, refer to:
1. This file (`AGENTS.md`)
2. `SUB_AGENTS.md` (product quality process and sub-agent definitions)
3. `PLAN.md` (technical specification)
4. `docs/PRE_REQUIREMENT.md` (functional requirements)

If guidance is still unclear, **ask the user** for clarification before proceeding.

---

**Last Updated:** 2026-03-07
