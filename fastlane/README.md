fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android upload_metadata

```sh
[bundle exec] fastlane android upload_metadata
```

Upload metadata and screenshots to Google Play

### android download_metadata

```sh
[bundle exec] fastlane android download_metadata
```

Download current metadata and screenshots from Google Play

### android upload_screenshots

```sh
[bundle exec] fastlane android upload_screenshots
```

Upload screenshots only

----


## iOS

### ios upload_metadata

```sh
[bundle exec] fastlane ios upload_metadata
```

Upload iOS metadata + screenshots to App Store Connect (saves as draft, no submit)

### ios upload_screenshots

```sh
[bundle exec] fastlane ios upload_screenshots
```

Upload iOS screenshots only to App Store Connect

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
