# Changelog

All notable changes to the Lahat application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.10] - 2025-03-08

### Added
- Added dev-app-update.yml configuration for development mode
- Included installation instructions for bypassing macOS Gatekeeper

### Fixed
- Auto-updater errors in development mode
- Improved error handling for update checks
- Added workaround for macOS Gatekeeper security warning

## [1.0.9] - 2025-03-08

### Added
- Comprehensive resource tracking system to prevent memory leaks
- Performance measurement utilities for monitoring application performance
- Detailed development documentation resources

### Changed
- Enhanced error handling system with structured error classes
- Improved IPC communication with parameter validation and timeouts
- Enhanced component system with robust resource tracking
- Reorganized utility functions for better maintainability

### Fixed
- Memory leaks in component lifecycle management
- IPC handlers lacking proper validation and error handling

## [1.0.8] - 2025-03-01

### Fixed
- Auto-updater issues in development mode
- Dock/taskbar click behavior improvements
- Platform-specific update scripts for reliable restart

### Added
- Improved documentation and installation instructions
- Complete overhaul of auto-update system