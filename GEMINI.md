# Wedding Adventure - Project Rules & Context

## Project Overview
Monorepo managed with **Nx 22** using npm workspaces.

## Apps
- **front** (`apps/front`) - Angular 21 frontend
- **back** (`apps/back`) - NestJS 11 backend (WebSocket with Socket.IO)

## Tech Stack

### Frontend
- **Angular 21** - Components are standalone by default; do NOT use the `standalone` flag when generating components.
- **Tailwind CSS 3** + **DaisyUI 4** for styling.
- **ngx-translate** for i18n.

### Backend
- **NestJS 11** with WebSocket support (`@nestjs/platform-socket.io` + `socket.io`).

### Tooling
- **Nx 22** - build system and task runner.
- **TypeScript 5.9**
- **ESLint 9** with angular-eslint and typescript-eslint.
- **Vitest** for unit tests.
- **Playwright** for e2e tests.
- **Prettier** for formatting.

## Core Rules
- **i18n** (ngx-translate) for ALL user-facing text.
- **API First** approach for all backend interactions.
- **Lazy Loading** for all feature routes.
- **Strict Quality:** 100% test coverage mandatory for all new components/services (SonarQube ready).
- **Zero Code Smells:** Adherence to ESLint and Prettier.
- **Atomic Architecture:** Maximize component atomization and reusability.

## Angular Best Practices (v21)
- Components are standalone by default - no need for `standalone: true`.
- Use **signals** and the new **control flow syntax** (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use **self-closing tags** for components without content (e.g., `<app-header />`).
- Use `inject()` function instead of constructor injection.
- Use `input()`, `output()`, `model()` signal-based APIs instead of `@Input()`, `@Output()`.
- Use `linkedSignal()` and `resource()` where appropriate.
- Prefer `provideRouter`, `provideHttpClient`, etc. over module-based providers.

## Common Commands
```bash
npx nx serve front    # Serve frontend
npx nx serve back     # Serve backend
npx nx build front    # Build frontend
npx nx build back     # Build backend
npx nx test front     # Test frontend
npx nx test back      # Test backend
```

## UI Patterns
- **Minigame Info Panels:** Use a standardized `alert alert-info shadow-sm py-2 px-4 max-w-md` component incorporating an SVG info icon and translated text (e.g. `COLLABORATION_HINT`) at the top of each minigame view to provide players with an immediate understanding of their objective and the need to collaborate.
