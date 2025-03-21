#!/bin/bash

# Run Self-Contained Widget Test
# This script runs the self-contained widget test and displays the results

# Set the script to exit on error
set -e

# Check if the CLAUDE_API_KEY environment variable is set
if [ -z "$CLAUDE_API_KEY" ]; then
  echo "Error: CLAUDE_API_KEY environment variable is not set"
  echo "Please set it before running this script:"
  echo "  export CLAUDE_API_KEY=your_api_key_here"
  exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Print header
echo "========================================"
echo "  Self-Contained Widget Test"
echo "========================================"
echo ""
echo "This test will generate two widgets:"
echo "  1. A self-contained counter widget"
echo "  2. A full counter widget with dependencies"
echo ""
echo "It will then compare the file structures and"
echo "test updating the self-contained widget."
echo ""
echo "Project root: $PROJECT_ROOT"
echo "Using Claude API key: ${CLAUDE_API_KEY:0:5}..."
echo ""
echo "Press Enter to continue or Ctrl+C to cancel"
read

# Change to the project root directory
cd "$PROJECT_ROOT"

# Run the test script
echo "Running test script..."
echo "========================================"
node "$SCRIPT_DIR/test-self-contained-widget.js"

# Check if the test was successful
if [ $? -eq 0 ]; then
  echo ""
  echo "========================================"
  echo "  Test completed successfully!"
  echo "========================================"
  echo ""
  echo "The self-contained widget implementation is working correctly."
  echo "You can now generate self-contained widgets in your app generation."
else
  echo ""
  echo "========================================"
  echo "  Test failed!"
  echo "========================================"
  echo ""
  echo "Please check the error messages above and fix any issues."
fi
