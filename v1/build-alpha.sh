#!/bin/bash
# Script to build an unnotarized alpha version of Lahat for macOS

# Ensure script exits on any error
set -e

echo "Building Lahat Alpha Version..."
echo "This build will be unnotarized and will generate security warnings on macOS."

# Check if .env file exists, create it if not
if [ ! -f .env ]; then
  echo "Creating .env file with SKIP_NOTARIZATION=true"
  echo "SKIP_NOTARIZATION=true" > .env
else
  # Check if SKIP_NOTARIZATION is already in .env, add it if not
  if ! grep -q "SKIP_NOTARIZATION=true" .env; then
    echo "Adding SKIP_NOTARIZATION=true to .env"
    echo "SKIP_NOTARIZATION=true" >> .env
  fi
fi

# Run the alpha build script
echo "Running alpha build..."
npm run dist-mac-alpha

echo ""
echo "Alpha build complete!"
echo "The build can be found in the 'dist' directory."
echo ""
echo "IMPORTANT: This build is not notarized and will generate security warnings on macOS."
echo "Please refer to ALPHA_TESTERS.md for instructions on how to bypass these warnings."
