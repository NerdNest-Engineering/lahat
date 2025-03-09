# Lahat Alpha Release - Instructions for Testers

Thank you for testing the alpha version of Lahat! This document provides important information about running the unnotarized alpha build on macOS.

## About Unnotarized Alpha Builds

This alpha build is **not notarized** with Apple's notarization service. This means that macOS will display security warnings when you try to open the application. This is expected behavior for alpha/development builds and does not indicate a problem with the application itself.

## Opening the Application for the First Time

When you first try to open the Lahat alpha build, you may see one of these messages:

1. **"Lahat" is damaged and can't be opened. You should move it to the Trash.**
2. **"Lahat" cannot be opened because the developer cannot be verified.**
3. **macOS cannot verify that this app is free from malware.**

### How to Bypass These Warnings

#### Method 1: Using Finder
1. Locate the Lahat application in Finder
2. Right-click (or Control+click) on the application
3. Select "Open" from the context menu
4. When prompted, click "Open" again

#### Method 2: Using Security & Privacy Settings
If Method 1 doesn't work:
1. Try to open the application (it will fail)
2. Open System Preferences/Settings
3. Go to "Security & Privacy" or "Privacy & Security"
4. Look for a message about Lahat being blocked
5. Click "Open Anyway" or "Allow"
6. Try opening the application again

#### Method 3: Using Terminal (Advanced)
If the above methods don't work, you can try:
1. Open Terminal
2. Run the following command:
   ```
   xattr -cr /path/to/Lahat.app
   ```
   (Replace `/path/to/Lahat.app` with the actual path to the application)
3. Try opening the application again

## Reporting Issues

If you encounter any issues or bugs while testing, please report them on our GitHub issue tracker:
https://github.com/Dorky-Robot/lahat/issues

Please include:
- A detailed description of the issue
- Steps to reproduce the problem
- Your macOS version
- Any error messages you receive

## Future Releases

The final release version of Lahat will be properly notarized and signed, which will eliminate these security warnings.

Thank you for your help in testing and improving Lahat!
