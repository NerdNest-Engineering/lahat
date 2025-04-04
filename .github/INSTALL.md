# Installing Lahat

Lahat is available for macOS, Windows, and Linux. Follow the instructions below to install it on your system.

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

## Windows

### Installer (Recommended)
1. Download the latest Windows installer (`.exe`) from the [Releases page](https://github.com/NerdNest-Engineering/lahat/releases/latest)
2. Run the downloaded installer
3. Follow the installation prompts
4. Launch Lahat from the Start menu or desktop shortcut

### Portable Version
1. Download the latest Windows portable ZIP file from the [Releases page](https://github.com/NerdNest-Engineering/lahat/releases/latest)
2. Extract the ZIP file to your preferred location
3. Run `Lahat.exe` from the extracted folder

## Linux

### AppImage (Recommended)
1. Download the latest `.AppImage` file from the [Releases page](https://github.com/NerdNest-Engineering/lahat/releases/latest)
2. Make the file executable: `chmod +x Lahat-x.x.x.AppImage`
3. Run the AppImage: `./Lahat-x.x.x.AppImage`

### Debian/Ubuntu (.deb)
1. Download the latest `.deb` file from the [Releases page](https://github.com/NerdNest-Engineering/lahat/releases/latest)
2. Install using your package manager:
   ```
   sudo dpkg -i Lahat-x.x.x.deb
   sudo apt-get install -f # To resolve any dependencies
   ```
3. Launch Lahat from your applications menu

### Red Hat/Fedora (.rpm)
1. Download the latest `.rpm` file from the [Releases page](https://github.com/NerdNest-Engineering/lahat/releases/latest)
2. Install using your package manager:
   ```
   sudo rpm -i Lahat-x.x.x.rpm
   ```
3. Launch Lahat from your applications menu

## Automatic Updates

Lahat will automatically check for updates when you start the application. When a new version is available, you'll be prompted to install it.

## Troubleshooting Installation

### macOS
- If you receive a message that Lahat "cannot be opened because the developer cannot be verified," right-click (or Control-click) the app and select "Open"
- If Gatekeeper continues to block the app, go to System Preferences > Security & Privacy > General and click "Open Anyway"

### Windows
- If you receive a SmartScreen warning, click "More info" and then "Run anyway"
- If the app doesn't launch, make sure you have the latest Visual C++ Redistributable installed

### Linux
- If the AppImage doesn't run, make sure you have FUSE installed:
  - Debian/Ubuntu: `sudo apt-get install libfuse2`
  - Fedora: `sudo dnf install fuse-libs`

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