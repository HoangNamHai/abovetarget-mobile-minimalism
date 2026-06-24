# Store Marketing Assets — TODO & Reference

**Created:** 2026-06-25 · **App:** PMP Exam Pro (`com.h2ai.pmpexampro` / iOS ASC `6782658779`)
**Context:** v1.1.0 shipped to Google Play (in review). Improving store-listing marketing assets + localization to lift conversion on both stores.
**Research backing this doc:** [`store-video-feature-image-research.md`](store-video-feature-image-research.md) (NotebookLM deep research, 60 sources, profile hai@mana.vn).

---

## ✅ To-do list

- [ ] **Feature graphic** (Google Play, 1024×500) — AI-generate an attractive, on-brand version (current = "Master PMP the Smart Way", purple)
- [ ] **Poster frame** (Apple App Store) — polished thumbnail for the App Preview video (Apple has no "feature graphic"; the poster frame / first screenshot is the visual anchor)
- [ ] **App intro / demo video** — for BOTH App Store (App Preview) and Google Play (promo video)
- [ ] **Multi-language version of the APP** (in-app localization / i18n)
- [ ] **Multi-language version of the SCREENSHOTS** (localized screenshot sets per store listing language)

---

## 1. Feature graphic (Google Play, 1024×500 px)
- Acts as the **cover** for the promo video. Keep **logo/branding centered**; avoid edge "cutoff zones".
- **Extend the brand story — don't duplicate the app icon.**
- Action: AI image-gen (gpt-image-1 / Gemini), verify 1024×500 + ≤15 MB before upload.
- Apple equivalent: **no feature banner** — invest in the **poster frame** and **first screenshot** instead.

## 2. App demo video (both stores)
**Why:** a good preview video can lift conversion **up to ~40%** (AppTweak); showing real UI beats text.
**30-second structure (front-load the magic — first 3s are decisive):**
- **0–5s Hook:** show the most "magical" feature immediately
- **5–25s Core workflow:** 1–3 high-impact features solving real pain points
- **25–30s Close:** bold UI confirmation (e.g. "Quiz Mastered") to drive install
**Design for muted autoplay:** large high-contrast captions, animated touch hotspots.

| | Apple App Store | Google Play |
|---|---|---|
| Length | 15–30s | 30s–2min (rec. 30–60s; only first 30s autoplays) |
| Quantity | up to 3 / localization | 1 / listing |
| Content | **in-app footage only**, no hands/overlays | creative freedom (animation, people) |
| Source | upload to App Store Connect (.mov/.mp4, H.264/AAC, ≤500 MB) | **YouTube URL — ads OFF** |
| Orientation | device-specific (iPhone/iPad separate) | portrait +5% CVR vs landscape (Play 2025 test); portrait for product page, landscape for search TTR |

## 3. Localization — app (i18n)
- Build a **multi-language version of the app** (in-app strings, dates, RTL where needed).
- Prioritize locales by target market; each store listing language should map to a supported in-app language.
- Note: NotebookLM research flags **culturalization > literal translation** (e.g. gamified themes favored in Japan, minimalist/high-utility for US).

## 4. Localization — store screenshots
- Produce **localized screenshot sets** per listing language (translated headlines + localized UI captures), for both Play and App Store.
- The screenshot generator lives at `~/Downloads/pmp-appstore-screenshots` (see memory `app-screenshot-capture`) — extend it for multi-language exports.
- Keep specs per store (Play phone 16:9/9:16, 320–3840 px; Apple per device class).

## 5. Cross-cutting best practices (from research)
- Remove status bar / battery / carrier from all screen captures.
- Caption legibility on the **smallest** supported screen.
- A/B test: **Product Page Optimization** (iOS) / **Store Listing Experiments** (Play); multi-armed bandit for exam-season peaks, Bayesian for steady state.
- Benchmark CVR against the **Education** sub-category, not generic averages.
