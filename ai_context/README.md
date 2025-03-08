# Lahat AI Context

This directory contains documentation specifically organized to help AI assistants (like Claude) understand the Lahat codebase and provide effective assistance.

## Quick Start

1. **Start with the project overview**: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
2. **Understand the code structure**: [architecture/CODE_ARCHITECTURE.md](architecture/CODE_ARCHITECTURE.md)
3. **Learn about security measures**: [architecture/SECURITY.md](architecture/SECURITY.md)
4. **Explore the app creation flow**: [user_experience/APP_CREATION_FLOW.md](user_experience/APP_CREATION_FLOW.md)

## Documentation Structure

```
ai_context/
├── PROJECT_OVERVIEW.md              # Start here for a high-level overview
├── architecture/                    # Technical architecture details
│   ├── CODE_ARCHITECTURE.md         # Code organization and structure
│   └── SECURITY.md                  # Security features and implementation
├── user_experience/                 # UX and workflows
│   └── APP_CREATION_FLOW.md         # App creation process
└── README.md                        # This file
```

## Key Topics

### Electron Architecture
Lahat uses a standard Electron architecture with some specific patterns:
- Main process handles system operations, window management, and file I/O
- Renderer processes handle UI rendering and user interactions
- IPC is used for communication between processes
- Each mini app runs in its own sandboxed window

### Security Model
Security is a core concern, particularly for an application that generates and runs code:
- Strict Content Security Policy
- Process isolation and sandbox
- Secure storage for API keys
- Input validation and sanitization
- Path validation for file operations

### Window Management
The application uses a structured approach to window management:
- Window types define specific configurations and behaviors
- Window pooling is used for resource efficiency
- Window parameters are stored and passed securely

### File Operations
File handling includes several optimizations:
- Metadata caching reduces disk I/O
- Secure path validation prevents directory traversal
- Error handling is robust and secure
- Temporary file management for previewing content

## Additional Resources

For more detailed information on specific topics, see the original context_sheets/ directory which contains comprehensive documentation on:
- Development roadmap
- Testing strategy
- Architectural decisions
- User experience guidelines
- Accessibility considerations