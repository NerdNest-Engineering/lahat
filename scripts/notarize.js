/**
 * macOS Notarization Script
 * This script handles notarizing the application with Apple's notarization service
 */

// This script requires the following packages to be installed:
// - electron-notarize
// - dotenv
// You can add them with: npm install electron-notarize dotenv --save-dev

import { notarize } from '@electron/notarize';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv'; // For loading environment variables from .env file

// Load environment variables with explicit path
const result = dotenv.config();
if (result.error) {
  console.warn('Error loading .env file:', result.error.message);
} else {
  console.log('.env file loaded successfully');
}

export default async function (params) {
  // Skip notarization during development or if explicitly disabled
  if (process.env.SKIP_NOTARIZATION === 'true') {
    console.log('Skipping notarization');
    return;
  }

  // Check for required env variables
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.warn('Skipping notarization: APPLE_ID and/or APPLE_ID_PASSWORD not found in environment');
    return;
  }

  // Get relevant build parameters
  const { appOutDir, packager, electronPlatformName } = params;

  // Skip if not macOS
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  // Check if the app was built
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  console.log(`Notarizing ${appName} at ${appPath}`);

  try {
    // Attempt to notarize the app
    await notarize({
      appBundleId: packager.appInfo.id,
      appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID // Optional, required for Apple Developer accounts with multiple teams
    });
    console.log(`Successfully notarized ${appName}`);
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
}
