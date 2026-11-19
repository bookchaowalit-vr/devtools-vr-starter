# DESIGN — VR Starter

Two surfaces, two rule sets (ADR-0012 D-9).

## 2D shell (landing bar, Enter VR button, status line)

Follows the ADR-0007 design floor: `lang` set, visible focus ring
(`--color-focus`), 44 px minimum targets, text contrast ≥ 4.5:1 on the dark
surface, `prefers-reduced-motion` honoured, 16 px side gutter, no horizontal scroll at
375 px.

- **Language and font:** the page is English (`lang="en"`), so the stack is
  `system-ui, "Noto Sans", sans-serif`. Noto Sans Thai is not listed because it
  is not loaded; if Thai copy is added, self-host Noto Sans Thai and keep
  `line-height` ≥ 1.6.
- **Consent banner:** checked 2026-11-19, not needed. The page sets no cookies
  and runs no analytics or third-party scripts (runtime dependencies are only
  `three` and `iwer`). The comfort settings live in `localStorage` on the
  device and never leave it. Add a banner before adding any analytics.
- **No dead ends:** when Enter VR is disabled, the page offers "Try the
  emulated headset" (`?emulate=quest3`, labelled as emulated) and "Copy link
  for Quest". It never claims real VR works on a device that has none.
- **Errors** use `--color-error` (`#ff8a80`) with a warning glyph and tell the
  user what to do next; raw runtime messages go to the console only.
- **Keyboard:** the 3D preview canvas is focusable; arrow keys look around.
- **Comfort settings** (snap 30/45/90°, vignette, seated) sit in a collapsed
  `<details>` in the footer, are saved in `localStorage` (guarded by
  try/catch) and feed `setComfort` before a session starts.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#10141c` | page and scene background |
| `--color-surface` | `#1a2030` | header and control bar |
| `--color-text` | `#eef2f8` | body text |
| `--color-muted` | `#b9c3d6` | secondary text |
| `--color-accent` | `#f2a541` | primary button, grabbable object |
| `--color-accent-hover` | `#f6b862` | primary button hover |
| `--color-accent-active` | `#e0932f` | primary button pressed |
| `--color-focus` | `#7fd1ff` | focus ring, teleport marker, play-area edge |
| `--color-error` | `#ff8a80` | error status text |

## Immersive session

Covered by the vr-developer comfort checklist
(architecture-docs `templates/positions/vr-developer/xr-interaction-and-comfort-test.md`),
not by the ADR-0007 checker:

- 1 unit = 1 m; floor at y = 0 in `local-floor`
- Teleport and snap turn (45° default; 30° or 90° from the comfort settings); smooth locomotion off; vignette on
- The camera never moves without user input; teleports and session changes fade (150 ms)
- Grabbable object within reach (~1 m height, 2 m ahead at session start)
- World-space colours reuse the shell tokens so the two surfaces read as one product
