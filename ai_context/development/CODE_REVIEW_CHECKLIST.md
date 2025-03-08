# Lahat: Code Review Checklist

## Overview

This document provides a comprehensive checklist for conducting code reviews in the Lahat project. Using this checklist helps ensure consistent quality, maintainability, security, and performance across the codebase.

## General

- [ ] **Follows coding style guidelines**
  - ES modules syntax with explicit imports/exports
  - Consistent naming conventions
  - Proper indentation and formatting
  - Clear, descriptive comments where needed

- [ ] **Code is readable and maintainable**
  - Functions and methods are focused and not too long
  - Complex logic is adequately commented
  - Magic numbers and strings are avoided or explained
  - Code is organized in a logical manner

- [ ] **Documentation is complete**
  - JSDoc comments for public functions and classes
  - Parameter and return types are documented
  - Complex functions have usage examples
  - README or other documentation is updated if needed

## Error Handling

- [ ] **Errors are handled consistently**
  - Try/catch blocks around operations that might fail
  - Error context is preserved
  - User-friendly error messages are provided
  - Errors are logged with appropriate level and context

- [ ] **Edge cases are considered**
  - Null/undefined values are handled appropriately
  - Boundary conditions are tested
  - Unexpected input is handled gracefully
  - Async errors are caught and handled

## Security

- [ ] **Input validation is implemented**
  - All user input is validated
  - Parameters from IPC calls are validated
  - Sanitization is applied where needed
  - Validation is performed on both client and server sides

- [ ] **Security best practices are followed**
  - No sensitive data is logged
  - Proper CSP is implemented
  - Context isolation is maintained
  - Principle of least privilege is applied

- [ ] **File system operations are secure**
  - Paths are validated to prevent directory traversal
  - Files are created with appropriate permissions
  - File content is validated before operations
  - Error handling preserves security

- [ ] **Mini app security is maintained**
  - Proper sandboxing is applied
  - Limited API exposure
  - Content validation before display
  - Resource limits are enforced

## Performance

- [ ] **Resource usage is optimized**
  - Memory leaks are prevented
  - Event listeners are properly cleaned up
  - DOM references are managed appropriately
  - Large objects are cleaned up when no longer needed

- [ ] **Performance considerations are addressed**
  - Expensive operations are optimized
  - Caching is used where appropriate
  - Rendering performance is considered
  - CPU and memory usage are reasonable

- [ ] **IPC communication is efficient**
  - IPC calls are batched where possible
  - Data transfer is minimized
  - Streaming is used for large data
  - Unnecessary IPC calls are avoided

## Components and UI

- [ ] **Component lifecycle is managed properly**
  - Initialization and cleanup are complete
  - Event listeners are tracked and cleaned up
  - Attributes are observed correctly
  - Rendering is optimized

- [ ] **UI is responsive and accessible**
  - UI updates are efficient
  - Accessibility guidelines are followed
  - Keyboard navigation works
  - Screen readers are supported

- [ ] **State management is appropriate**
  - State is managed in a predictable way
  - State changes trigger appropriate UI updates
  - Global state is used judiciously
  - State persistence is handled correctly

## Testing

- [ ] **Tests are included or updated**
  - Unit tests for utility functions
  - Component tests for UI components
  - Integration tests for complex flows
  - Edge cases are tested

- [ ] **Tests are meaningful**
  - Tests verify behavior, not implementation details
  - Tests are readable and maintainable
  - Test coverage is sufficient
  - Tests run in a reasonable time

## IPC Communication

- [ ] **IPC handlers follow patterns**
  - Standard request/response pattern is used
  - Parameters are validated
  - Responses include success/error status
  - Error handling is consistent

- [ ] **IPC security is maintained**
  - Limited API surface is exposed
  - Sensitive operations are protected
  - Validation is thorough
  - Context isolation is preserved

## Electron Security

- [ ] **Window creation is secure**
  - contextIsolation is enabled
  - nodeIntegration is disabled
  - sandbox is used where appropriate
  - preload scripts are secure

- [ ] **CSP is appropriate**
  - CSP directives are strict
  - 'unsafe-inline' is avoided where possible
  - External sources are limited
  - CSP is applied consistently

## Code Organization

- [ ] **Code fits the architecture**
  - Modules have clear responsibilities
  - Dependencies are explicit
  - Circular dependencies are avoided
  - Files are organized logically

- [ ] **Existing patterns are followed**
  - Error handling follows established patterns
  - IPC communication is consistent
  - Component architecture is maintained
  - Utility functions fit existing categories

## Specific File Types

### JavaScript Files

- [ ] **ES modules syntax is used correctly**
  - Import and export statements are correct
  - No CommonJS require/module.exports
  - Dynamic imports are used appropriately
  - Circular dependencies are avoided

- [ ] **Async operations are handled properly**
  - Async/await is used consistently
  - Promises are properly chained
  - Errors in async code are caught
  - Async operations are canceled when needed

### HTML Files

- [ ] **HTML follows best practices**
  - Semantic elements are used
  - CSP meta tag is included
  - Charset and viewport are specified
  - HTML is valid

- [ ] **Scripts and styles are appropriate**
  - Script loading is optimized
  - Styles follow guidelines
  - Inline scripts are avoided
  - External resources are minimal

### CSS Files

- [ ] **CSS follows best practices**
  - Selectors are efficient
  - Styles are scoped appropriately
  - Variables are used for consistency
  - Layout is responsive

## Pull Request Checklist

Before submitting or approving a pull request, ensure:

- [ ] **Code quality meets standards**
  - All items in this checklist are addressed
  - No regressions are introduced
  - Code is clean and maintainable
  - Performance is acceptable

- [ ] **Documentation is updated**
  - README is updated if needed
  - JSDoc comments are complete
  - Architecture documentation is updated
  - Change log is updated

- [ ] **Tests pass**
  - Existing tests pass
  - New tests cover new functionality
  - Edge cases are tested
  - Performance tests pass if applicable

- [ ] **Security is maintained**
  - No new vulnerabilities are introduced
  - Security checks pass
  - CSP is not weakened
  - Sensitive data is protected

## Conclusion

This checklist provides a comprehensive framework for reviewing code in the Lahat project. Not all items will be applicable to every review, but considering each relevant item helps ensure consistent quality, security, and performance across the codebase.

Remember that code reviews are a collaborative process aimed at improving code quality, not criticizing the author. Provide constructive feedback and suggestions, and acknowledge good work when you see it.