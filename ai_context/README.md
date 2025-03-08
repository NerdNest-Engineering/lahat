# Lahat AI Context

This directory contains documentation specifically organized to help AI assistants (like Claude) understand the Lahat codebase and provide effective assistance.

## Quick Start

1. **Start with the project overview**: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
2. **Understand the code structure**: [architecture/CODE_ARCHITECTURE.md](architecture/CODE_ARCHITECTURE.md)
3. **Learn about security measures**: [architecture/SECURITY.md](architecture/SECURITY.md)
4. **Review code patterns**: [development/CODE_PATTERNS.md](development/CODE_PATTERNS.md)
5. **Check performance guidelines**: [development/PERFORMANCE_OPTIMIZATION.md](development/PERFORMANCE_OPTIMIZATION.md)
6. **Understand testing approach**: [development/TESTING_GUIDE.md](development/TESTING_GUIDE.md)
7. **Review security checklist**: [development/SECURITY_CHECKLIST.md](development/SECURITY_CHECKLIST.md)
8. **Explore the app creation flow**: [user_experience/APP_CREATION_FLOW.md](user_experience/APP_CREATION_FLOW.md)

## Documentation Structure

```
ai_context/
├── PROJECT_OVERVIEW.md              # High-level overview of the project
├── architecture/                    # Technical architecture details
│   ├── CODE_ARCHITECTURE.md         # Code organization and structure
│   ├── SECURITY.md                  # Security features and implementation
│   ├── mini_app_generation_sequence.md  # Mini app generation flow
│   ├── security.md                  # Detailed security implementation
│   ├── technical_architecture.md    # Technical architecture overview
│   └── window_sheets_architecture.md # Window system architecture
├── development/                     # Development guides and processes
│   ├── CODE_PATTERNS.md             # Common code patterns and idioms
│   ├── PERFORMANCE_OPTIMIZATION.md  # Performance tuning guidelines
│   ├── SECURITY_CHECKLIST.md        # Security audit checklist
│   ├── TESTING_GUIDE.md             # Testing infrastructure and practices
│   ├── code_organization.md         # Code organization guidelines
│   ├── development_roadmap.md       # Future development plans
│   ├── project_overview.md          # Development-focused project overview
│   ├── prompt_engineering.md        # Guidelines for prompt engineering
│   └── testing_strategy.md          # Testing strategy and approach
├── user_experience/                 # UX and workflows
│   ├── APP_CREATION_FLOW.md         # App creation process
│   ├── accessibility.md             # Accessibility guidelines
│   ├── app_creation_flow.md         # Detailed app creation flow
│   ├── ui_revision_plans.md         # UI improvement plans
│   └── user_experience.md           # General UX guidelines
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

### Code Patterns
The codebase follows several established patterns:
- Error handling through centralized ErrorHandler
- IPC communication with standardized request-response pattern
- Component architecture based on web components
- State management with publish-subscribe pattern
- Utility functions organized by domain

### Performance Optimization
Performance is optimized through several strategies:
- Event listener tracking to prevent memory leaks
- Window pooling for efficient resource usage
- Debouncing and throttling for high-frequency events
- Caching for frequently accessed data
- Lazy initialization for non-critical components

### Testing Infrastructure
The testing approach includes:
- Unit testing for utility functions and modules
- Component testing for UI components
- Integration testing for IPC flows
- End-to-end testing for user journeys
- Mock strategies for external dependencies

## Usage Guidelines

When working with the codebase:

1. **Refer to CODE_PATTERNS.md** before making changes to ensure consistency
2. **Consult SECURITY_CHECKLIST.md** when working with security-sensitive components
3. **Review PERFORMANCE_OPTIMIZATION.md** when optimizing code
4. **Check TESTING_GUIDE.md** when adding or modifying tests

## Additional Resources

For even more detailed information on specific topics, see the original context_sheets/ directory which contains additional documentation on:
- Development roadmap
- Architectural decisions
- UI revision plans
- Change history