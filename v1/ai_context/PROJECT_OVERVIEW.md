# Lahat Project Overview for Claude

## What is Lahat?

Lahat is an Electron application that enables users to create mini desktop applications through natural language prompts. The name "Lahat" means "all" or "everything" in Tagalog, representing the application's versatility.

## Core Functionality

1. **Natural Language App Generation**: Users describe an application they want in plain language
2. **AI-Powered Creation**: The system uses large language models to generate functional code
3. **Self-Contained Apps**: Output is complete HTML/CSS/JS applications
4. **App Management**: Users can save, edit, and organize their generated applications

## Technical Architecture

- **Platform**: Electron (JavaScript/HTML/CSS)
- **Main Process**: Handles system operations, file management, and AI API communication
- **Renderer Process**: Manages the user interface and interactions
- **Mini App Windows**: Sandboxed environments for running generated applications
- **Security**: Implements sandbox isolation, content security policies, and secure API handling

## Key Components

1. **Window Management System**: 
   - Manages multiple application windows (main app, app creation wizard, generated mini apps)
   - Uses a window pool for efficient resource management

2. **IPC Communication**: 
   - Handles secure communication between main and renderer processes
   - Organized by functionality (api, mini app, window handlers)

3. **File Operations**: 
   - Manages reading, writing, and caching of generated applications
   - Implements metadata caching for improved performance

4. **Security System**:
   - Secure storage of API keys
   - Sandboxed execution of generated code
   - Content Security Policy implementation

## Development Status

Lahat is an active project with continuous improvements. The codebase has recently undergone:
- Code modularization and cleanup
- Security enhancements
- Performance optimizations
- UX improvements to the app creation flow

## Repository Structure

```
lahat/
├── main.js                    # Main electron process entry point
├── modules/                   # Core modules
│   ├── ipc/                   # IPC communication handlers
│   ├── security/              # Security-related functionality
│   ├── utils/                 # Utility functions
│   └── windowManager/         # Window management
├── components/                # Web components for UI
├── renderers/                 # Renderer process scripts
├── styles/                    # CSS stylesheets
└── ai_context/               # Documentation organized for AI assistance
```

## Important Technical Considerations

1. **Electron Security**: The application follows Electron security best practices with context isolation, disabled node integration in renderers, and strict CSP.

2. **Memory Management**: Implements proper tracking of event listeners and resources to prevent memory leaks.

3. **Error Handling**: Uses structured logging and centralized error handling throughout the application.

4. **File Operations**: Implements caching mechanisms for frequently accessed metadata to improve performance.

Use this document as a starting point for understanding the project. For deeper technical details, refer to the architecture and development documentation.