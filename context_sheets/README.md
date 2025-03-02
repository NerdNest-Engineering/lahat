# Lahat Documentation Index

<!-- SUMMARY -->
This document provides an index of all documentation for the Lahat application, organized by category.
<!-- /SUMMARY -->

## Documentation Structure

The Lahat documentation is organized into the following categories:

1. **Architecture**: Documents related to the system design and technical implementation
2. **Development**: Documents related to the development process and implementation details
3. **User Experience**: Documents related to the user interface and experience design
4. **Changes**: Documents recording specific changes and implementations

## Architecture

Documents related to the system design and technical implementation:

| Document | Description |
|----------|-------------|
| [Technical Architecture](architecture/technical_architecture.md) | Overview of the system architecture, components, and data flow |
| [Window Sheets Architecture](architecture/window_sheets_architecture.md) | Details of the window sheets UI architecture |
| [Mini App Generation Sequence](architecture/mini_app_generation_sequence.md) | Detailed sequence of the mini app generation process |
| [Security](architecture/security.md) | Security architecture and measures |

## Development

Documents related to the development process and implementation details:

| Document | Description |
|----------|-------------|
| [Project Overview](development/project_overview.md) | Comprehensive overview of the application, features, and development strategy |
| [Development Roadmap](development/development_roadmap.md) | Current status and future development plans |
| [Code Organization](development/code_organization.md) | Module structure and code organization |
| [Prompt Engineering](development/prompt_engineering.md) | Claude prompt design and optimization |
| [Testing Strategy](development/testing_strategy.md) | Testing approaches, tools, and best practices |

## User Experience

Documents related to the user interface and experience design:

| Document | Description |
|----------|-------------|
| [User Experience](user_experience/user_experience.md) | Overall UX design and principles |
| [App Creation Flow](user_experience/app_creation_flow.md) | App creation wizard process |
| [UI Revision Plans](user_experience/ui_revision_plans.md) | UI architecture changes |
| [Accessibility](user_experience/accessibility.md) | Accessibility considerations and implementation |

## Changes

Documents recording specific changes and implementations:

| Document | Description |
|----------|-------------|
| [Code Cleanup Recommendations](changes/20250228-code-cleanup-recommendations.md) | Recommendations for code improvements |
| [Splitting Monolithic UI](changes/20250228-splitting-monolithic-ui.md) | Implementation of window sheets |
| [Main.js Refactoring Plan](changes/20250301-main-js-refactoring-plan.md) | Plan for refactoring main.js |
| [Mini App Generation UI Redesign](changes/20250302-mini-app-generation-ui-redesign.md) | Redesign of app creation flow |
| [Mini App Generation UI Bug Fix](changes/20250303-mini-app-generation-ui-bug-fix.md) | Bug fixes for app creation UI |
| [Step 1 Transition UI Bug Fix](changes/20250304-step1-transition-ui-bug-fix.md) | Bug fix for step transition |

## Using This Documentation

Each document includes a "RELATED DOCUMENTS" section that indicates which other documents provide helpful context:

```markdown
<!-- RELATED DOCUMENTS -->
related '../architecture/technical_architecture.md'
related './code_organization.md'
<!-- /RELATED DOCUMENTS -->
```

When reading a document, you may want to also review its related documents to gain additional context.

## Document Template

When creating new documentation, use the following template:

```markdown
# Document Title

<!-- SUMMARY -->
Brief summary of the document's content and purpose.
<!-- /SUMMARY -->

<!-- RELATED DOCUMENTS -->
related '../path/to/related/document.md'
related '../path/to/another/document.md'
<!-- /RELATED DOCUMENTS -->

## Section 1

Content for section 1...

## Section 2

Content for section 2...

## Conclusion

Concluding remarks...
