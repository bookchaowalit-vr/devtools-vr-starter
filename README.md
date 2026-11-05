# devtools-vr-starter

Reference WebXR scene for the `bookchaowalit-vr` organisation, built on the
default stack from
[ADR-0012](https://github.com/bookchaowalit/architecture-docs/blob/main/docs/architecture/decisions/ADR-0012-vr-xr-stack-webxr-first.md) (private architecture-docs repository):
TypeScript + three.js + Vite, static deploy, emulated-XR smoke test in CI.
Start every new VR app from this repository.

## What the scene shows

- A floor, a pedestal and one cube you can grab (trigger on the cube)
- Teleport (trigger on the floor) with a target marker and a short fade
- Snap turn (thumbstick left/right, 45°), one turn per push
- An inline 3D preview with mouse/touch orbit when there is no headset
- An Enter VR button that says why VR is unavailable (no WebXR, no HTTPS, no headset)

It contains no product features. Create a product repo from it once a VR
product is approved.

## Repository boundary

- **Owner:** `bookchaowalit-vr`
- **Surface:** VR/XR (WebXR)
- **Book Dev category:** `book-apps/vr`
- **Default branch:** `main`
- **Status:** starter / reference scene

## Layout

| Path | What it holds |
|---|---|
| `src/comfort.ts` | Comfort and locomotion rules: snap turn, teleport validity, vignette, seated offset. Plain functions with unit tests. |
| `src/xr-support.ts` | WebXR availability, button labels, `?emulate=` parsing. Unit-tested. |
| `src/scene.ts` | three.js glue: renderer, rig, controllers, grab, teleport, fade. Kept thin. |
| `src/main.ts` | Boot, emulator opt-in, Enter/Exit VR session handling. |
| `e2e/smoke.spec.ts` | Playwright smoke: inline preview, and enter/exit an emulated Quest 3 session. |
| `DESIGN.md` | 2D shell tokens (ADR-0007) and immersive comfort rules. |

## Live

Production: <https://devtools-vr-starter.vercel.app/> (Vercel project
`devtools-vr-starter`, scope `chaowalit-greepokes-projects`). Open it in the
Quest Browser and press **Enter VR**; on desktop it shows the inline preview,
and `?emulate=quest3` runs the emulated headset.

The project is not Git-connected: deploy with
`vercel deploy --prod --scope chaowalit-greepokes-projects` from a clean
`main` after CI is green and the UI review sign-off is recorded. The team is
on the free plan (100 deployments per rolling 24 h, shared), so count recent
deployments first. Rollback: `vercel promote <previous deployment URL>`.
`.vercelignore` keeps `.env*` (where `vercel link` writes an OIDC token) out
of uploads.

## Local development

Requires Node.js 22+.

```bash
npm ci
npm run dev          # http://localhost:5173
npm test             # Vitest unit tests
npm run typecheck
npm run build && npm run test:e2e   # Playwright smoke against the production build
```

Open `http://localhost:5173/?emulate=quest3` (or `quest2`) to run with the
emulated headset (IWER) in a desktop browser. To try it on a Quest, serve over
HTTPS (WebXR needs a secure context): use the deployed URL, or
`npx vite --host` with an HTTPS tunnel.

On WSL without Chromium system libraries, run the smoke test in the
Playwright image:

```bash
docker run --rm --ipc=host -v "$PWD":/work -w /work -e CI=1 mcr.microsoft.com/playwright:v1.64.1-noble npx playwright test
```

## CI

GitHub Actions on every push and pull request to `main`:

- `web` — shared `ci-node.yml` (platform-ci-workflows v1.5.11): install,
  typecheck, unit tests (required), production build
- `xr-smoke` — Playwright in headless Chromium against the production build,
  inline and with the emulated Quest 3
- `security` — shared security workflow: gitleaks, Semgrep, OSV-Scanner, Trivy

CI cannot run a real headset. Before a release, record a run on the floor
device (Quest 2) in the XR technical design and the comfort playtest record.

## Role templates

ADR-0012 and the templates live in the private `bookchaowalit/architecture-docs`
repository; the links below work for organisation members.

- VR Engineer: [`xr-technical-design.md`](https://github.com/bookchaowalit/architecture-docs/blob/main/templates/positions/vr-engineer/xr-technical-design.md)
- VR Developer: [`xr-interaction-and-comfort-test.md`](https://github.com/bookchaowalit/architecture-docs/blob/main/templates/positions/vr-developer/xr-interaction-and-comfort-test.md)
- Skill: `xr-engineering` in `bookchaowalit/platform-agent-skills`

## License

MIT. See [`LICENSE`](./LICENSE).
