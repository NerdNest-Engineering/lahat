# Lahat v1.0.11 Release Notes

## New Features and Improvements

- Enhanced error handling system with structured error classes
- Comprehensive resource tracking to prevent memory leaks
- Performance measurement utilities for monitoring application performance
- Improved IPC communication with parameter validation and timeouts
- Enhanced component system with robust resource tracking
- Detailed development documentation resources

## Bug Fixes

- Memory leaks in component lifecycle management
- IPC handlers lacking proper validation and error handling
- Auto-updater issues in development mode
- Fixed bug in main.js affecting window management

## Installation Notes

### macOS Security Warning

When opening the macOS version, you may see a message that "Lahat is damaged and can't be opened". This is due to macOS Gatekeeper security, since the app isn't signed with an Apple Developer certificate.

To bypass this warning, open Terminal and run:

```
xattr -cr /Applications/Lahat.app
```

Then try opening the app again.

### Windows Security Warning

On Windows, you may see a SmartScreen warning. Click "More info" and then "Run anyway" to proceed.

### Linux Installation

For Linux, we provide both AppImage and Deb packages. The AppImage is self-contained and should work on most distributions.

## Documentation

See the [CHANGELOG.md](https://github.com/Dorky-Robot/lahat/blob/main/CHANGELOG.md) file for detailed information about all changes in this release.

---

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>