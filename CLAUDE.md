# Lahat Development Guide

## Build/Run Commands
- `npm start` - Start Electron application
- `npm run dev` - Start Electron in development mode with NODE_ENV=development
- `node main-web-components-test.js` - Run web components test

## Code Style Guidelines
- **Modules:** Use ES modules syntax with explicit imports/exports
- **Async:** Use async/await for asynchronous operations
- **Error Handling:** Implement comprehensive try/catch blocks
- **Naming:** Clear, descriptive function and variable names
- **Documentation:** Use JSDoc comments for functions
- **Approach:** Pure functions where possible
- **State Management:** Use state manager for component state
- **Components:** Extend BaseComponent for new web components
- **Structure:** Follow modules organization (ipc, windowManager, utils)

## Architecture
- **Main Process:** Handles window management, IPC, file operations
- **Renderer Process:** Handles UI, user interactions
- **Components:** Core, UI, Mini-Apps organized by responsibility
- **IPC:** Used for communication between processes
- **Window Management:** Managed by windowManager module