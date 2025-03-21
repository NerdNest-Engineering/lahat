#!/bin/bash

# Simple script to open the test page in a browser

# Determine the OS and open the file accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open test-steps.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open test-steps.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
  # Windows
  start test-steps.html
else
  echo "Unsupported OS. Please open test-steps.html manually."
  exit 1
fi

echo "Test page opened in browser."
