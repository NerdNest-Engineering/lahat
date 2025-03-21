# Lahat Project Documentation

Welcome to the Lahat project documentation. This directory contains documentation for the v2 of the Lahat application.

## Project Structure

Lahat now has two major versions:

- `v1/` - Legacy version of Lahat
- `/` (root) - Current version of Lahat

## Dashboard System

The new dashboard system allows users to:

1. Create and manage dashboards
2. Add widgets to dashboards
3. Arrange widgets in a grid layout
4. Save and load dashboard configurations

See the dashboard architecture documentation for more details.

## Widget System

Widgets are self-contained WebComponents that can be:

1. Created with the widget creation tool
2. Composed in dashboards
3. Shared between users

Each widget follows the WebComponent architecture pattern.

## WebComponent Architecture

The WebComponent architecture separates concerns into three layers:

1. **WebComponent Layer**: Pure WebComponents with no dependencies on Lahat
2. **LahatCell Layer**: Manages component lifecycle and integration with Lahat
3. **EventBus Layer**: Handles global event communication when needed

This architecture allows for maximum reusability and composability.