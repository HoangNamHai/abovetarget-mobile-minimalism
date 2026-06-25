# iOS Lesson UX/UI & Content Audit — 2026-06-22

End-user audit of the **PMP Exam Pro** lesson experience on **iOS** (iPhone 17, iOS 26 simulator), driving 6 randomly-selected lessons live with Maestro and reviewing every screen.

## Deliverables
- **[audit-report.md](audit-report.md)** — UI/UX findings (severity-rated), screen-by-screen, what's working, coverage notes.
- **[content-audit.md](content-audit.md)** — content/pedagogy/PMP-accuracy findings (math + answer keys verified) for all 6 lessons.
- **[fix-plan.md](fix-plan.md)** — findings regrouped into impact-ordered phases with file paths + effort sizing.
- **[screenshots/](screenshots/)** — 35 frames. All 6 lessons captured at hook + challenge; B2L3 is the full traversal (hook→challenge→reason→transfer→practice→wrap, incl. feedback states). A1L4/B1L2 show the drag-drop challenge; C2L2 the numeric EVM question.

## How it was driven (reproducible)
- Lessons opened via deep link `pmp-exam-pro:///lesson/<id>`.
- **iOS view-hierarchy fetch is very slow** on these content-heavy screens, so Maestro `tapOn`-by-text / `scrollUntilVisible` are unreliable here. Driving used **coordinate** `tapOn point` + `swipe` + screenshots (fast, no hierarchy) — see finding **L-A11Y-1** (add `testID`/labels to fix both a11y and testability).
- Stage navigation used the in-lesson **Quick Jump** grid to reach reason/transfer/practice without answering every gated question.
- `gen_flows.py` generates per-lesson Maestro flows from the answer keys in `assets/data/*.json` (kept for reference; the text-selector flows are superseded by the coordinate approach for iOS).

## Headline
Strong, on-brand, pedagogically sound lesson player. No P0s. Top issues: one **visibly broken** drag-drop placeholder (A1L4), and a recurring **information-scent** problem (options / Check Answer / Continue fall below the fold without a "more below" cue). Content is accurate apart from a handful of trust fixes (EVM numbers, a mislabeled model, invented PMBOK citations, drifting character roles).
