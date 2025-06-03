# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Lahat is an Electron application that integrates with Claude to generate mini desktop applications through natural language prompts. It features a modular architecture with strong security practices, supporting both traditional Electron app development and a new "island" architecture for distributed mini apps.

## Essential Commands

### Development
- `npm start` - Start in development mode (sets NODE_ENV=development)
- `npm run dev` - Same as start
- `npm run start-prod` - Start in production mode
- `node main-web-components-test.js` - Test web components in isolation

### Testing
- `npm test` - Run all tests using Node.js test runner
- `npm run test:integration` - Run integration tests only
- `npm run test:watch` - Watch mode for tests
- `npm run test:ci` - CI-optimized test run
- `node tests/run-tests.js` - Custom test runner with better output

### Building and Distribution
- `npm run pack` - Package without distributing (for testing)
- `npm run dist-mac` - Build signed macOS distributables (requires Apple credentials)
- `npm run dist-mac-alpha` - Build unsigned macOS for testing (bypasses notarization)
- `npm run dist-win` - Build Windows distributables
- `npm run dist-linux` - Build Linux distributables
- `npm run dist-all` - Build for all platforms

### Build Requirements
- **macOS Distribution**: Requires APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID in .env
- **Testing Builds**: Use `dist-mac-alpha` to skip notarization for local testing
- **CI Builds**: Check for broken symlinks in node_modules before building

## Architecture Overview

### Dual Architecture System
Lahat implements both traditional Electron patterns and a new "island" architecture:

**Traditional Electron (Current UI)**:
- Main process (`main.js`) handles window management, IPC, and system integration
- Renderer processes handle UI (`renderers/`, `components/`)
- IPC communication via `modules/ipc/` handlers

**Island Architecture (Future Direction)**:
- Modular systems in `src/`: distribution, runtime, scaffolding, mcp, security
- Each island is self-contained with its own API surface
- Designed for eventual micro-service decomposition

### Key Architectural Patterns

**Component System**:
- All UI components extend `BaseComponent` from `components/core/base-component.js`
- Provides automatic resource cleanup, performance tracking, and lifecycle management
- Components use shadow DOM and custom element patterns

**IPC Communication**:
- Channel names defined in `modules/ipc/ipcTypes.js`
- Handlers organized by domain: apiHandlers, miniAppHandlers, windowHandlers, etc.
- All IPC follows request/response pattern with error handling

**State Management**:
- Persistent storage via `electron-store` in `store.js`
- Component state managed through BaseComponent's built-in state system
- Mini app data stored as serialized objects with metadata

**Security Model**:
- Mini apps run in sandboxed windows with strict CSP
- API keys stored securely via `keytar`
- No network access allowed in generated mini apps
- All external content properly sanitized

### Module Organization

**Core Modules (`modules/`)**:
- `ipc/` - Inter-process communication handlers
- `windowManager/` - Window lifecycle and management
- `utils/` - Shared utilities (logger, error handling, performance tracking)
- `security/` - Credential management and security enforcement

**Island Modules (`src/`)**:
- `runtime/` - Mini app execution environment and @lahat/runtime API
- `distribution/` - App packaging, installation, and updates
- `scaffolding/` - Project templates and code generation
- `mcp/` - Model Context Protocol integration
- `security/` - Advanced security features and sandboxing

**UI Components (`components/`)**:
- `core/` - Base component system and utilities
- `ui/` - Reusable UI components (cards, containers, modals)
- All components follow web standards with custom element registration

### Mini App System

**App Lifecycle**:
1. User describes app via natural language
2. Claude generates HTML/CSS/JS implementation
3. App metadata and code stored via `store.js`
4. Apps launched in sandboxed BrowserWindows
5. Updates preserve user data and app state

**Runtime API (`@lahat/runtime`)**:
- Provides `lahat` global object for mini apps
- Storage API for persistent data
- Platform integration (limited by security model)
- Mocked when running outside Lahat environment

**File Management**:
- Mini apps stored as serialized objects in electron-store
- Export functionality creates standalone HTML files
- Apps can be packaged for distribution (island architecture)

## Development Guidelines

### Code Standards
- ES modules throughout (`type: "module"` in package.json)
- Async/await for asynchronous operations
- JSDoc comments for all public functions
- Comprehensive error handling with try/catch
- Resource cleanup in component lifecycle methods

### Component Development
- Extend `BaseComponent` for all custom elements
- Use shadow DOM for style encapsulation
- Implement proper lifecycle methods (onConnect, onDisconnect)
- Follow performance best practices (debouncing, throttling)

### Testing Approach
- Integration tests in `tests/integration/` verify end-to-end workflows
- Unit tests focus on individual modules and utilities
- Web component testing uses isolated test runner
- CI runs build verification to catch packaging issues

### Security Considerations
- Never log or expose API keys
- Sanitize all user-generated content
- Use CSP headers in all renderer processes
- Validate all IPC messages at handler boundaries
- Implement proper error boundaries to prevent crashes

## Common Development Patterns

### Adding New IPC Handlers
1. Define channel name in `modules/ipc/ipcTypes.js`
2. Implement handler in appropriate domain file (`modules/ipc/`)
3. Register handler in `main.js`
4. Add renderer-side invocation logic

### Creating New Components
1. Extend `BaseComponent` class
2. Implement required lifecycle methods
3. Register custom element in `components/index.js`
4. Add styles using shadow DOM patterns

### Island Module Development
1. Create self-contained module in `src/`
2. Expose clean API surface in `index.js`
3. Include comprehensive error handling
4. Write integration tests in `tests/integration/`

## Build and CI Notes

### Common Build Issues
- **Broken symlinks**: CI automatically cleans broken symlinks in node_modules
- **Missing dependencies**: Use `npm ci` for reproducible builds
- **Platform-specific builds**: macOS builds require proper signing certificates

### Environment Setup
- Node.js 20.x required (matches Electron runtime)
- Platform-specific build tools needed for distribution
- Environment variables for Apple Developer Program (macOS signing)

This architecture balances current Electron app needs with future distributed system goals, maintaining backwards compatibility while enabling gradual migration to the island architecture.