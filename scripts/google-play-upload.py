#!/usr/bin/env python3
"""
Google Play Store Management CLI for PMP Exam Pro

Features:
- Check app status and release readiness
- Upload AAB to any track
- Release notes and staged rollout
- Version bumping
- Beautiful terminal output with Rich

Install dependencies:
  pip install click rich google-auth google-api-python-client
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Optional

try:
    import click
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install click rich")
    sys.exit(1)

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError
except ImportError:
    print("Missing Google dependencies. Install with:")
    print("  pip install google-auth google-api-python-client")
    sys.exit(1)

# Configuration
PACKAGE_NAME = "com.h2ai.pmpexampro"
SERVICE_ACCOUNT_FILE = Path(__file__).parent.parent / "pc-api-9211159543626347762-239-4d9390d4bf09.json"
APP_JSON_FILE = Path(__file__).parent.parent / "app.json"

TRACKS = ["internal", "alpha", "beta", "production"]
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]

console = Console()


def get_service():
    """Get authenticated Google Play API service."""
    if not SERVICE_ACCOUNT_FILE.exists():
        console.print(f"[red]Error:[/red] Service account file not found: {SERVICE_ACCOUNT_FILE}")
        sys.exit(1)

    with open(SERVICE_ACCOUNT_FILE) as f:
        sa_info = json.load(f)

    credentials = service_account.Credentials.from_service_account_info(sa_info, scopes=SCOPES)
    return build("androidpublisher", "v3", credentials=credentials)


def get_current_version():
    """Get current version from app.json."""
    if not APP_JSON_FILE.exists():
        return None, None

    with open(APP_JSON_FILE) as f:
        app_config = json.load(f)

    version = app_config.get("expo", {}).get("version", "1.0.0")
    android_config = app_config.get("expo", {}).get("android", {})
    version_code = android_config.get("versionCode", 1)

    return version, version_code


@click.group()
@click.version_option(version="1.0.0", prog_name="Google Play Upload CLI")
def cli():
    """Google Play Store Management CLI for PMP Exam Pro"""
    pass


@cli.command()
def status():
    """Check app status and what's needed to go live."""
    console.print(Panel.fit(
        "[bold blue]Google Play Console Status Check[/bold blue]",
        border_style="blue"
    ))

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True
    ) as progress:
        progress.add_task("Connecting to Google Play API...", total=None)
        service = get_service()

        try:
            # Create an edit to access app data
            edit = service.edits().insert(body={}, packageName=PACKAGE_NAME).execute()
            edit_id = edit["id"]

            # Get app details
            progress.add_task("Fetching app details...", total=None)
            app_details = service.edits().details().get(
                packageName=PACKAGE_NAME, editId=edit_id
            ).execute()

            # Get all tracks
            tracks_response = service.edits().tracks().list(
                packageName=PACKAGE_NAME, editId=edit_id
            ).execute()

            # Delete edit (we're just reading)
            service.edits().delete(packageName=PACKAGE_NAME, editId=edit_id).execute()

        except HttpError as e:
            error = json.loads(e.content.decode()).get("error", {})
            console.print(f"[red]API Error:[/red] {error.get('message', str(e))}")
            return

    # Local version info
    version, version_code = get_current_version()

    # App Info Table
    info_table = Table(title="📱 App Information", show_header=False, border_style="cyan")
    info_table.add_column("Field", style="bold")
    info_table.add_column("Value")
    info_table.add_row("Package Name", PACKAGE_NAME)
    info_table.add_row("Default Language", app_details.get("defaultLanguage", "Not set"))
    info_table.add_row("Contact Email", app_details.get("contactEmail", "[red]Not set[/red]"))
    info_table.add_row("Contact Phone", app_details.get("contactPhone", "[dim]Not set[/dim]"))
    info_table.add_row("Contact Website", app_details.get("contactWebsite", "[dim]Not set[/dim]"))
    info_table.add_row("Local Version", f"{version} ({version_code})" if version else "[dim]Unknown[/dim]")
    console.print(info_table)
    console.print()

    # Tracks Table
    tracks_table = Table(title="🚀 Release Tracks", border_style="green")
    tracks_table.add_column("Track", style="bold")
    tracks_table.add_column("Status")
    tracks_table.add_column("Version Code")
    tracks_table.add_column("Rollout")

    tracks = tracks_response.get("tracks", [])
    track_status = {}

    for track in tracks:
        track_name = track.get("track", "unknown")
        releases = track.get("releases", [])

        if releases:
            latest = releases[0]
            status = latest.get("status", "unknown")
            version_codes = latest.get("versionCodes", [])
            user_fraction = latest.get("userFraction")

            status_display = {
                "completed": "[green]✓ Live[/green]",
                "inProgress": "[yellow]⟳ Rolling out[/yellow]",
                "draft": "[blue]📝 Draft[/blue]",
                "halted": "[red]⏸ Halted[/red]"
            }.get(status, status)

            rollout_display = f"{user_fraction * 100:.0f}%" if user_fraction else "100%"
            version_display = ", ".join(version_codes) if version_codes else "-"

            tracks_table.add_row(track_name, status_display, version_display, rollout_display)
            track_status[track_name] = {"status": status, "versions": version_codes}
        else:
            tracks_table.add_row(track_name, "[dim]No releases[/dim]", "-", "-")
            track_status[track_name] = {"status": None, "versions": []}

    console.print(tracks_table)
    console.print()

    # Checklist for going live
    console.print(Panel.fit(
        "[bold yellow]📋 Checklist to Go Live[/bold yellow]",
        border_style="yellow"
    ))

    # Check if app has any release
    has_internal = track_status.get("internal", {}).get("status") is not None
    has_production = track_status.get("production", {}).get("status") == "completed"

    # Build checklist
    checks = [
        (bool(app_details.get("contactEmail")), "Contact email set in app details"),
        (True, "Privacy policy URL set (check Play Console)"),
        (True, "App content declarations completed (check Play Console)"),
        (True, "Store listing (title, description, screenshots)"),
        (True, "Content rating questionnaire completed"),
        (True, "Target audience and content settings"),
        (True, "Data safety form completed"),
        (has_internal, "At least one internal test release uploaded"),
        (has_production, "Production release published"),
    ]

    for done, text in checks:
        icon = "[green]✓[/green]" if done else "[red]○[/red]"
        style = "" if done else "[dim]"
        console.print(f"  {icon} {style}{text}")

    console.print()

    # Next steps
    console.print(Panel.fit(
        "[bold cyan]📌 Recommended Next Steps[/bold cyan]",
        border_style="cyan"
    ))

    if not has_internal:
        console.print("  1. Upload first build to internal testing:")
        console.print("     [dim]python scripts/google-play-upload.py upload --aab build.aab --track internal --draft[/dim]")
    elif not has_production:
        console.print("  1. Complete all Play Console requirements")
        console.print("  2. Test with internal testers")
        console.print("  3. Promote to production or upload directly:")
        console.print("     [dim]python scripts/google-play-upload.py upload --aab build.aab --track production[/dim]")
    else:
        console.print("  [green]✓ App is live on production![/green]")
        console.print("  • Consider staged rollout for updates")
        console.print("  • Monitor crash reports and reviews")

    console.print()
    console.print("[dim]Note: Some requirements can only be checked in Play Console directly.[/dim]")


@cli.command()
@click.option("--aab", required=True, type=click.Path(exists=True), help="Path to AAB file")
@click.option("--track", type=click.Choice(TRACKS), default="internal", help="Release track")
@click.option("--rollout", type=float, help="Staged rollout percentage (0-100)")
@click.option("--notes", help="Release notes text")
@click.option("--notes-file", type=click.Path(exists=True), help="File containing release notes")
@click.option("--notes-lang", default="en-US", help="Language code for release notes")
@click.option("--draft", is_flag=True, help="Create as draft (required for unpublished apps)")
@click.option("--dry-run", is_flag=True, help="Validate without committing")
def upload(aab: str, track: str, rollout: Optional[float], notes: Optional[str],
           notes_file: Optional[str], notes_lang: str, draft: bool, dry_run: bool):
    """Upload AAB to Google Play Store."""

    # Get release notes from file if specified
    release_notes = notes
    if notes_file:
        with open(notes_file) as f:
            release_notes = f.read().strip()

    # Validate rollout
    if rollout is not None:
        if rollout < 0 or rollout > 100:
            console.print("[red]Error:[/red] Rollout must be between 0 and 100")
            return
        rollout = rollout / 100

    file_size = os.path.getsize(aab) / (1024 * 1024)

    # Header
    console.print(Panel.fit(
        "[bold green]Google Play Upload[/bold green]",
        border_style="green"
    ))

    # Config table
    config_table = Table(show_header=False, border_style="dim")
    config_table.add_column("Setting", style="bold")
    config_table.add_column("Value")
    config_table.add_row("Package", PACKAGE_NAME)
    config_table.add_row("AAB File", f"{aab} ({file_size:.1f} MB)")
    config_table.add_row("Track", track)
    config_table.add_row("Mode", "DRY RUN" if dry_run else ("DRAFT" if draft else "LIVE"))
    if rollout:
        config_table.add_row("Rollout", f"{rollout * 100:.0f}%")
    if release_notes:
        config_table.add_row("Notes", release_notes[:50] + "..." if len(release_notes) > 50 else release_notes)
    console.print(config_table)
    console.print()

    service = get_service()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        try:
            # 1. Create edit
            task = progress.add_task("Creating edit...", total=None)
            edit = service.edits().insert(body={}, packageName=PACKAGE_NAME).execute()
            edit_id = edit["id"]
            progress.update(task, description=f"[green]✓[/green] Edit created: {edit_id[:8]}...")

            # 2. Upload AAB
            task = progress.add_task("Uploading AAB...", total=None)
            media = MediaFileUpload(aab, mimetype="application/octet-stream", resumable=True)
            bundle = service.edits().bundles().upload(
                packageName=PACKAGE_NAME, editId=edit_id, media_body=media
            ).execute()
            version_code = bundle["versionCode"]
            progress.update(task, description=f"[green]✓[/green] Uploaded: version code {version_code}")

            # 3. Build release
            release = {
                "versionCodes": [str(version_code)],
                "status": "draft" if draft else "completed"
            }

            if rollout is not None and not draft:
                release["status"] = "inProgress"
                release["userFraction"] = rollout

            if release_notes:
                release["releaseNotes"] = [{"language": notes_lang, "text": release_notes}]

            # 4. Update track
            task = progress.add_task(f"Assigning to {track} track...", total=None)
            service.edits().tracks().update(
                packageName=PACKAGE_NAME, editId=edit_id, track=track,
                body={"releases": [release]}
            ).execute()
            progress.update(task, description=f"[green]✓[/green] Assigned to {track} ({release['status']})")

            # 5. Commit or validate
            if dry_run:
                task = progress.add_task("Validating...", total=None)
                service.edits().validate(packageName=PACKAGE_NAME, editId=edit_id).execute()
                service.edits().delete(packageName=PACKAGE_NAME, editId=edit_id).execute()
                progress.update(task, description="[green]✓[/green] Validation passed (dry run)")
            else:
                task = progress.add_task("Committing...", total=None)
                service.edits().commit(packageName=PACKAGE_NAME, editId=edit_id).execute()
                progress.update(task, description="[green]✓[/green] Committed!")

        except HttpError as e:
            error = json.loads(e.content.decode()).get("error", {})
            console.print(f"\n[red]Error {e.resp.status}:[/red] {error.get('message', str(e))}")
            if "errors" in error:
                for detail in error["errors"]:
                    console.print(f"  [dim]• {detail.get('message', detail)}[/dim]")
            return

    # Success message
    console.print()
    console.print(Panel.fit(
        f"[bold green]✓ Success![/bold green]\n\n"
        f"Version [cyan]{version_code}[/cyan] uploaded to [cyan]{track}[/cyan] track\n\n"
        + ("[yellow]Release is in DRAFT - review in Play Console[/yellow]" if draft else
           f"[green]Rollout: {rollout * 100:.0f}%[/green]" if rollout else
           "[green]Live at 100%[/green]"),
        border_style="green"
    ))


@cli.command()
@click.option("--bump", type=click.Choice(["major", "minor", "patch"]), default="patch",
              help="Version bump type")
def version(bump: str):
    """Show or bump version in app.json."""
    current_version, current_code = get_current_version()

    if current_version is None:
        console.print("[red]Error:[/red] app.json not found")
        return

    console.print(f"Current: [cyan]{current_version}[/cyan] (code: {current_code})")

    if click.confirm(f"Bump {bump} version?"):
        with open(APP_JSON_FILE) as f:
            app_config = json.load(f)

        expo = app_config.get("expo", {})
        match = re.match(r"(\d+)\.(\d+)\.(\d+)", current_version)
        if not match:
            console.print(f"[red]Error:[/red] Invalid version format: {current_version}")
            return

        major, minor, patch = map(int, match.groups())

        if bump == "major":
            major += 1
            minor = 0
            patch = 0
        elif bump == "minor":
            minor += 1
            patch = 0
        else:
            patch += 1

        new_version = f"{major}.{minor}.{patch}"
        new_code = (current_code or 0) + 1

        expo["version"] = new_version
        if "android" not in expo:
            expo["android"] = {}
        expo["android"]["versionCode"] = new_code
        if "ios" not in expo:
            expo["ios"] = {}
        expo["ios"]["buildNumber"] = str(new_code)

        app_config["expo"] = expo

        with open(APP_JSON_FILE, "w") as f:
            json.dump(app_config, f, indent=2)
            f.write("\n")

        console.print(f"Updated: [green]{new_version}[/green] (code: {new_code})")


@cli.command()
def tracks():
    """List all release tracks and their status."""
    console.print(Panel.fit("[bold blue]Release Tracks[/bold blue]", border_style="blue"))

    service = get_service()

    try:
        edit = service.edits().insert(body={}, packageName=PACKAGE_NAME).execute()
        edit_id = edit["id"]

        tracks_response = service.edits().tracks().list(
            packageName=PACKAGE_NAME, editId=edit_id
        ).execute()

        service.edits().delete(packageName=PACKAGE_NAME, editId=edit_id).execute()

    except HttpError as e:
        error = json.loads(e.content.decode()).get("error", {})
        console.print(f"[red]Error:[/red] {error.get('message', str(e))}")
        return

    for track in tracks_response.get("tracks", []):
        track_name = track.get("track", "unknown")
        releases = track.get("releases", [])

        console.print(f"\n[bold cyan]{track_name.upper()}[/bold cyan]")

        if not releases:
            console.print("  [dim]No releases[/dim]")
            continue

        for release in releases:
            status = release.get("status", "unknown")
            version_codes = release.get("versionCodes", [])
            notes = release.get("releaseNotes", [])
            user_fraction = release.get("userFraction")

            status_color = {
                "completed": "green",
                "inProgress": "yellow",
                "draft": "blue",
                "halted": "red"
            }.get(status, "white")

            console.print(f"  [{status_color}]{status}[/{status_color}] - versions: {', '.join(version_codes)}")

            if user_fraction:
                console.print(f"    Rollout: {user_fraction * 100:.0f}%")

            if notes:
                for note in notes:
                    console.print(f"    Notes ({note.get('language', 'en')}): {note.get('text', '')[:60]}...")


@cli.command()
@click.option("--language", default="en-US", help="Language code for the listing")
@click.option("--image-type", type=click.Choice([
    "icon", "featureGraphic", "phoneScreenshots",
    "sevenInchScreenshots", "tenInchScreenshots",
    "tvScreenshots", "wearScreenshots", "tvBanner"
]), help="Upload a specific image type only")
@click.option("--metadata-dir", default=None, help="Path to metadata directory (default: fastlane/metadata)")
def images(language: str, image_type: Optional[str], metadata_dir: Optional[str]):
    """Upload store listing images (icon, screenshots, feature graphic)."""

    if metadata_dir:
        base_dir = Path(metadata_dir) / language / "images"
    else:
        base_dir = Path(__file__).parent.parent / "fastlane" / "metadata" / language / "images"

    if not base_dir.exists():
        console.print(f"[red]Error:[/red] Images directory not found: {base_dir}")
        console.print(f"[dim]Create it and add your images there.[/dim]")
        return

    # Map directory names to Google Play API image types
    IMAGE_TYPE_MAP = {
        "icon": "icon",
        "featureGraphic": "featureGraphic",
        "phoneScreenshots": "phoneScreenshots",
        "sevenInchScreenshots": "sevenInchScreenshots",
        "tenInchScreenshots": "tenInchScreenshots",
        "tvScreenshots": "tvScreenshots",
        "wearScreenshots": "wearScreenshots",
        "tvBanner": "tvBanner",
    }

    # Determine which types to upload
    types_to_upload = [image_type] if image_type else list(IMAGE_TYPE_MAP.keys())

    # Collect files to upload
    upload_plan = []
    for img_type in types_to_upload:
        img_dir = base_dir / img_type
        # Also check for single file (e.g., icon.png directly in images/)
        single_file = base_dir / f"{img_type}.png"

        if img_dir.is_dir():
            for f in sorted(img_dir.iterdir()):
                if f.suffix.lower() in (".png", ".jpg", ".jpeg"):
                    upload_plan.append((img_type, f))
        if not any(t == img_type for t, _ in upload_plan) and single_file.is_file():
            upload_plan.append((img_type, single_file))

    if not upload_plan:
        console.print("[yellow]No images found to upload.[/yellow]")
        console.print(f"\n[dim]Expected structure in {base_dir}:[/dim]")
        console.print("  icon.png [dim]or[/dim] icon/icon.png        [dim](512x512)[/dim]")
        console.print("  featureGraphic.png                    [dim](1024x500)[/dim]")
        console.print("  phoneScreenshots/1.png, 2.png, ...    [dim](2-8 images)[/dim]")
        return

    # Show upload plan
    console.print(Panel.fit(
        "[bold blue]Store Listing Image Upload[/bold blue]",
        border_style="blue"
    ))

    plan_table = Table(show_header=True, border_style="dim")
    plan_table.add_column("Type", style="bold")
    plan_table.add_column("File")
    plan_table.add_column("Size")

    for img_type, filepath in upload_plan:
        size = filepath.stat().st_size / 1024
        plan_table.add_row(img_type, filepath.name, f"{size:.0f} KB")

    console.print(plan_table)
    console.print()

    service = get_service()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        try:
            # Create edit
            task = progress.add_task("Creating edit...", total=None)
            edit = service.edits().insert(body={}, packageName=PACKAGE_NAME).execute()
            edit_id = edit["id"]
            progress.update(task, description=f"[green]✓[/green] Edit created")

            uploaded = 0
            for img_type, filepath in upload_plan:
                task = progress.add_task(f"Uploading {img_type}: {filepath.name}...", total=None)

                mime = "image/png" if filepath.suffix.lower() == ".png" else "image/jpeg"
                media = MediaFileUpload(str(filepath), mimetype=mime)

                service.edits().images().upload(
                    packageName=PACKAGE_NAME,
                    editId=edit_id,
                    language=language,
                    imageType=img_type,
                    media_body=media
                ).execute()

                progress.update(task, description=f"[green]✓[/green] {img_type}: {filepath.name}")
                uploaded += 1

            # Commit the edit
            task = progress.add_task("Committing changes...", total=None)
            try:
                service.edits().commit(
                    packageName=PACKAGE_NAME, editId=edit_id,
                    changesNotSentForReview=True
                ).execute()
            except HttpError:
                # Retry without changesNotSentForReview for published apps
                service.edits().commit(
                    packageName=PACKAGE_NAME, editId=edit_id
                ).execute()
            progress.update(task, description="[green]✓[/green] Committed!")

        except HttpError as e:
            error = json.loads(e.content.decode()).get("error", {})
            console.print(f"\n[red]Error {e.resp.status}:[/red] {error.get('message', str(e))}")
            if "errors" in error:
                for detail in error["errors"]:
                    console.print(f"  [dim]• {detail.get('message', detail)}[/dim]")
            # Try to clean up the edit
            try:
                service.edits().delete(packageName=PACKAGE_NAME, editId=edit_id).execute()
            except Exception:
                pass
            return

    console.print()
    console.print(Panel.fit(
        f"[bold green]✓ Uploaded {uploaded} image(s) to store listing[/bold green]",
        border_style="green"
    ))


if __name__ == "__main__":
    cli()
