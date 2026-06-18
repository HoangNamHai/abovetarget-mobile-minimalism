# Phase 2: Content Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port PMP's bundled learning content into the new shell — the lesson type model, the lesson data + accessors, the lesson-image `require()` map + assets, and the sound config + assets — as additive, tested modules. No existing shell code is rewired in this phase (that's Phase 4).

**Architecture:** This is the **data layer** (`src/data/`, `src/types/`, `assets/`). Content is fully bundled (no backend, no network). Data files and the image map are ported **verbatim** from PMP because their relative asset paths (`../../assets/...` from `src/data/`) match the new shell's layout exactly. Assets are copied as binaries. Accessors are covered by tests; the existing shell `questions.ts`/`takeaways.ts` are left untouched.

**Tech Stack:** Expo 56, TypeScript, Jest (`jest-expo`), bundled JSON + `.webp` + `.mp3` assets via Metro.

**Source app:** `/Users/hoangnamhai/Documents/workspace/pmp-prod-v3`

## Global Constraints

- Expo SDK 56, `jest-expo` preset. Test style: plain `test('...', () => {})` with `expect`, no `describe` required (matches `src/contexts/__tests__/session-reducer.test.ts`).
- Run the full suite with `npm test` (it sets `TZ=UTC`); run a single file with `npx jest <path>`.
- Content files are ported **verbatim** from PMP — do NOT hand-edit lesson JSON, the image map entries, or the data/type files except where this plan explicitly says to. Their relative asset paths already match.
- Asset destination layout (mirrors PMP exactly so verbatim `require()`/`import` paths resolve):
  - `assets/data/` ← PMP `assets/data/` (lessons-index.json + 51 lesson JSONs)
  - `assets/images/lessons/` ← PMP `assets/images/lessons/` (349 `.webp`)
  - `assets/sounds/{ui,feedback,transitions,milestones,ambient}/` ← PMP `assets/sounds/`
- Do NOT modify, move, or delete the existing `assets/images/*.png`, `assets/placeholders/`, `assets/fonts/`, `src/data/questions.ts`, or `src/data/takeaways.ts`.
- Metro's default `assetExts` already includes `webp` and `mp3`; do not edit `metro.config.js` unless a bundle/test failure proves otherwise.

---

### Task 1: Port lesson types + lesson data + accessors

**Files:**
- Copy (binary): PMP `assets/data/*.json` → `assets/data/*.json` (52 files)
- Copy (verbatim): PMP `src/types/lesson.ts` → `src/types/lesson.ts`
- Copy (verbatim): PMP `src/data/lessons-data.ts` → `src/data/lessons-data.ts`
- Modify (only if a typecheck/import error requires it): `tsconfig.json`
- Test: `src/data/__tests__/lessons-data.test.ts`

**Interfaces:**
- Consumes: nothing from earlier phases.
- Produces (from `src/data/lessons-data.ts`):
  - `lessonsIndex: LessonsIndex[]`
  - `getAllLessons(): Lesson[]`
  - `findLesson(lessonId: string): Lesson | undefined`
  - `getLessonData(lessonId: string): LessonData | null`
  - And the full type surface re-exported from `src/types/lesson.ts` (`Lesson`, `LessonsIndex`, `LessonData`, `LessonScreen`, the 4 `Question` variants, etc.).

- [ ] **Step 1: Copy the content data and source files**

Run:
```bash
SRC=/Users/hoangnamhai/Documents/workspace/pmp-prod-v3
mkdir -p assets/data src/types src/data
cp "$SRC"/assets/data/*.json assets/data/
cp "$SRC"/src/types/lesson.ts src/types/lesson.ts
cp "$SRC"/src/data/lessons-data.ts src/data/lessons-data.ts
ls assets/data/*.json | wc -l   # expect 52 (lessons-index.json + 51 lessons)
```
Expected: 52 JSON files present; `lesson.ts` and `lessons-data.ts` copied.

- [ ] **Step 2: Write the failing test**

Create `src/data/__tests__/lessons-data.test.ts`:
```typescript
import {
  lessonsIndex,
  getAllLessons,
  findLesson,
  getLessonData,
} from '../lessons-data';

test('lessonsIndex covers the four learning paths', () => {
  expect(lessonsIndex.map((m) => m.path).sort()).toEqual(['A', 'B', 'C', 'D']);
});

test('getAllLessons returns the full bundled lesson set', () => {
  const all = getAllLessons();
  expect(all.length).toBeGreaterThan(40);
});

test('every indexed lesson has resolvable lesson data', () => {
  for (const lesson of getAllLessons()) {
    expect(getLessonData(lesson.id)).not.toBeNull();
  }
});

test('findLesson resolves a known lesson by id', () => {
  const lesson = findLesson('A1L1');
  expect(lesson).toBeDefined();
  expect(lesson?.title).toBe('What is Project Management?');
});

test('getLessonData returns full content with screens for A1L1', () => {
  const data = getLessonData('A1L1');
  expect(data?.lessonId).toBe('A1L1');
  expect(Array.isArray(data?.screens)).toBe(true);
  expect((data?.screens.length ?? 0)).toBeGreaterThan(0);
});

test('getLessonData returns null for an unknown id', () => {
  expect(getLessonData('NOPE-DOES-NOT-EXIST')).toBeNull();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/data/__tests__/lessons-data.test.ts`
Expected: FAIL — module `../lessons-data` not found (before the copy is wired) or, if assets are missing, a JSON import error. (If it fails specifically on JSON default-import typing, proceed to Step 4's tsconfig note.)

- [ ] **Step 4: Make it pass**

The copied `lessons-data.ts` and `lesson.ts` are verbatim and should work as-is. If — and only if — the run reports a JSON import or `resolveJsonModule` error, add these two compiler options to `tsconfig.json` under `compilerOptions` (expo's base usually sets them, so this is a fallback):
```jsonc
    "resolveJsonModule": true,
    "esModuleInterop": true,
```
Do not change anything else. Re-run.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/data/__tests__/lessons-data.test.ts`
Expected: PASS (6 tests). If `every indexed lesson has resolvable lesson data` fails, that is a real content/index mismatch — STOP and report it (do not weaken the assertion).

- [ ] **Step 6: Commit**

```bash
git add assets/data src/types/lesson.ts src/data/lessons-data.ts src/data/__tests__/lessons-data.test.ts tsconfig.json
git commit -m "feat(content): port lesson types, data, and accessors"
```

---

### Task 2: Port lesson images (assets + require map)

**Files:**
- Copy (binary): PMP `assets/images/lessons/*.webp` → `assets/images/lessons/*.webp` (349 files, ~98 MB)
- Copy (verbatim): PMP `src/data/lesson-images.ts` → `src/data/lesson-images.ts`
- Copy (verbatim): PMP `scripts/sync-pwa-images.py` → `scripts/sync-pwa-images.py` (the regenerator; kept for future image updates)
- Test: `src/data/__tests__/lesson-images.test.ts`
- Modify (only if the test proves it necessary): `jest.config.js`

**Interfaces:**
- Consumes: nothing from Task 1 (independent module).
- Produces (from `src/data/lesson-images.ts`):
  - `getLessonThumbnail(thumbnailPath: string): ImageSourcePropType`
  - `getLessonImage(imagePath: string): ImageSourcePropType`
  - `hasLessonImage(imagePath: string): boolean`
  - `lessonImages: Record<string, ImageSourcePropType>`

- [ ] **Step 1: Copy the image assets, the map, and the generator**

Run:
```bash
SRC=/Users/hoangnamhai/Documents/workspace/pmp-prod-v3
mkdir -p assets/images/lessons scripts
cp "$SRC"/assets/images/lessons/*.webp assets/images/lessons/
cp "$SRC"/src/data/lesson-images.ts src/data/lesson-images.ts
cp "$SRC"/scripts/sync-pwa-images.py scripts/sync-pwa-images.py
ls assets/images/lessons/*.webp | wc -l   # expect 349
```
Expected: 349 `.webp` files; `lesson-images.ts` and the script copied.

- [ ] **Step 2: Write the failing test**

Create `src/data/__tests__/lesson-images.test.ts`:
```typescript
import {
  getLessonThumbnail,
  getLessonImage,
  hasLessonImage,
  lessonImages,
} from '../lesson-images';

test('lessonImages map is populated', () => {
  expect(Object.keys(lessonImages).length).toBeGreaterThan(300);
});

test('hasLessonImage is true for a known path and false for an unknown one', () => {
  expect(hasLessonImage('/images/A1L1_comic_menu.webp')).toBe(true);
  expect(hasLessonImage('/images/does_not_exist.webp')).toBe(false);
});

test('getLessonImage returns a resolved asset for a known path', () => {
  expect(getLessonImage('/images/A1L1_comic_menu.webp')).toBeTruthy();
});

test('getLessonThumbnail falls back to the default for an unknown path', () => {
  expect(getLessonThumbnail('/images/missing.webp')).toBeTruthy();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/data/__tests__/lesson-images.test.ts`
Expected: FAIL — module `../lesson-images` not found (before copy wired in).

- [ ] **Step 4: Make it pass**

The copied file is verbatim. Re-run after the copy. If the run fails because Jest cannot transform `.webp` requires (error mentions an unexpected token in a `.webp` file), add a `moduleNameMapper` entry to `jest.config.js` mapping image binaries to a stub — append to the existing `moduleNameMapper` object:
```javascript
    '\\.(webp|png|jpg|jpeg|gif)$': '<rootDir>/__mocks__/fileMock.js',
```
and create `__mocks__/fileMock.js`:
```javascript
module.exports = 'test-file-stub';
```
Only add this if the default jest-expo asset handling fails. Re-run.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/data/__tests__/lesson-images.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add assets/images/lessons src/data/lesson-images.ts scripts/sync-pwa-images.py src/data/__tests__/lesson-images.test.ts jest.config.js __mocks__/fileMock.js
git commit -m "feat(content): port lesson images, require map, and image sync script"
```

> NOTE: `git add` of `jest.config.js`/`__mocks__/fileMock.js` is a no-op if Step 4's fallback was not needed — that is fine.

---

### Task 3: Port sound config + sound assets

**Files:**
- Copy (binary): PMP `assets/sounds/**/*.mp3` → `assets/sounds/**/*.mp3` (12 files, preserve the 5 subfolders)
- Copy (verbatim): PMP `src/types/sound.ts` → `src/types/sound.ts`
- Copy (verbatim): PMP `src/data/sound-config.ts` → `src/data/sound-config.ts`
- Test: `src/data/__tests__/sound-config.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `SOUND_CONFIGS: SoundConfig[]` (from `src/data/sound-config.ts`)
  - The sound type surface from `src/types/sound.ts` (`SoundName`, `SoundCategory`, `SoundConfig`, …).

- [ ] **Step 1: Copy the sound assets and source files**

Run:
```bash
SRC=/Users/hoangnamhai/Documents/workspace/pmp-prod-v3
mkdir -p assets/sounds
cp -R "$SRC"/assets/sounds/* assets/sounds/
cp "$SRC"/src/types/sound.ts src/types/sound.ts
cp "$SRC"/src/data/sound-config.ts src/data/sound-config.ts
find assets/sounds -name '*.mp3' | wc -l   # expect 12
```
Expected: 12 `.mp3` files across `ui/feedback/transitions/milestones/ambient`; `sound.ts` and `sound-config.ts` copied. (If a stray `.DS_Store` was copied, delete it: `find assets/sounds -name .DS_Store -delete`.)

- [ ] **Step 2: Write the failing test**

Create `src/data/__tests__/sound-config.test.ts`:
```typescript
import { SOUND_CONFIGS } from '../sound-config';

test('there are twelve sound configs', () => {
  expect(SOUND_CONFIGS).toHaveLength(12);
});

test('every sound name is unique', () => {
  const names = SOUND_CONFIGS.map((c) => c.name);
  expect(new Set(names).size).toBe(names.length);
});

test('every config has a filename, a known folder, and a valid volume', () => {
  const folders = ['ui', 'feedback', 'transitions', 'milestones', 'ambient'];
  for (const c of SOUND_CONFIGS) {
    expect(c.fileName.length).toBeGreaterThan(0);
    expect(folders).toContain(c.folder);
    expect(c.volume).toBeGreaterThan(0);
    expect(c.volume).toBeLessThanOrEqual(1);
  }
});

test('includes the loopable ambient study-mode track', () => {
  const studyMode = SOUND_CONFIGS.find((c) => c.name === 'study-mode');
  expect(studyMode?.isLoopable).toBe(true);
  expect(studyMode?.folder).toBe('ambient');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/data/__tests__/sound-config.test.ts`
Expected: FAIL — module `../sound-config` not found.

- [ ] **Step 4: Make it pass**

The copied files are verbatim; re-run after the copy. No code changes expected.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/data/__tests__/sound-config.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Run the full suite (regression gate)**

Run: `npm test`
Expected: PASS — all Phase 1 + Phase 2 tests green, no regression in the existing shell suites.

- [ ] **Step 7: Commit**

```bash
git add assets/sounds src/types/sound.ts src/data/sound-config.ts src/data/__tests__/sound-config.test.ts
git commit -m "feat(content): port sound config and audio assets"
```

---

## Self-Review

**Spec coverage (Phase 2 = the design's "Content & data layer" section):**
- `lessons-data.ts` (~51 lessons, 4 paths) + accessors → Task 1 ✓
- `src/types/lesson.ts` + `src/types/sound.ts` → Tasks 1, 3 ✓
- `lesson-images.ts` require map + `.webp` assets + generator script → Task 2 ✓
- `sound-config.ts` + `.mp3` assets → Task 3 ✓
- Existing `questions.ts`/`takeaways.ts` left as competing-free view models for Phase 4 → untouched (Global Constraints) ✓

**Intentionally deferred (not gaps):** rewiring `questions.ts`/`takeaways.ts` to render from the canonical lesson model is Phase 4 (UI). `Lesson.isPremium`/`locked` are carried in the data but the subscription gate that reads them is Phase 5.

**Placeholder scan:** none — every step is a concrete command or complete test code.

**Type consistency:** accessor signatures (`getAllLessons`/`findLesson`/`getLessonData`) and image-map functions (`getLessonThumbnail`/`getLessonImage`/`hasLessonImage`) are quoted from the verbatim PMP source and exercised by the tests exactly as named.

**Risk notes for the executor:**
- Tasks copy ~98 MB of images into the repo — this is intentional (bundled product content for the shipping app), but it materially grows repo size. Flagged, not blocked.
- The two conditional config fallbacks (tsconfig `resolveJsonModule`, jest `moduleNameMapper` for `.webp`) are expected to be unnecessary on a default Expo 56 + jest-expo setup; they are included so a transform/typing failure has an in-plan resolution rather than improvisation.
