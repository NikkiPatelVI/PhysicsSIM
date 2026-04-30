# NikkiPhysics — AP Physics 1 Study Site

**Live site:** https://nikkipatelvi.github.io/PhysicsSIM/

A personal AP Physics 1 prep site covering all 8 units of the 2025–2026 curriculum.
Built with vanilla HTML, CSS, and JavaScript — no build tools or frameworks.

## What's here

| Section | Description |
|---|---|
| **Unit pages** | Per-topic cheatsheets (formula cards), study guides (big ideas, traps, FRQ frameworks, practice problems), and interactive canvas simulations |
| **FRQ Archive** | Released College Board free-response questions (2015–2023) with annotated model answers and per-point rubric callouts |
| **MCQ Practice** | 32 multiple-choice questions across all 8 units. Practice mode gives instant feedback with "why each wrong answer is wrong." Timed mode simulates the real 45-minute exam section. Progress tracked in localStorage. |

## Units

| # | Topic | Status |
|---|---|---|
| 1 | Kinematics | Cheatsheet + Study Guide |
| 2 | Force & Translational Dynamics | In progress |
| 3 | Work, Energy & Power | In progress |
| 4 | Linear Momentum | In progress |
| 5 | Torque & Rotational Motion | In progress |
| 6 | Energy & Momentum of Rotating Systems | In progress |
| 7 | Oscillations | In progress |
| 8 | Fluid Dynamics (NEW 2025) | Complete — Cheatsheet, Study Guide, 6 simulations |

## Running locally

```bash
npx serve .
# then open http://localhost:3000
```

The site uses `fetch()` to lazy-load tab content, so it must be served over HTTP —
opening `index.html` directly via `file://` will show a "use a local server" message.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full feature backlog prioritized by AP score impact.
