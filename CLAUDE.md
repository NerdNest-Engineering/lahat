# Lahat Development Guide

## Project Overview
Lahat is an Electron application that enables users to create mini desktop applications through natural language prompts. It uses a modular architecture with strong security practices.

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
- **Security:** Implements sandbox isolation, CSP, and secure storage

## AI Context Documentation

For AI assistants working with this codebase, comprehensive project context is available in the `ai_context/` directory:

```
ai_context/
├── PROJECT_OVERVIEW.md              # Start here for a high-level overview
├── architecture/                    # Technical architecture details
│   ├── CODE_ARCHITECTURE.md         # Code organization and structure
│   └── SECURITY.md                  # Security features and implementation
├── user_experience/                 # UX and workflows
│   └── APP_CREATION_FLOW.md         # App creation process
└── README.md                        # Directory structure and usage
```

When analyzing the codebase or implementing new features, AI assistants should first consult these documents to understand the project structure, security models, and design patterns.