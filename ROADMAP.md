# PhysicsSIM Roadmap — Path to a 5

Features ranked by how directly they raise an AP Physics 1 score.
AP exam: May 2026.

## Tier 1 — Highest leverage (build first)

### Completed - 1. Past FRQ archive with annotated rubrics
College Board publishes every released FRQ + scoring guide. Build a searchable
archive (filter by unit, year, topic) where each scoring point is called out
inline with the model solution. This matches exactly how the exam is graded
and is the highest-ROI feature on this list.
- Source: apcentral.collegeboard.org (free response questions, 2015–2024)
- UI: list view with unit/year filters → detail view with question, then expandable model answer with `.score-point` callouts (pattern already exists in `studyguide.html`)
- Storage: one HTML fragment per FRQ, indexed by JSON manifest

### Completed - 2. MCQ bank with timed mode + explanations
50% of the AP score is multiple choice. Need ~200 questions across all 8 units,
each with a short explanation of *why each wrong answer is wrong* (not just
which is right).
- Modes: practice (instant feedback) and timed (45 questions / 45 min, like the real exam section)
- Track right/wrong per question in `localStorage`
- Surface accuracy % per unit on the home page

### 3. Mistake log with spaced repetition
Every wrong MCQ or self-marked FRQ point auto-logs to a review queue.
Resurface after 1 day, 3 days, 1 week (Leitner system). This is where most
students plateau — they never revisit errors.
- Storage: `localStorage` keyed by question ID
- "Review queue" mode pulls from items due today

## Tier 2 — Big wins for the redesigned AP1 (2025+)

### 4. Proportional reasoning drills
The redesigned AP1 leans heavily on "if mass doubles and radius halves, what
happens to T?" style questions. A drill mode that procedurally generates these
per topic would directly target a known weak spot.
- Per topic: a list of formulas + which variables can scale
- Generator picks two variables, asks the proportional change in a third

### 5. Experimental design / lab FRQ practice
Section II always includes one experimental design question, often the
lowest-scoring FRQ. Templates for:
- "Design a procedure to measure X"
- "Identify sources of error"
- "What graph would you plot, and what does the slope represent?"

### 6. Free-body diagram drawer
Canvas where Nikki clicks to add force vectors on a scenario, then it grades
against the correct set. FBD errors cascade into lost points across mechanics
units (1, 2, 3, 7).

## Tier 3 — Smaller but valuable

### 7. Cross-unit concept map
Visual showing how energy conservation, Newton's 2nd, and momentum thread
through 5+ units. Trains flexibility in choosing which principle to apply.

### 8. Equation derivations
Expandable section under each formula card showing where it comes from.
Knowing *why* `P + ½ρv² + ρgh = const` exists prevents memorization slips on
novel scenarios.

### 9. Progress dashboard
Per-unit confidence (% correct, last reviewed date) on the home page. Makes
weak units visible at a glance.

### 10. "Daily 10" mode
10 mixed-unit questions each day, drawn from the mistake log + new material.
Keeps earlier units fresh while learning later ones.

## Suggested sequencing

Given the May 2026 exam, prioritize Tier 1 (1 → 2 → 3) then Tier 2 #4. Skip
the polish features (FBD drawer, concept map) unless time allows — they're
nice but won't add as many points as raw exposure to released exam questions
plus a working mistake-log loop.

## Content backlog (per-unit pages)

These are the existing topic pages that still need cheatsheets, study guides,
and simulations filled out:

- Unit 1 — Kinematics ✅ (complete)
- Unit 2 — Force and Translational Dynamics ✅ (complete)
- Unit 3 — Work, Energy, Power ✅ (complete)
- Unit 4 — Linear Momentum ✅ (complete)
- Units 5–6 — Torque, Rotation, Angular Momentum ✅ (complete)
- Unit 7 — Oscillations
- Unit 8 — Fluids ✅ (complete)
