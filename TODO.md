# Self-Contained Widget Implementation TODO List

## Completed Tasks

### 1. System Prompt Handling ✅
- [x] Remove default system prompt from `ClaudeClient` constructor
- [x] Make system prompt a required parameter in `generateApp` method

### 2. Simplify App Generation Process ✅
- [x] Modify `saveGeneratedApp` method to have a self-contained widget option
- [x] Add a parameter like `minimal=false` to control whether to generate all dependencies
- [x] Update the method to respect this parameter and skip generating unnecessary files

### 3. Update File Structure Generation ✅
- [x] Simplify folder structure creation (only create what's absolutely needed)
- [x] Make asset folder creation optional
- [x] Make components folder creation optional (or place component file at root)
- [x] Skip generating base-component.js for self-contained widgets
- [x] Skip generating mini-app-container.js for self-contained widgets
- [x] Skip generating styles.css for self-contained widgets
- [x] Skip generating fonts.css and fonts directory for self-contained widgets

### 4. Update Service Layer ✅
- [x] Modify `mini-app-service.js` to pass the minimal flag to `saveGeneratedApp`
- [x] Add parameter to `generateMiniApp` function to generate self-contained widgets
- [x] Update `updateMiniApp` function to also support self-contained widgets

### 5. Update Handler Layer ✅
- [x] Modify `generate-mini-app.js` to accept self-contained widget parameter
- [x] Pass self-contained widget parameter from handler to service

## Remaining Tasks

### 6. Update UI (Optional)
- [ ] Add UI option for users to choose between full or self-contained widget generation
- [ ] Add a checkbox in the app creation UI to toggle self-contained widget generation
- [ ] Update renderer components to pass this preference to the backend
- [ ] Add tooltip explaining the difference between full and self-contained widgets

### 7. Testing
- [ ] Test self-contained widget generation
- [ ] Verify that self-contained widgets can still be loaded and run correctly
- [ ] Test backward compatibility with existing apps
- [ ] Test updating self-contained widgets
- [ ] Test converting full apps to self-contained widgets

### 8. Documentation
- [ ] Update documentation to reflect the self-contained widget option
- [ ] Document the differences between full and self-contained widget generation
- [ ] Add examples of when to use self-contained widgets vs. full apps
- [ ] Update API documentation for affected methods

### 9. Refactoring (Optional)
- [ ] Refactor code to reduce duplication between self-contained and full widget paths
- [ ] Create helper functions for common operations
- [ ] Improve error handling for self-contained widgets
- [ ] Add logging for self-contained widget operations

## How to Generate Self-Contained Widgets

To generate a self-contained widget, pass `minimal: true` in the parameters when calling the `generateMiniApp` function:

```javascript
// Example usage
const result = await generateMiniApp(claudeClient, event, {
  prompt: "Create a counter widget",
  appName: "Counter",
  systemPrompt: DEFAULT_WIDGET_PROMPT,
  minimal: true // Generate a self-contained widget
});
```

A self-contained widget will be generated with:
- Only the component file (no additional dependencies)
- A simplified metadata file
- No additional files like base-component.js, mini-app-container.js, styles.css, etc.

This results in a much cleaner and more focused widget structure, which is easier to understand and modify.
