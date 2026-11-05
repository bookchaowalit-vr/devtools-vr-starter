# DESIGN — VR Starter

Two surfaces, two rule sets (ADR-0012 D-9).

## 2D shell (landing bar, Enter VR button, status line)

Follows the ADR-0007 design floor: `lang` set, visible focus ring
(`--color-focus`), 44 px minimum targets, text contrast ≥ 4.5:1 on the dark
surface, `prefers-reduced-motion` honoured, Noto Sans Thai in the font stack,
16 px side gutter, no horizontal scroll at 375 px.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#10141c` | page and scene background |
| `--color-surface` | `#1a2030` | header and control bar |
| `--color-text` | `#eef2f8` | body text |
| `--color-muted` | `#b9c3d6` | secondary text |
| `--color-accent` | `#f2a541` | primary button, grabbable object |
| `--color-focus` | `#7fd1ff` | focus ring, teleport marker |

## Immersive session

Covered by the vr-developer comfort checklist
(architecture-docs `templates/positions/vr-developer/xr-interaction-and-comfort-test.md`),
not by the ADR-0007 checker:

- 1 unit = 1 m; floor at y = 0 in `local-floor`
- Teleport and snap turn (45°) by default; smooth locomotion off; vignette on
- The camera never moves without user input; teleports and session changes fade (150 ms)
- Grabbable object within reach (~1 m height, 2 m ahead at session start)
- World-space colours reuse the shell tokens so the two surfaces read as one product
