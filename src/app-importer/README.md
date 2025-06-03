# App Importer Module

Self-contained module for importing app packages into Lahat. This module encapsulates all import-related functionality including UI components, business logic, and IPC handlers.

## Architecture

```
src/app-importer/
├── index.js                     # Main entry point and initialization
├── README.md                    # This file
├── core/
│   └── ImportEngine.js          # Core import logic and file operations
├── ui/
│   └── ImportCommandPalette.js  # Self-contained command palette for imports
├── ipc/
│   └── ImportHandlers.js        # IPC handlers for import operations
└── api/
    └── ImportAPI.js             # External API interface
```

## Features

### 🚀 Import Sources
- **File Import**: Import `.lahat` and `.zip` packages from local files
- **URL Import**: Import packages directly from URLs
- **Drag & Drop**: (Future) Drag and drop import functionality

### 🎯 Package Validation
- Validates package structure and metadata
- Checks for required files (`index.html`, `metadata.json`)
- Ensures compatibility with Lahat runtime

### ⌨️ Command Palette
- Self-contained command palette for import operations
- Keyboard shortcut: `Cmd/Ctrl + Shift + I`
- Fuzzy search through available import commands
- Visual feedback and notifications

### 🔧 Core Import Engine
- Extracts and validates app packages
- Handles file system operations safely
- Generates unique app identifiers
- Manages temporary files and cleanup

## Usage

### Basic Setup

```javascript
import { initializeAppImporter } from './src/app-importer/index.js';

// Initialize the module
const appImporter = initializeAppImporter();

// Access components
const { importCommandPalette, ImportEngine, ImportAPI } = appImporter;
```

### Using the Import API

```javascript
import importAPI from './src/app-importer/api/ImportAPI.js';

// Import from file dialog
const result = await importAPI.importApp();
if (result.success) {
  console.log(`Imported: ${result.name}`);
}

// Import from URL
const urlResult = await importAPI.importAppFromUrl('https://example.com/app.lahat');

// Get imported apps
const importedApps = await importAPI.getImportedApps();
```

### Using the Command Palette

```javascript
import { importCommandPalette } from './src/app-importer/ui/ImportCommandPalette.js';

// Show the import command palette
importCommandPalette.show();

// Add custom import commands
importCommandPalette.addCommand(
  'import-from-github',
  'Import from GitHub',
  'Import an app package from a GitHub repository',
  async () => {
    // Custom import logic
  }
);
```

### Direct Engine Usage

```javascript
import ImportEngine from './src/app-importer/core/ImportEngine.js';

const engine = new ImportEngine();

// Import from file
const result = await engine.importFromFile('/path/to/app.lahat');

// Import from URL
const urlResult = await engine.importFromUrl('https://example.com/app.zip');

// Get imported apps
const apps = await engine.getImportedApps();
```

## IPC Channels

The module registers the following IPC channels:

- `import-app` - Import app from file dialog
- `import-app-from-url` - Import app from URL
- `get-imported-apps` - Get list of imported apps
- `validate-import-file` - Validate an import file

## Events

The module dispatches custom events for integration:

- `app-imported` - Fired when an app is successfully imported
- `app-import-error` - Fired when import fails
- `app-import-progress` - Fired during import progress

### Event Listeners

```javascript
// Listen for import events
window.addEventListener('app-imported', (event) => {
  console.log('App imported:', event.detail);
  // Refresh app list, show notification, etc.
});

window.addEventListener('app-import-error', (event) => {
  console.error('Import failed:', event.detail);
  // Show error message
});
```

## Supported Formats

- `.lahat` - Native Lahat app packages
- `.zip` - ZIP archives containing Lahat apps

## Package Structure

Expected package structure for imports:

```
app-package.lahat/
├── index.html           # Main app file (required)
├── metadata.json        # App metadata (required)
├── assets/             # App assets (optional)
│   ├── logo.png
│   └── styles.css
└── scripts/            # App scripts (optional)
    └── main.js
```

### Required metadata.json

```json
{
  "name": "My App",
  "version": "1.0.0",
  "description": "A sample app",
  "author": "Developer Name",
  "conversationId": "original_conversation_id"
}
```

## Security

- All imports are validated before installation
- Packages are extracted to secure temporary directories
- File paths are sanitized to prevent directory traversal
- Conversation IDs are regenerated to prevent conflicts

## Error Handling

The module provides comprehensive error handling:

- Invalid package formats
- Corrupted or missing files
- Network errors for URL imports
- File system permission errors
- Validation failures

All errors are returned in a consistent format:

```javascript
{
  success: false,
  error: "Descriptive error message"
}
```

## Integration

### With Main App

```javascript
// In main process initialization
import { registerImportHandlers } from './src/app-importer/ipc/ImportHandlers.js';
registerImportHandlers();

// In renderer process
import { importCommandPalette } from './src/app-importer/ui/ImportCommandPalette.js';
// Command palette is automatically available with Cmd+Shift+I
```

### With App Manager

```javascript
// Listen for import events to refresh app list
window.addEventListener('app-imported', () => {
  // Refresh the app list component
  appListComponent.refresh();
});
```

## Future Enhancements

- Drag & drop import functionality
- Import progress indicators
- Batch import capabilities
- Import from cloud storage (GitHub, Dropbox, etc.)
- Package dependency resolution
- Import templates and presets
- Integration with app store/marketplace