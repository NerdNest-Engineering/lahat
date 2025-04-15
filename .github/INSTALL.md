# Installing Lahat

Lahat is currently available for macOS, with Windows and Linux support coming soon. Follow the instructions below to install it on your system.

## macOS

### DMG Installation (Recommended)
1. Download the latest `.dmg` file from the [Releases page](https://github.com/NerdNest-Engineering/lahat/releases/latest)
2. Open the downloaded `.dmg` file
3. Drag the Lahat app to your Applications folder
4. Open Lahat from your Applications folder or Launchpad

### ZIP Installation
1. Download the latest macOS `.zip` file from the [Releases page](https://github.com/NerdNest-Engineering/lahat/releases/latest)
2. Extract the ZIP file
3. Move the extracted Lahat app to your Applications folder
4. Open Lahat from your Applications folder or Launchpad

## Automatic Updates

Lahat will automatically check for updates when you start the application. When a new version is available, you'll be prompted to install it.

## Troubleshooting Installation

### macOS
- If you receive a message that Lahat "cannot be opened because the developer cannot be verified," right-click (or Control-click) the app and select "Open"
- If Gatekeeper continues to block the app, go to System Preferences > Security & Privacy > General and click "Open Anyway"

## Building From Source

If you prefer to build from source, follow these steps:

1. Clone the repository: `git clone https://github.com/NerdNest-Engineering/lahat.git`
2. Navigate to the directory: `cd lahat`
3. Install dependencies: `npm install`
4. Build for your platform:
   - macOS: `npm run dist-mac`
   - Windows: `npm run dist-win`
   - Linux: `npm run dist-linux`
   - All platforms: `npm run dist-all` (requires appropriate build environments)