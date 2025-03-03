# Lahat Window Sheets Implementation

This implementation splits the Lahat application into independent window sheets as outlined in the UI revision plan. The changes follow a modular architecture that separates different functional areas into independent windows.

## Architecture Overview

The implementation includes:

1. **Window Manager Module** - Handles creation and lifecycle of all sheets
2. **Independent Window Sheets**:
   - Main Window (App Gallery) - For browsing and managing mini apps
   - API Setup Sheet - For configuring the Claude API key
   - App Creation Sheet - For creating new mini apps
   - Mini App Windows - For displaying generated mini apps

3. **Inter-Window Communication** - Uses IPC for communication between sheets

## Files Created/Modified

### New Files

- **Window Manager**:
  - `modules/windowManager/windowManager.js` - Core window management functionality

- **HTML Files**:
  - `main.html` - Main window (app gallery)
  - `api-setup.html` - API setup sheet
  - `app-creation.html` - App creation sheet

- **JavaScript Files**:
  - `renderers/main.js` - Main window renderer
  - `renderers/api-setup.js` - API setup sheet renderer
  - `renderers/app-creation.js` - App creation sheet renderer

- **CSS Files**:
  - `styles/main.css` - Main window styles
  - `styles/api-setup.css` - API setup sheet styles
  - `styles/app-creation.css` - App creation sheet styles

### Modified Files

- `main.js` - Updated to use window manager and handle new IPC events
- `preload.cjs` - Added new IPC methods for window management
- `store.js` - Added window configuration schema

## Testing Instructions

To test the window sheets implementation:

1. **Start the application**:
   ```
   npm run dev
   ```

2. **Test Main Window**:
   - The main window should show the app gallery
   - If no API key is set, it should automatically open the API setup sheet
   - The "Create New App" button should open the app creation sheet
   - The "API Settings" button should open the API setup sheet

3. **Test API Setup Sheet**:
   - Enter a valid Claude API key and click "Save API Key"
   - The sheet should close automatically after saving
   - The main window should refresh to show the app gallery

4. **Test App Creation Sheet**:
   - Enter an app name and description
   - Click "Generate Mini App"
   - The generation preview should show the HTML content
   - After generation completes, a mini app window should open
   - The app creation sheet should close automatically
   - The main window should refresh to show the new app

5. **Test Mini App Management**:
   - Click on an app card in the main window
   - The app details modal should open
   - Test the "Open App", "Update App", "Export App", and "Delete App" buttons

6. **Test Window Persistence**:
   - Resize and move windows
   - Close and reopen the application
   - Windows should restore to their previous positions and sizes

## Known Issues and Limitations

- The implementation currently uses the same preload script for all window types except mini apps. In the future, each window type could have its own preload script with only the necessary APIs exposed.
- The window manager does not yet support multiple instances of the same window type (except for mini apps).
- The implementation does not yet support custom themes or appearance settings across all windows.

## Future Improvements

- Add support for custom themes and appearance settings
- Implement more advanced window management features (e.g., window snapping, workspace layouts)
