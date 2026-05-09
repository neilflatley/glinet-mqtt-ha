# AGENTS.md

## Project Summary

Node.js app that polls a GL.iNet router's `/rpc` API and publishes status/sensor data to Home Assistant via MQTT. Optional Fastify REST API. TypeScript source transpiled to ES Modules by SWC.

## Commands

| Command | What it does |
|---|---|
| `npm run src` | Run TS source directly via `tsx` with `.env` support (dev) |
| `npm run build` | Transpile TS → JS in `dist/` via SWC (excludes `__tests__`) |
| `node .` | Run transpiled `dist/app.js` (requires `npm run build` first) |
| `npm run start:dev` | SWC watch + nodemon hot-reload loop |
| `npm run test` | Run unit + integration tests (E2E excluded via vitest config) |
| `npm run test:unit` | Run only unit tests (`src/__tests__/*.test.ts`) |
| `npm run test:integration` | Run only integration tests (`src/__tests__/integration/`) |
| `npm run test:e2e` | Run E2E tests (`vitest.e2e.config.ts`) — requires mock router + MQTT broker |
| `npm run test:coverage` | Run unit + integration with V8 coverage report (E2E excluded) |

**README discrepancy**: `npm run test` runs once (`vitest run`), NOT in watch mode. Use `npm run test:watch` for watch mode.

## Build Gotchas

- **SWC, not tsc**: Build uses SWC for transpilation only. No type checking during build.
- **`.ts` → `.js` import transform**: Source files import with `.ts` extensions. SWC's `@swc/plugin-transform-imports` rewrites them to `.js` in `dist/`. `tsx` handles `.ts` imports natively at dev time.
- **`npm run build` excludes tests**: `--ignore **/__tests__` means `dist/` contains no test files.
- **`node .` runs `dist/app.js`**: `package.json` `"main"` is `dist/app.js`.

## Testing Gotchas

- **Test setup overrides env**: `src/__tests__/setup.ts` sets `GLINET_API=false`, `MQTT_HOST=''`, `GLINET_HOST=mock-router` before every test run. Unit tests do NOT connect to real routers or brokers.
- **E2E excluded from main suite**: `vitest.config.ts` has `exclude: ['src/__tests__/e2e/**']`. `npm run test` runs only unit + integration tests. E2E tests only run via `npm run test:e2e`.
- **E2E uses separate config**: `vitest.e2e.config.ts` has `include: ['src/__tests__/e2e/e2e.test.ts']` (only the entrypoint, not scenario files as separate test files). The `test:e2e` script passes `--config vitest.e2e.config.ts`.
- **E2E tests are fully implemented**: 22 tests across 4 scenario files (`login.test.ts`, `refresh.test.ts`, `mqtt.test.ts`, `error.test.ts`). The `e2e.test.ts` entrypoint registers a shared mock router + lifecycle hooks, then imports all scenarios.
- **E2E MQTT broker reads `MQTT_HOST` from env**: Falls back to `mqtt://172.18.0.1:1884` (docker network gateway). CI sets `MQTT_HOST: mqtt://localhost:1884` in the workflow step, which takes precedence over the fallback.
- **E2E tests need a real MQTT broker**: Requires Mosquitto running (see `docker-compose.test.yml` or CI service). Mock router is in `src/__tests__/e2e/mock-router.ts` (TypeScript, not the old `test/mock-router.js`).
- **30s timeout on all tests**: All test configs set `testTimeout: 30000` (30s).
- **Coverage thresholds are low**: `vitest.config.ts` sets lines: 30, branches: 25, functions: 35. See `COVERAGE_GAPS.md` for details.

## Architecture

- **`src/app.ts`** — Main entrypoint. Creates `GlinetController`, does initial `refresh()`, optionally starts Fastify API, then starts MQTT polling loop.
- **`src/controller.ts`** — GL.iNet router RPC client. Handles login (challenge/hash/sid), status refresh, modem info, SMS. `refresh()` makes parallel API calls by default (`GLINET_SEQUENTIAL_API` enables sequential).
- **`src/mqtt.ts`** — MQTT singleton. Connects to broker, publishes HA discovery, polls router at `MQTT_REFRESH` interval. Does nothing if `MQTT_HOST` is unset.
- **`src/api.ts`** — Fastify REST API on port 3000. Endpoints: `/ping`, `/status`, `/refresh`, `/reboot`, `/sms`, `/call`, `/ha-devices`, `/ha-attribute`, `/cell_info`, `/login`.
- **`src/ha/`** — HA device templates (`devices-template.ts`) and mapper (`devices.ts`).
- **`src/models/`** — TypeScript `.d.ts` type declarations only (no implementation).

## Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `GLINET_PASSWORD` | Yes | — | Router admin password |
| `GLINET_HOST` | No | `192.168.8.1` | Router hostname/IP |
| `MQTT_HOST` | No | — | MQTT broker URL. If unset, MQTT integration is disabled. |
| `GLINET_API` | No | `true` | Set to `false` to disable REST API |
| `MQTT_REFRESH` | No | `5` | Polling interval in seconds |
| `GLINET_SEQUENTIAL_API` | No | — | Set to truthy for sequential (slower) API calls |

## Docker

- **Multi-stage build**: Stage 1 (`node:24-alpine`) installs deps + runs `npm run build`. Stage 2 copies `dist/` to `gcr.io/distroless/nodejs24-debian13`.
- **Final image has no shell**: Distroless image runs `dist/app.js` directly. No `npm`, `node` REPL, or shell available in production.
- **`npm ci --omit=dev`** in stage 2: production image only includes runtime dependencies.
- **CI builds**: `build.yml` builds for amd64 and arm64, pushes to GHCR. `test-e2e.yml` runs E2E tests with Mosquitto service before merging to main.

## Conventions

- **ES Modules**: `"type": "module"` in package.json. All imports use `.js` or `.ts` extensions.
- **No lint or typecheck scripts**: Repository has no `npm run lint` or `npm run typecheck`. TypeScript config has `noEmit: true` (type checking only, no output).
- **`.env` files gitignored**: `.env` is in `.gitignore`. Use `.env` to set credentials for development instead of environment variables on the command line. The `npm run src` script loads `.env` automatically via `dotenv/config`.
- **Node 20+ required**: `engines` field requires `>=20.6`. CI uses Node 24, Docker builder uses Node 24.
- **Conventional commits**: Use `<type>: <description>` format (no scope needed for this project). Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
