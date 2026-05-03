# NikkiPhysics — AP Physics 1 Study Site

**Live site:** https://nikkipatelvi.github.io/PhysicsSIM/

A personal AP Physics 1 prep site covering all 8 units of the 2025–2026 curriculum.
Built with vanilla HTML, CSS, and JavaScript — no build tools or frameworks.
Includes interactive simulations powered by Matter.js and Canvas.

## What's here

| Section | Description |
|---|---|
| **Unit pages** | Per-topic cheatsheets (formula cards), study guides (big ideas, traps, FRQ frameworks, practice problems), and interactive canvas simulations |
| **FRQ Archive** | Released College Board free-response questions (2015–2023) with annotated model answers and per-point rubric callouts |
| **MCQ Practice** | 32 multiple-choice questions across all 8 units. Practice mode gives instant feedback with "why each wrong answer is wrong." Timed mode simulates the real 45-minute exam section. Progress tracked in localStorage. |

## Units

- Unit 1 — Kinematics ✅ complete
- Unit 2 — Force and Translational Dynamics ✅ complete
- Unit 3 — Work, Energy, Power ✅ complete
- Unit 4 — Linear Momentum ✅ complete
- Units 5–6 — Torque, Rotation, Angular Momentum ✅ complete
- Unit 7 — Oscillations ✅ complete
- Unit 8 — Fluids ✅ complete

## Running locally

```bash
npx serve .
# then open http://localhost:3000
```

The site uses `fetch()` to lazy-load tab content, so it must be served over HTTP —
opening `index.html` directly via `file://` will show a "use a local server" message.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full feature backlog prioritized by AP score impact.
