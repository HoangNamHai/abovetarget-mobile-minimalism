# Creating an App Icon Effectively — Field Notes

Distilled from building the PMP Exam Pro icon (Yelp-style: blue gradient, white
"PMP" in Anton, three ascending arrows). Ordered by where time was actually won/lost.

---

## 0. TL;DR workflow that worked
1. Lock the **content decisions** first (wordmark text, color, symbol, layout) — ask, don't guess.
2. Write the **prompt to a file**, generate, eyeball, edit the file, regenerate. Treat the prompt as source.
3. Generate **one master 1024×1024 full-bleed square** (the iOS/main icon).
4. **Derive the Android adaptive layers in code** from the master (don't re-generate art):
   gradient background + safe-zoned white logo foreground + monochrome.
5. Drop assets into `app.json` paths, **`expo prebuild`** to sync native, **`run:android`** to verify on device.
6. **Look at it on a real launcher** and fix the mask clipping.

---

## 1. Image generation: pick the reliable engine
- **OpenAI `gpt-image-1` via REST was the dependable path.** `POST /v1/images/generations`,
  `model=gpt-image-1`, `size=1024x1024`, `quality=high`, response is `b64_json`. One call, no auth dance.
- **Gemini (`image-gen-gemini`) burned time on auth/quota:**
  - Workspace / custom-domain Google accounts (e.g. `@company.com`) often have **no consumer Gemini
    image entitlement** — the Google session is valid and the token even rotates, but the webapi
    init/API still rejects it. **Personal `@gmail.com` accounts are what work.**
  - CDP cookie refresh (`cdp_refresh.py`) only yields a usable token if that Chrome profile has a
    **live, logged-in Gemini session**. Symptom of a dead session: the extracted `__Secure-1PSIDTS`
    **does not change** between warmed pulls (a frozen token = rejected). A value that rotates = good.
  - Copying Chrome's cookie DB is **racy** (WAL not flushed) → can return 0 cookies; just retry 2–3×.
  - "Gemini returned text instead of an image" usually means **quota exhausted**, not a bad prompt.
- Takeaway: have a fallback engine; don't sink 30 min into reviving cookies when an API key works.

---

## 2. Prompt engineering for icons
- **Full-bleed square is fought hard by the model.** It loves to draw a rounded "app panel."
  Repeat the negation explicitly: *"sharp 90° corners, gradient fills every edge and corner,
  NO rounded corners, NO border radius, NO inner rectangle, NO frame, NO padding."*
- **Describe layout by reference + position**, not just "like Yelp": e.g. *"small symbol in the
  upper-right above the right end of the wordmark; large wordmark spanning the bottom."*
- **Name the font AND describe it** ("Anton — heavy, tall, condensed sans, thick uniform strokes").
- **Keep multi-part marks together**: *"three arrows grouped tightly as one compact cluster, NOT spread apart."*
- **Control relative size in words**: "small," "large and dominant," "tucked above the right of the text."
- Iterate on a **saved prompt file** so each change is a diff, not a retype.

---

## 3. Android adaptive icons — the part that bites you
Android icons = **background layer + foreground layer**, then the launcher **masks** them
(circle / squircle / rounded-square — varies by device). Only the **central ~66% "safe zone"**
(66dp of the 108dp layer) is guaranteed visible.

**The clipping trap (what happened here):**
- A **wide element placed low** in the frame gets its sides clipped by a **circle** mask, because a
  circle is *narrowest away from its center*. Our "PMP" sat in the lower half → P edges cut off.

**The fix (reusable):**
1. **Scale the logo down** to ~`0.50–0.55 ×` the canvas longest side (we used `0.54`).
2. **Center on the alpha-weighted centroid**, not the bounding-box center. The centroid lands on the
   heavy text mass, so the *text* sits at the circle's widest point. (Our centroid was 62% down —
   centering the bbox instead is exactly what pushed PMP into the clip zone.)
3. Validate by drawing the **66% safe circle** over the composite before shipping.

**Deriving the layers from one master image (no re-gen):**
- **Background** = a clean vertical gradient. Sample the master's top-center and bottom-center
  pixel colors, lerp top→bottom. Seamless, no text.
- **Foreground** = extract the white marks to transparent via a **whiteness mask**:
  `alpha = clamp((min(R,G,B) − lo) / (hi − lo), 0, 1)` (white pixels have high `min(R,G,B)`; blue bg
  has low R → low min). Then crop to content, scale + centroid-place per above.
- **Monochrome** = same white silhouette (for Android themed icons), 432×432.
- Set `adaptiveIcon.backgroundColor` to a **mid color of the gradient** as a fallback.

**iOS / main `icon.png`** = the **full-bleed square master**, untouched. iOS applies its own rounded
mask but keeps far more than a circle, so edge-to-edge art is fine there.

---

## 4. Installing into an Expo app
- `app.json` fields: `expo.icon`, `expo.android.adaptiveIcon.{foregroundImage,backgroundImage,
  monochromeImage,backgroundColor}`, `expo.web.favicon`.
- **CNG projects** (`android/` & `ios/` are git-ignored / generated): editing `app.json` + the PNGs
  is **not enough** — you must **`npx expo prebuild`** to regenerate native icon assets
  (Android mipmap `webp`s, iOS `AppIcon.appiconset`). Prebuild is safe here (nothing hand-edited to lose).
- Gradle needs the SDK: `android/local.properties` → `sdk.dir=$HOME/Library/Android/sdk`
  (or `ANDROID_HOME`). Missing it = "SDK location not found."
- **Launcher icons only refresh on rebuild/reinstall**, never via Fast Refresh.
- Verify on device: `adb exec-out screencap -p`, open the app drawer, crop the icon. The mask shape
  you see is launcher-specific — test the worst case (a hard circle).

---

## 5. Process hygiene that paid off
- **Back up the originals** before overwriting (`artifacts/icons/backup/`).
- **Render a preview at every step** (foreground-on-dark, simulated adaptive composite, safe-circle
  overlay) and actually look at it — caught the rounded-corner and clipping issues early.
- Removed the deprecated `android.edgeToEdgeEnabled` flag flagged by prebuild while in the file.

## 6. Gotchas to remember
- An `OPENAI_API_KEY` (or any secret) printed to the terminal lands in the transcript → **rotate it** after.
- gpt-image-1 white marks can show faint **dithered/grainy edges** in soft-glow areas; fine at icon size.
- The whiteness-mask trick assumes a **light mark on a saturated/dark background**. Invert the logic
  for dark marks on light backgrounds.
