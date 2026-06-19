# Phone screenshots

Drop the Play Store phone screenshots here as `1.png`, `2.png`, … (PNG/JPEG, Play
sizing rules apply). These are marketing assets for the **monograph** UI and should be
regenerated for the new shell — do not reuse the old `pmp-prod-v3` captures.

Generate with `scripts/generate-store-screenshots.py` (ported from pmp-prod-v3 when
needed) or capture manually, then upload via `fastlane upload_screenshots` /
`scripts/google-play-upload.py images`.
