#!/bin/bash

# Run the calculator example
# This script opens the calculator example in the default browser

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Path to the calculator test HTML file
CALCULATOR_TEST_FILE="$SCRIPT_DIR/calculator-test.html"

# Check if the file exists
if [ ! -f "$CALCULATOR_TEST_FILE" ]; then
  echo "Error: Calculator test file not found at $CALCULATOR_TEST_FILE"
  exit 1
fi

# Open the file in the default browser
echo "Opening calculator example in the default browser..."

# Detect the operating system and use the appropriate command
case "$(uname -s)" in
  Darwin)
    # macOS
    open "$CALCULATOR_TEST_FILE"
    ;;
  Linux)
    # Linux
    xdg-open "$CALCULATOR_TEST_FILE"
    ;;
  CYGWIN*|MINGW*|MSYS*)
    # Windows
    start "$CALCULATOR_TEST_FILE"
    ;;
  *)
    # Unknown OS
    echo "Unsupported operating system. Please open the file manually:"
    echo "$CALCULATOR_TEST_FILE"
    ;;
esac

echo "Done!"
