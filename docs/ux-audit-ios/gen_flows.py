#!/usr/bin/env python3
"""Generate Maestro flows that drive a PMP lesson end-to-end (correct answers
from the JSON answer key) and screenshot every screen + feedback state.

Maestro's scrollUntilVisible does not move this app's RN new-arch ScrollView,
so we scroll with explicit `swipe` inside a `repeat while notVisible` loop.
Button labels render UPPERCASE via accessibilityText; option text keeps its
original case. Selectors are exact substrings (no regex specials)."""
import json, re, sys

APP = "com.h2ai.pmpexampro"
SHOT = "docs/ux-audit-ios/screenshots"

def clean(t):
    """Longest run of safe chars (no regex/YAML escaping needed), <=45 chars."""
    t = re.sub(r"\s+", " ", (t or "").strip())
    runs = re.findall(r"[A-Za-z0-9 ,:%/+-]+", t)
    best = max(runs, key=len) if runs else t
    return best.strip()[:45].strip()

def scroll_top(L, n=6):
    L.append(f"- repeat:\n    times: {n}\n    commands:\n      - swipe:\n          direction: DOWN\n          duration: 220")

def scroll_tap(L, text, cap=22):
    """Swipe UP until `text` visible (max `cap`), then tap it.
    Gentle, controlled swipes (~22% of the viewport) avoid overshooting a tall
    multi-line option off the top; settle the momentum before tapping."""
    L.append(f'- repeat:\n    times: {cap}\n    while:\n      notVisible:\n        text: "{text}"\n    commands:\n      - swipe:\n          start: 50%, 62%\n          end: 50%, 40%\n          duration: 400\n      - waitForAnimationToEnd:\n          timeout: 1500')
    L.append('- waitForAnimationToEnd:\n    timeout: 2000')
    L.append(f'- tapOn:\n    text: "{text}"')

def correct_opts(q):
    return [o for o in q.get("options", []) if o.get("correct")]

def emit_question(L, q, lid, sid, qi):
    qt = q.get("type")
    tag = f"{lid}-{sid}-q{qi}"
    scroll_top(L)
    if qt in ("single_select", "multi_select"):
        for o in correct_opts(q):
            scroll_tap(L, clean(o["text"]))
    elif qt == "drag_drop":
        for c in q.get("chips", []):
            zone = next((z for z in q["dropZones"] if z["id"] == c.get("correctZone")), None)
            if not zone:
                continue
            scroll_tap(L, clean(c["label"]))
            scroll_tap(L, clean(zone["label"]))
    scroll_tap(L, "CHECK ANSWER")
    L.append(f"- takeScreenshot: {SHOT}/{tag}-feedback")
    L.append('- tapOn:\n    text: "CONTINUE"')   # feedback sheet (correct path)

def gen_partial(lid):
    """Hook + challenge (first question + feedback) only — fast unique-content capture."""
    d = json.load(open(f"assets/data/{lid}.json"))
    L = [f"appId: {APP}", "---", "- launchApp",
         f"- openLink: pmp-exam-pro:///lesson/{lid}"]
    hook = next(s for s in d["screens"] if s["screen_type"] == "hook")
    ch = next(s for s in d["screens"] if s["screen_type"] == "challenge")
    L.append('- extendedWaitUntil:\n    visible:\n      text: "Exit lesson"\n    timeout: 40000')
    L.append('- waitForAnimationToEnd:\n    timeout: 4000')
    L.append(f"- takeScreenshot: {SHOT}/{lid}-01-hook")
    scroll_tap(L, "CONTINUE")
    L.append('- waitForAnimationToEnd:\n    timeout: 4000')
    L.append(f"- takeScreenshot: {SHOT}/{lid}-02-challenge")
    # answer just the first question to capture a feedback state
    emit_question(L, ch["interaction"]["questions"][0], lid, "02-challenge", 0)
    open(f"docs/ux-audit-ios/flows/{lid}-partial.yaml", "w").write("\n".join(L) + "\n")
    print("wrote", lid, "(partial)")

def gen(lid):
    d = json.load(open(f"assets/data/{lid}.json"))
    L = [f"appId: {APP}", "---", "- launchApp",
         f"- openLink: pmp-exam-pro:///lesson/{lid}"]
    for s in d["screens"]:
        st = s["screen_type"]
        sid = f"{s['screen_number']:02d}-{st}"
        if st == "hook":
            L.append('- extendedWaitUntil:\n    visible:\n      text: "Exit lesson"\n    timeout: 40000')
            L.append('- waitForAnimationToEnd:\n    timeout: 4000')
            L.append(f"- takeScreenshot: {SHOT}/{lid}-{sid}")
            scroll_tap(L, "CONTINUE")
        elif st == "challenge":
            L.append('- waitForAnimationToEnd:\n    timeout: 4000')
            L.append(f"- takeScreenshot: {SHOT}/{lid}-{sid}")
            for qi, q in enumerate(s["interaction"]["questions"]):
                emit_question(L, q, lid, sid, qi)
        elif st == "reason":
            L.append('- waitForAnimationToEnd:\n    timeout: 4000')
            scroll_top(L)
            L.append(f"- takeScreenshot: {SHOT}/{lid}-{sid}")
            scroll_tap(L, "CONTINUE")
        elif st == "transfer":
            L.append('- waitForAnimationToEnd:\n    timeout: 4000')
            scroll_top(L)
            L.append(f"- takeScreenshot: {SHOT}/{lid}-{sid}-intro")
            scroll_tap(L, "START")
            L.append('- waitForAnimationToEnd:\n    timeout: 4000')
            scroll_top(L)
            L.append(f"- takeScreenshot: {SHOT}/{lid}-{sid}-questions")
            for qi, q in enumerate(s["content"]["questions"]):
                emit_question(L, q, lid, sid, qi)
        elif st == "practice":
            L.append('- waitForAnimationToEnd:\n    timeout: 4000')
            scroll_top(L)
            L.append(f"- takeScreenshot: {SHOT}/{lid}-{sid}")
            for qi, q in enumerate(s["content"]["questions"]):
                emit_question(L, q, lid, sid, qi)
        elif st == "wrap":
            L.append('- extendedWaitUntil:\n    visible:\n      text: "BACK TO LESSONS"\n    timeout: 25000')
            L.append('- waitForAnimationToEnd:\n    timeout: 4000')
            L.append(f"- takeScreenshot: {SHOT}/{lid}-{sid}")
    open(f"docs/ux-audit-ios/flows/{lid}.yaml", "w").write("\n".join(L) + "\n")
    print("wrote", lid)

if __name__ == "__main__":
    args = sys.argv[1:]
    partial = "--partial" in args
    for lid in [a for a in args if not a.startswith("--")]:
        (gen_partial if partial else gen)(lid)
