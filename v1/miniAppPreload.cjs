const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the mini app to use
// IPC communication with the main process
contextBridge.exposeInMainWorld(
  'miniAppAPI', 
  {
    // Allow the mini app to send feedback or request updates
    sendFeedback: async (feedback) => {
      try {
        return await ipcRenderer.invoke('mini-app-feedback', feedback);
      } catch (error) {
        console.error('Error sending feedback:', error);
        throw error;
      }
    },
    
    // Allow the mini app to get its metadata
    getMetadata: async () => {
      try {
        return await ipcRenderer.invoke('get-mini-app-metadata');
      } catch (error) {
        console.error('Error getting metadata:', error);
        throw error;
      }
    },
    
    // Listen for updates from the main process
    onUpdate: (callback) => {
      ipcRenderer.on('mini-app-update', (_event, data) => callback(data));
    }
  }
);

// Add a console.log wrapper to capture logs
const originalConsoleLog = console.log;
console.log = (...args) => {
  originalConsoleLog(...args);
  
  // Send log to main process
  try {
    ipcRenderer.send('mini-app-log', {
      type: 'log',
      message: args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        } catch (e) {
          return String(arg);
        }
      }).join(' ')
    });
  } catch (e) {
    // Ignore errors in sending logs
  }
};

// Also capture errors
window.addEventListener('error', (event) => {
  ipcRenderer.send('mini-app-log', {
    type: 'error',
    message: `Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`
  });
});
