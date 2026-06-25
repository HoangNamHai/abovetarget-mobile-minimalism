# Content Audit: 6 PMP Lessons (A1L4, B1L2, B2L3, C2L2, C3L1, D2L1)

> Source: `assets/data/*.json`. Reviewer verified all EVM/EMV math and answer keys.
> Severity: [P0 broken/wrong] · [P1 trust] · [P2 polish] · [P3 nitpick]

## Executive Summary (cross-cutting themes)

- **EVM rounding propagates a real error in C2L2.** True CPI = $96K/$140K = **0.6857**, rounded to 0.69. EAC taught as $240K/0.69 = $348K (marked correct), but pure EAC = BAC×AC/EV = **$350,000**, overrun **$110K** — yet the hook/challenge/wrap repeat "$108K". Internally consistent with the 0.69 rounding, but a learner computing from raw numbers gets a different answer. The transfer-screen BAC reduction is also arithmetically inconsistent.
- **PMBOK-7 terminology drift on "power types" (B1L2).** Lesson teaches "Legitimate, Expert, Referent, **Persuasive**" power. French & Raven canon is Legitimate/Expert/Referent/Reward/**Coercive**/Informational. "Persuasive power" is fabricated; practice_3 even offers "Coercive Power" as a distractor that the teaching never defines.
- **Many "PMBOK 7th Ed, page NNN" citations appear invented/unverifiable** (B1L2 "Section 2.2"; C3L1 "pages 123-125, 127, 131, 89"; D2L1 "page 82/178/192", "Agile Practice Guide page 52/58"). Risk of eroding trust if a studious user checks them.
- **Strong pedagogical arc and answer-key accuracy overall.** hook→challenge→reason→transfer→practice→wrap is consistent; distractors are plausible; the vast majority of answer keys are correct with justifying explanations. B2L3, C3L1, D2L1 are pedagogically strongest.
- **Two debatable answer keys:** B2L3 teaches "Compromise = Lose-Lose" (a contested PMI heuristic) and labels an accommodating response "WITHDRAW"; C2L2's rounding makes one EAC item ambiguous.
- **Recurring character names are reassigned to different roles across lessons** (Maya, Taylor, Devon, Jordan, Carlos, Sam, Elena all drift) — the biggest cross-lesson consistency risk.

---

## A1L4 — Project Life Cycles
- **[P3→visible]** challenge q1 (drag_drop) contains stray scaffolding: chip `{"id":"chip","label":"Chip","correctZone":"description"}` + dropZone `{"id":"description","label":"Description","detail":"Correct Zone"}`. Renders a bogus "Chip → Description" pair. **Fix:** delete both.
- **[P3]** PMP accuracy solid — Predictive/Adaptive/Hybrid, the continuum, tailoring all align with PMBOK 7. practice_3 velocity math (120÷24=5 sprints) correct.
- **[P3]** Answer keys all verified correct (transfer Predictive/Adaptive/Hybrid; practice Hybrid/C/B/B).

## B1L2 — Stakeholder Power/Interest Grid
- **[P1]** reason tab1 calls the Power/Interest Grid "(also called Stakeholder Salience Model)." **Wrong** — the Salience Model (Mitchell/Agle/Wood: Power/Legitimacy/Urgency → 7 types) is a different model. **Fix:** delete parenthetical or say "(Power/Interest matrix)."
- **[P1]** "Persuasive Power" (objective, challenge q3, reason tab3) is non-standard. **Fix:** rename to "Informational Power."
- **[P2]** practice_3 distractor "Coercive Power" is never taught; taught "Persuasive" type never appears as an option. Align taught types ↔ tested distractors.
- **[P1]** reason tab5 cites "Stakeholder Performance Domain, Section 2.2" — unverifiable locator. **Fix:** drop the section number.
- **[P3]** Answer keys all correct (q1/q2 drag, q4 multi, q5 Monitor, q6 C; practice 1–4 correct).

## B2L3 — Conflict Resolution Strategies
- **[P1]** Teaches **Compromise = "Lose-Lose"** (objective, reason tab1/4/5, takeaways). Contested framing; matches a Rita-Mulcahy exam convention so defensible, but PMI doesn't state it that flatly. **Fix:** soften to "partial satisfaction / neither fully wins."
- **[P2]** challenge q3 correct answer labeled "WITHDRAW now, COLLABORATE later" but the option text ("Thanks for the feedback. Let's discuss specifics after the meeting") reads as accommodate/smooth. practice_2 calls the same move "strategic withdrawal." Loose taxonomy. **Fix:** add a clarifying line (withdrawal-of-venue, not accommodation-of-position).
- **[P2]** challenge q2 (loading dock): "compromise" answer is defensible but staggering times is itself a creative solution; the compromise/collaborate line is thin. Tighten the constraint.
- **[P3]** Hook headline "Four Conflicts. Five Strategies." but only **three** failure_cards shown.
- **[P1]** reason tab5 cites "PMBOK 7th Edition: Pages 168-169" + "Page 259 (Process Groups Practice Guide)" — likely invented. **Fix:** remove page numbers.
- **[P3]** Other answer keys verified sound (q1/q4 Collaborate, transfer push-back-collaborate + safety=Force, practice Win-Win/B/Compromise/Force).

## C2L2 — Earned Value Management
- **[P1]** **CPI rounding inconsistency.** EAC option C ($348K, marked correct) uses CPI=0.69; pure math gives **$350K**, overrun **$110K**, but narrative repeats "$108K". **Fix:** state "using CPI rounded to 0.69" or pick numbers giving a clean CPI (e.g., AC=$160K → CPI=0.60).
- **[P1]** transfer BAC arithmetic inconsistent: "$240K − $60K patio = $180K" ignores a stated $15K contract saving; reason tab5 says that saving was **$20K** and revised EAC ≈ $280K, while transfer says EAC ≈ $212K. Three conflicting number sets. **Fix:** reconcile to one set.
- **[P2]** reason tab3 "CPI stabilizes after 20-30% complete" stated as law; it's an empirical heuristic. Soften "will not magically improve."
- **[P3]** All core formulas correct (CV/SV/CPI/SPI/EAC/ETC/VAC) and individual values verified: PV $120K, EV $96K, CV −$44K, SV −$24K, SPI 0.80, transfer CPI 0.85 / EAC $212K, practice_1 EV $200K, practice_3 EAC $500K.

## C3L1 — Risk Identification & Analysis
- **[P3]** PMP accuracy strong — Delphi, RBS categories, EMV=P×Impact, escalation criteria all align with PMBOK 7. Root-cause categorization (currency/chip-shortage = External) correct.
- **[P3]** All EMV math verified (Currency $420K, Tech $200K, Staffing $150K, Supply $120K, Regulatory $480K; practice_3 Risk A $80K highest). Answer keys all correct.
- **[P1]** Citations "PMBOK 7th Ed, Pages 123-125/127/131/89" unverifiable + oddly ordered. **Fix:** cite "Uncertainty Performance Domain" by name.
- **[P2]** Risk-vs-Issue distinction is a stated objective + wrap takeaway but never tested. **Fix:** add a test item or drop from objectives.

## D2L1 — User Story Writing (INVEST)
- **[P3]** INVEST content accurate and well-taught; epic-vs-story, acceptance criteria, "points = effort not time" all correct.
- **[P3]** All answer keys verified correct (q1 Estimable, q2 B, q3 Split, q4 Independent/Testable; transfer C/Small/[A,C,D,F]; practice Estimable/Split/Testable/Independent). Distractors excellent.
- **[P2]** transfer_q1 option B: **"As a anyone..."** grammatical error (reads as typo, not deliberate-bad-example). **Fix:** reword.
- **[P1]** Citations "page 82/178/192", "Agile Practice Guide page 52/58" unverifiable. **Fix:** remove page numbers.

## Highest-priority content fixes
1. **C2L2** — reconcile CPI rounding ($108K vs $110K) + the $15K/$20K/$180K/$212K/$280K corrective-action numbers. (P1)
2. **B1L2** — fix "Salience Model" mislabel; rename "Persuasive"→"Informational" power; align Coercive distractor. (P1)
3. **All lessons** — strip invented "PMBOK page NNN" citations; cite named domains. (P1)
4. **A1L4** — delete the stray placeholder "Chip/Description" drag-drop pair. (visible breakage)
5. **Cross-lesson** — stabilize recurring character names↔roles. (P2)
</content>
