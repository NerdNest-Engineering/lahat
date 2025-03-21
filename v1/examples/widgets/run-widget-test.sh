#!/bin/bash

# Run Widget Test
# This script opens the widget test HTML file in the default browser

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Path to the HTML file
HTML_FILE="$SCRIPT_DIR/widget-test.html"

# Check if the file exists
if [ ! -f "$HTML_FILE" ]; then
  echo "Error: Widget test HTML file not found at $HTML_FILE"
  exit 1
fi

# Determine the OS and open the file accordingly
case "$(uname -s)" in
  Darwin)
    # macOS
    open "$HTML_FILE"
    ;;
  Linux)
    # Linux
    if command -v xdg-open > /dev/null; then
      xdg-open "$HTML_FILE"
    else
      echo "Error: xdg-open command not found. Please open the file manually: $HTML_FILE"
      exit 1
    fi
    ;;
  CYGWIN*|MINGW*|MSYS*)
    # Windows
    start "$HTML_FILE"
    ;;
  *)
    # Unknown OS
    echo "Unknown operating system. Please open the file manually: $HTML_FILE"
    exit 1
    ;;
esac

echo "Opening widget test in browser: $HTML_FILE"
