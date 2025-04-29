# App Creator Module Refactoring Plan

This plan outlines the steps to integrate the new `src/app-creator` module into the application, replacing the old app creation logic and removing redundant code.

## Plan Steps:

1.  **Update Window Manager Mappings:**
    *   Modify `modules/windowManager/windowManager.js` and `modules/windowManager/windowManager-web-components.js`:
        *   Change the `WINDOW_HTML` mapping for `APP_CREATION` from `'app-creation.html'` to `'src/app-creator/app-creator.html'`.
        *   Change the `WINDOW_PRELOAD` mapping for `APP_CREATION` from `'preload.cjs'` to `'src/app-creator/ipc/preload.js'`.
2.  **Register New Main Process IPC Handlers:**
    *   Modify `modules/ipc/index.js`:
        *   Import the `registerHandlers` function from `../../src/app-creator/ipc/main-process-handlers.js`.
        *   Call this new `registerHandlers` function within `initializeIpcHandlers`, passing it the `ipcHandler` instance.
3.  **Identify and Remove Old IPC Handlers:**
    *   Examine `modules/ipc/apiHandlers.js` and `modules/ipc/miniAppHandlers.js` to find handlers related to the old app creation flow (e.g., functions handling `generateTitleAndDescription`, `generateWidget`, or similar IPC channels used by the old `renderers/app-creation.js`).
    *   Remove these identified handlers.
4.  **Remove Old Files:**
    *   Delete `app-creation.html`.
    *   Delete `renderers/app-creation.js`.
5.  **Code Cleanup (Optional but Recommended):**
    *   Search the codebase for any functions or variables that were *only* used by the removed files (`app-creation.html`, `renderers/app-creation.js`) or the removed IPC handlers and remove them if they are no longer needed.