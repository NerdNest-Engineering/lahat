# Lahat Automated Release Process Plan

This document outlines the plan for automating the build, notarization, and release process for the Lahat application using GitHub Actions and `electron-builder`.

## Goals

*   Automate the creation of new releases on GitHub (`NerdNest-Engineering/lahat/releases`).
*   Support both stable and pre-releases (e.g., alpha, beta).
*   Notarize all macOS builds (including pre-releases) for easier testing and distribution.
*   Enable auto-updates for users via `electron-updater`.
*   Allow manual downloads of specific versions from the GitHub Releases page.

## Implementation Plan

1.  **Configure `package.json`:**
    *   Update the `publish` section to target the correct repository:
        ```json
        "publish": {
          "provider": "github",
          "owner": "NerdNest-Engineering", // <-- Updated owner
          "repo": "lahat"
        }
        ```
    *   Remove the custom notarization hook by deleting the `afterSign: "scripts/notarize.js"` line from the `build.mac` section. Rely on `electron-builder`'s built-in notarization (`"notarize": true`).

2.  **Implement GitHub Actions Workflow (`.github/workflows/release.yml`):**
    *   **Trigger:** The workflow will run automatically when a new tag starting with `v` (e.g., `v1.1.0`, `v1.2.0-alpha.1`) is pushed to the `NerdNest-Engineering/lahat` repository.
    *   **Steps:**
        *   Check out the repository code.
        *   Set up Node.js.
        *   Install project dependencies (`npm ci`).
        *   Execute the `electron-builder` command (e.g., `npm run dist-mac -- --publish always`).
        *   The built-in notarization (`"notarize": true` in `package.json`) will always run for builds triggered by tags, using the secrets provided.
        *   `electron-builder` will automatically detect pre-release versions from the tag/`package.json` version and mark the corresponding GitHub Release as a "Pre-release". Stable versions will be marked as "Latest".
    *   **Secrets:** The workflow will require the following GitHub Actions secrets configured in the repository settings (`Settings` > `Secrets and variables` > `Actions`):
        *   `APPLE_ID`: Your Apple Developer ID (email address).
        *   `APPLE_PASSWORD`: Your Apple app-specific password (not your regular account password).
        *   `APPLE_TEAM_ID`: Your Apple Developer Team ID (in your case "B83WVGNMG3").
        *   `APPLE_DEV_ID_P12`: Base64 encoded Apple Developer ID certificate and key pkcs12.
        *   `APPLE_DEV_ID_P12_PASSWORD`: Password to decrypt Apple Developer ID pkcs12.
        *   `GH_TOKEN`: A GitHub Personal Access Token (PAT) with `repo` scope.

## Mac App Notarization Requirements

For macOS app notarization to work, your local development environment must already have:

1. A valid Developer ID Application certificate in your keychain:
   ```
   Authority=Developer ID Application: NerdNest LLC (B83WVGNMG3)
   Authority=Apple Worldwide Developer Relations Certification Authority
   Authority=Apple Root CA
   ```

2. The same certificate and Apple Developer account will be used for notarization in the GitHub Actions workflow through the secrets specified above.

3. The workflow will use your Apple ID, app-specific password, and team ID to authenticate with Apple's notarization service, but it relies on your apps being properly signed with your Developer ID Application certificate locally before being pushed to GitHub.

## Troubleshooting Notarization Issues

If you encounter notarization issues in the GitHub Actions workflow:

1. Ensure all required secrets (`APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`) are set correctly in your GitHub repository settings.
   
2. Verify that your local environment has the correct Developer ID Application certificate installed and that you're able to sign and notarize apps locally.

3. Check that the app's bundle identifier in `package.json` (`build.appId`) matches the bundle ID you're authorized to sign with your Apple Developer account.

4. Review the GitHub Actions logs for specific error messages from the notarization process.

3.  **Cleanup:**
    *   Delete the `scripts/notarize.js` file.
    *   Delete the `build-alpha.sh` script.

4.  **`electron-updater` Behavior:**
    *   With `autoUpdater.allowPrerelease = false;` in `main.js`, users will only auto-update to stable releases.
    *   Testers can manually download *notarized* pre-releases from the GitHub Releases page.

## Workflow Visualization

```mermaid
graph TD
    A["Push Git Tag (e.g., v1.1.0 or v1.2.0-alpha.1)"] --> B{GitHub Actions Workflow Triggered}
    B --> C[Checkout Code]
    C --> D[Setup Node.js]
    D --> E["Install Dependencies (npm ci)"]
    E --> F{"Build & Publish (electron-builder --publish always)"}
    F -- Uses Secrets --> G((GH_TOKEN, APPLE_ID, APPLE_PASSWORD, APPLE_TEAM_ID, APPLE_DEV_ID_P12, APPLE_DEV_ID_P12_PASSWORD))
    F --> H[Notarize Build (Always)]
    H --> I{Create GitHub Release}
    I -- Detects Pre-release Version? --> J{Mark Release Type}
    J -- Yes --> K[Mark as Pre-release]
    J -- No --> L[Mark as Latest Release]
    K --> M["Upload Assets (.dmg, .yml, etc.)"]
    L --> M
    M --> N[Release Available on GitHub]
    N --> O{Auto-Updater Checks GitHub}
    O -- allowPrerelease=false --> P[Updates to Latest Stable]
    N --> Q["Users Download Manually (Any Version)"]

    style G fill:#f9f,stroke:#333,stroke-width:2px
```

## Next Steps

Proceed with implementing the changes in `package.json` and creating the GitHub Actions workflow file.