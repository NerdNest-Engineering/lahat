# Autoupdater Testing Guide

This guide walks you through testing the autoupdater functionality in your Electron app.

## Overview

Your app uses `electron-updater` to automatically check for and install updates from GitHub releases. The autoupdater:

- ✅ Checks GitHub releases every 3 seconds after app startup
- ✅ Only runs in production mode (`NODE_ENV=production`)
- ✅ Downloads updates automatically when available
- ✅ Prompts user to install and restart
- ✅ Syncs package.json version with git tags automatically

## Quick Start

### 1. Create a Test Release

```bash
# Create a patch release (0.0.0-test2 → 0.0.1-test2)
npm run test-updater:release

# Or specify version type
npm run test-updater:release patch   # 0.0.0 → 0.0.1
npm run test-updater:release minor   # 0.0.0 → 0.1.0
npm run test-updater:release major   # 0.0.0 → 1.0.0
```

### 2. Build Local Test Version

```bash
# Build the current version for testing
npm run test-updater:build
```

### 3. Test the Update Process

```bash
# Install the built app from dist/mac-arm64/Lahat.app
# Then run in production mode to test updates
NODE_ENV=production npm start
```

## Detailed Testing Process

### Phase 1: Setup

1. **Check current version**:
   ```bash
   grep '"version"' package.json
   ```

2. **Ensure you have GitHub secrets configured** (for code signing):
   - `APPLE_ID`
   - `APPLE_APP_SPECIFIC_PASSWORD`
   - `APPLE_TEAM_ID`
   - `APPLE_DEV_ID_P12`
   - `APPLE_DEV_ID_P12_PASSWORD`
   - `KEY_CHAIN`
   - `KEY_CHAIN_PASSWORD`

### Phase 2: Create Test Release

1. **Create and push a test tag**:
   ```bash
   npm run test-updater:release patch
   ```

2. **Monitor GitHub Actions**:
   - Go to: https://github.com/NerdNest-Engineering/lahat/actions
   - Watch the "Build and Release" workflow
   - Verify it completes successfully

3. **Verify release artifacts**:
   - Go to: https://github.com/NerdNest-Engineering/lahat/releases
   - Check that the new release exists
   - Verify these files are attached:
     - `Lahat-X.X.X.dmg`
     - `Lahat-X.X.X-mac.zip`
     - `latest-mac.yml` (crucial for autoupdater)

### Phase 3: Test Update Detection

1. **Build the base version**:
   ```bash
   npm run test-updater:build
   ```

2. **Install the built app**:
   - Copy `dist/mac-arm64/Lahat.app` to `/Applications/`
   - Or run it directly from the dist folder

3. **Test update detection**:
   ```bash
   NODE_ENV=production npm start
   ```

4. **Monitor console output** for these messages:
   ```
   🔍 Checking for update...
   Current version: 0.0.0-test2
   Feed URL: {...}
   ✅ Update available: { version: '0.0.1-test2', ... }
   📥 Download progress: 25.5% (1024/4096 bytes)
   ```

5. **Test update dialog**:
   - Verify the update dialog appears
   - Test both "Install and Restart" and "Later" options

### Phase 4: Verify Update Installation

1. **Install the update** by clicking "Install and Restart"
2. **Verify the new version** is running:
   - Check the app's About dialog
   - Or run: `console.log(app.getVersion())` in dev tools

## Troubleshooting

### Common Issues

#### 1. No Update Detected
**Symptoms**: Console shows "❌ No update available"

**Solutions**:
- Verify the release version is higher than current version
- Check that `latest-mac.yml` exists in the GitHub release
- Ensure you're running in production mode (`NODE_ENV=production`)

#### 2. Download Fails
**Symptoms**: Update detected but download fails

**Solutions**:
- Check network connectivity
- Verify GitHub release files are accessible
- Check console for specific error messages

#### 3. Code Signing Issues
**Symptoms**: Update downloads but fails to install

**Solutions**:
- Verify all Apple Developer certificates are valid
- Check that the app is properly code signed
- Review notarization status

### Debug Mode

Add extra logging to `main.js` for debugging:

```javascript
// Add this to setupAutoUpdater() function
autoUpdater.on('error', (err) => {
  console.error('💥 Detailed error:', {
    message: err.message,
    stack: err.stack,
    code: err.code
  });
});
```

### Manual Testing

You can manually trigger update checks:

```javascript
// In the main process
autoUpdater.checkForUpdatesAndNotify()
  .then(result => console.log('Manual check result:', result))
  .catch(err => console.error('Manual check failed:', err));
```

## Version Management

### How Version Sync Works

1. **You create a tag**: `git tag v1.0.0 && git push origin v1.0.0`
2. **GitHub Actions triggers** and extracts version from tag
3. **Updates package.json** to match the tag version
4. **Builds the app** with the correct version
5. **Commits the version change** back to the repository
6. **Publishes the release** with proper version metadata

### Best Practices

- **Always use semantic versioning**: `v1.2.3`
- **Test with patch releases first**: Less risk for major changes
- **Use descriptive release notes**: Help users understand what changed
- **Monitor the build process**: Ensure each step completes successfully

## Testing Checklist

- [ ] Current version is lower than test release version
- [ ] GitHub Actions workflow completes successfully
- [ ] Release artifacts are published correctly
- [ ] `latest-mac.yml` file exists in release
- [ ] Local app detects update in production mode
- [ ] Update downloads successfully
- [ ] Update dialog appears and functions correctly
- [ ] App restarts with new version after update
- [ ] New version number is reflected in the app

## Useful Commands

```bash
# Show help for testing script
npm run test-updater:help

# Build local version for testing
npm run test-updater:build

# Create test release
npm run test-updater:release

# Run app in production mode
NODE_ENV=production npm start

# Check current version
node -e "console.log(require('./package.json').version)"

# List recent git tags
git tag -l --sort=-version:refname | head -5
```

## Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Apple Code Signing Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
