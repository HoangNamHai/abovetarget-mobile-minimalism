#!/usr/bin/env python3
"""
Generate a single self-contained HTML "store-listing preview" for PMP Exam Pro,
aggregating the real icon, feature graphic, screenshots and every metadata field
(with char counts vs store limits) plus release-readiness status flags, for both
Google Play and the Apple App Store.

Images are read from an optimized working dir (default /tmp/pmp-store-preview,
produced by the resize step) and base64-embedded so the output is portable.
Text is read live from fastlane/ metadata so the page always matches the repo.

Usage:  python3 scripts/generate-store-preview.py
Output: artifacts/store-listing-preview.html
"""
import base64, os, html, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
IMG  = pathlib.Path("/tmp/pmp-store-preview")
OUT  = ROOT / "artifacts" / "store-listing-preview.html"
ACCENT = "#0073DD"

def b64(path):
    p = IMG / path
    if not p.exists():
        return ""
    return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode()

def readtext(rel):
    p = ROOT / rel
    return p.read_text().strip() if p.exists() else ""

# ---- metadata (live from repo) ----
A = {  # Google Play
    "title":  readtext("fastlane/metadata/en-US/title.txt"),
    "short":  readtext("fastlane/metadata/en-US/short_description.txt"),
    "full":   readtext("fastlane/metadata/en-US/full_description.txt"),
    "changelog": readtext("fastlane/metadata/en-US/changelogs/default.txt"),
}
I = {  # App Store
    "name":     readtext("fastlane/ios/metadata/en-US/name.txt"),
    "subtitle": readtext("fastlane/ios/metadata/en-US/subtitle.txt"),
    "promo":    readtext("fastlane/ios/metadata/en-US/promotional_text.txt"),
    "desc":     readtext("fastlane/ios/metadata/en-US/description.txt"),
    "keywords": readtext("fastlane/ios/metadata/en-US/keywords.txt"),
    "notes":    readtext("fastlane/ios/metadata/en-US/release_notes.txt"),
    "privacy":  readtext("fastlane/ios/metadata/en-US/privacy_url.txt"),
}

def field(label, value, limit, note="", allow_html=False):
    n = len(value)
    pct = min(100, round(n/limit*100)) if limit else 0
    cls = "ok" if n <= limit*0.85 else ("warn" if n <= limit else "over")
    notehtml = f'<span class="note">{html.escape(note)}</span>' if note else ""
    # Play full description allows a small set of HTML (<b>,<i>,<br>,<ul>) — render it
    # as it will appear in the store; everything else is escaped for safety.
    body = (value if allow_html else html.escape(value)) or '<em>— empty —</em>'
    return f"""
    <div class="field">
      <div class="field-head"><span class="flabel">{html.escape(label)}</span>
        <span class="count {cls}">{n} / {limit}</span></div>
      <div class="bar"><i class="{cls}" style="width:{pct}%"></i></div>
      <div class="ftext">{body}</div>
      {notehtml}
    </div>"""

def shot(src, i):
    return f'<figure class="phone" onclick="zoom(this)"><img loading="lazy" src="{src}" alt="screenshot {i}"></figure>'

def status_rows(rows):
    out=[]
    for mark, text in rows:
        cls={"ok":"s-ok","warn":"s-warn","q":"s-q"}[mark]
        sym={"ok":"✓","warn":"!","q":"?"}[mark]
        out.append(f'<li class="{cls}"><span class="dot">{sym}</span>{html.escape(text)}</li>')
    return "\n".join(out)

play_status = [
    ("ok","versionName 1.1.0 / versionCode 16 — draft on production track"),
    ("ok","Changelog updated for 1.1.0 (attached to vc16)"),
    ("ok","Icon, feature graphic, 4 phone + tablet screenshots present"),
    ("warn","RevenueCat enabled with TEST-STORE key — real purchases can't complete"),
    ("warn","No Play IAP/subscription products created (code expects 3)"),
    ("q","Privacy policy URL, App access (demo login), Account deletion — verify in Console"),
]
ios_status = [
    ("ok","ASC app exists (6782658779); Sign in with Apple offered (Guideline 4.8)"),
    ("ok","Metadata + 6× 6.9\" screenshots present; privacy URL set"),
    ("warn","No App Store release yet — only v1.0.0 build 1 in TestFlight (behind 1.1.0)"),
    ("warn","RevenueCat TEST key; no StoreKit products; Paid Apps agreement likely unsigned"),
    ("warn","Release notes still say \"Initial release\"; Support URL missing"),
    ("q","App Privacy label, reviewer demo account, export-compliance flag — verify"),
]

gen = datetime.date(2026,6,22).isoformat()

and_shots = "".join(shot(b64(f"and_{i}.png"), i) for i in range(1,5) if b64(f"and_{i}.png"))
ios_shots = "".join(shot(b64(f"ios_{i}.png"), i) for i in range(1,7) if b64(f"ios_{i}.png"))

HTML = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PMP Exam Pro — Store Listing Preview</title>
<style>
:root{{--accent:{ACCENT};--bg:#0d0f12;--card:#16191e;--card2:#1d2127;--line:#2a2f37;--tx:#e7eaee;--mut:#8b94a3}}
*{{box-sizing:border-box}}
body{{margin:0;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;background:var(--bg);color:var(--tx)}}
code,.mono{{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}}
header{{position:sticky;top:0;z-index:20;background:rgba(13,15,18,.86);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);padding:14px 22px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}}
header img.appicon{{width:46px;height:46px;border-radius:11px;border:1px solid var(--line)}}
header h1{{font-size:17px;margin:0}}
header .meta{{color:var(--mut);font-size:12.5px}}
.badges{{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}}
.badge{{font-size:11.5px;padding:3px 9px;border-radius:99px;border:1px solid var(--line);color:var(--mut)}}
.badge.v{{color:var(--accent);border-color:var(--accent)}}
nav.tabs{{display:flex;gap:6px;padding:14px 22px 0}}
nav.tabs button{{font:inherit;font-size:13.5px;font-weight:600;color:var(--mut);background:var(--card);border:1px solid var(--line);padding:9px 16px;border-radius:9px 9px 0 0;cursor:pointer}}
nav.tabs button.active{{color:var(--tx);background:var(--card2);border-bottom-color:var(--card2)}}
main{{max-width:1180px;margin:0 auto;padding:0 22px 80px}}
section.platform{{display:none}}
section.platform.active{{display:block}}
.banner{{background:linear-gradient(180deg,#2a1d12,#1d1712);border:1px solid #5a3a1a;border-radius:12px;padding:14px 18px;margin:18px 0}}
.banner b{{color:#ffb86b}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}}
@media(max-width:880px){{.grid{{grid-template-columns:1fr}}}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}}
.card h2{{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut);margin:0 0 14px}}
.kv{{display:grid;grid-template-columns:140px 1fr;gap:6px 14px;font-size:13.5px}}
.kv dt{{color:var(--mut)}}
.kv dd{{margin:0}}
.assets{{display:flex;gap:22px;flex-wrap:wrap;align-items:flex-start}}
.iconwrap{{text-align:center}}
.iconwrap img{{width:120px;height:120px;border-radius:27px;border:1px solid var(--line)}}
.iconwrap.sq img{{border-radius:24px}}
.cap{{color:var(--mut);font-size:11.5px;margin-top:7px}}
.feature img{{width:100%;max-width:520px;border-radius:12px;border:1px solid var(--line)}}
.shots{{display:flex;gap:14px;overflow-x:auto;padding:6px 2px 12px}}
.phone{{margin:0;flex:0 0 auto;width:172px;cursor:zoom-in}}
.phone img{{width:100%;border-radius:16px;border:3px solid #23272e;background:#000;display:block}}
.field{{margin-bottom:16px}}
.field-head{{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}}
.flabel{{font-weight:600;font-size:13px}}
.count{{font-size:12px;font-family:ui-monospace,monospace}}
.count.ok{{color:#5bd17e}}.count.warn{{color:#ffb86b}}.count.over{{color:#ff6b6b}}
.bar{{height:4px;background:var(--card2);border-radius:3px;overflow:hidden;margin-bottom:8px}}
.bar i{{display:block;height:100%}}
.bar i.ok{{background:#3ea968}}.bar i.warn{{background:#e0913a}}.bar i.over{{background:#d64545}}
.ftext{{white-space:pre-wrap;font-size:13px;color:#cdd3db;background:var(--card2);border:1px solid var(--line);border-radius:9px;padding:10px 12px;max-height:230px;overflow:auto}}
.note{{display:block;color:#ffb86b;font-size:12px;margin-top:5px}}
ul.status{{list-style:none;margin:0;padding:0;font-size:13.5px}}
ul.status li{{display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--line)}}
ul.status li:last-child{{border:0}}
.dot{{flex:0 0 20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;margin-top:1px}}
.s-ok .dot{{background:#173d27;color:#5bd17e}}
.s-warn .dot{{background:#3d2a12;color:#ffb86b}}
.s-q .dot{{background:#1f2937;color:#9aa6b6}}
.full{{grid-column:1/-1}}
#lb{{position:fixed;inset:0;background:rgba(0,0,0,.92);display:none;place-items:center;z-index:50;cursor:zoom-out}}
#lb img{{max-width:94vw;max-height:94vh;border-radius:14px}}
.hint{{color:var(--mut);font-size:12px;margin:4px 0 0}}
</style></head><body>
<header>
  <img class="appicon" src="{b64('icon.png')}" alt="icon">
  <div><h1>PMP Exam Pro</h1><div class="meta mono">com.h2ai.pmpexampro</div></div>
  <div class="badges">
    <span class="badge v">v1.1.0</span>
    <span class="badge">Play vc 16</span>
    <span class="badge">iOS build pending</span>
    <span class="badge">reviewed {gen}</span>
  </div>
</header>
<nav class="tabs">
  <button class="active" data-t="play" onclick="tab('play',this)">▶ Google Play</button>
  <button data-t="ios" onclick="tab('ios',this)"> Apple App Store</button>
</nav>
<main>

<section class="platform active" id="play">
  <div class="banner">⚠️ <b>Before publishing:</b> RevenueCat ships the <b>test-store key</b> while purchases are enabled, <b>no Play IAP products</b> exist, and privacy-policy / demo-login / account-deletion need verifying in Console. See <code>docs/release/google-play-publish-checklist.md</code>.</div>
  <div class="grid">
    <div class="card">
      <h2>Identity</h2>
      <dl class="kv">
        <dt>App name</dt><dd>{html.escape(A['title'])}</dd>
        <dt>Package</dt><dd class="mono">com.h2ai.pmpexampro</dd>
        <dt>Version name</dt><dd>1.1.0</dd>
        <dt>Version code</dt><dd>16 (draft)</dd>
        <dt>Track</dt><dd>Production · draft (alongside live v11)</dd>
        <dt>Default language</dt><dd>en-US</dd>
        <dt>Contact email</dt><dd>super.app.manager@gmail.com</dd>
        <dt>Pricing</dt><dd>Free · in-app purchases</dd>
      </dl>
    </div>
    <div class="card">
      <h2>Release readiness</h2>
      <ul class="status">{status_rows(play_status)}</ul>
    </div>
    <div class="card full">
      <h2>Graphic assets</h2>
      <div class="assets">
        <div class="iconwrap sq"><img src="{b64('icon.png')}" alt="icon"><div class="cap">App icon · 512×512</div></div>
        <div class="feature"><img src="{b64('feature.png')}" alt="feature graphic"><div class="cap">Feature graphic · 1024×500</div></div>
      </div>
      <h2 style="margin-top:20px">Phone screenshots · 1440×2308</h2>
      <p class="hint">Click any screenshot to enlarge. Tablet (7"/10") sets also present on Play.</p>
      <div class="shots">{and_shots}</div>
    </div>
    <div class="card full">
      <h2>Listing text</h2>
      {field("App name (title.txt)", A['title'], 30)}
      {field("Short description", A['short'], 80)}
      {field("Full description", A['full'], 4000, allow_html=True)}
      {field("What's new (changelog)", A['changelog'], 500)}
    </div>
  </div>
</section>

<section class="platform" id="ios">
  <div class="banner">⚠️ <b>First App Store release</b> (no public version yet — only v1.0.0 b1 in TestFlight). Build 1.1.0, wire real StoreKit products + prod RevenueCat key, sign Paid-Apps agreement, complete App Privacy + reviewer demo account. See <code>docs/release/apple-appstore-publish-checklist.md</code>.</div>
  <div class="grid">
    <div class="card">
      <h2>Identity</h2>
      <dl class="kv">
        <dt>App name</dt><dd>{html.escape(I['name'])}</dd>
        <dt>Subtitle</dt><dd>{html.escape(I['subtitle'])}</dd>
        <dt>Bundle ID</dt><dd class="mono">com.h2ai.pmpexampro</dd>
        <dt>ASC App ID</dt><dd class="mono">6782658779</dd>
        <dt>SKU</dt><dd class="mono">pmpexampro2026</dd>
        <dt>Team</dt><dd>Phan Thien Dao Nguyen</dd>
        <dt>Privacy URL</dt><dd><a style="color:var(--accent)" href="{html.escape(I['privacy'])}">{html.escape(I['privacy'])}</a></dd>
        <dt>Pricing</dt><dd>Free · in-app purchases</dd>
      </dl>
    </div>
    <div class="card">
      <h2>Release readiness</h2>
      <ul class="status">{status_rows(ios_status)}</ul>
    </div>
    <div class="card full">
      <h2>Graphic assets</h2>
      <div class="assets">
        <div class="iconwrap"><img src="{b64('icon.png')}" alt="icon"><div class="cap">App icon · 1024×1024</div></div>
      </div>
      <h2 style="margin-top:20px">iPhone 6.9" screenshots · 1320×2868</h2>
      <p class="hint">Click any screenshot to enlarge. {sum(1 for i in range(1,7) if b64(f'ios_{i}.png'))} of max 10.</p>
      <div class="shots">{ios_shots}</div>
    </div>
    <div class="card full">
      <h2>Listing text</h2>
      {field("App name (name.txt)", I['name'], 30)}
      {field("Subtitle", I['subtitle'], 30)}
      {field("Promotional text", I['promo'], 170)}
      {field("Description", I['desc'], 4000)}
      {field("Keywords", I['keywords'], 100, "At the limit — trim before adding any")}
      {field("What's New (release notes)", I['notes'], 4000, "Stale — still says 'Initial release'")}
    </div>
  </div>
</section>

</main>
<div id="lb" onclick="this.style.display='none'"><img src="" alt=""></div>
<script>
function tab(t,btn){{document.querySelectorAll('.platform').forEach(s=>s.classList.toggle('active',s.id===t));
document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.toggle('active',b===btn));window.scrollTo(0,0);}}
function zoom(fig){{var lb=document.getElementById('lb');lb.firstElementChild.src=fig.querySelector('img').src;lb.style.display='grid';}}
</script>
</body></html>"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(HTML)
print(f"wrote {OUT}  ({len(HTML)/1024/1024:.1f} MB)")
