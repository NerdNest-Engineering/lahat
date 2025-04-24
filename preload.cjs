const { contextBridge, ipcRenderer } = require('electron');
const QRCode = require('qrcode'); // Require the qrcode library
const { useAuth, Clerk } = require('@clerk/clerk-js')


// const clerkPubKey = ''
const clerkPubKey = 'pk_test_bG9naWNhbC1sb25naG9ybi01Ny5jbGVyay5hY2NvdW50cy5kZXYk';
                     
const clerk = new Clerk(clerkPubKey);

// Expose protected methods that allow the renderer process to use
// IPC communication with the main process
contextBridge.exposeInMainWorld(
  'electronAPI', 
  {
    // Window management
    openWindow: async (type, params = {}) => {
      try {
        return await ipcRenderer.invoke('open-window', { type, params });
      } catch (error) {
        console.error('Error opening window:', error);
        throw error;
      }
    },
    createExternalWindow: async (type, url) => {
      try {
        return await ipcRenderer.invoke('create-external-window', { type, url });
      } catch (error) {
        console.error('Error creating external window:', error);
        throw error;
      }
    },
    getClerk: async () => {
      await clerk.load();
      return clerk;
    },
    getToken: async () => {
      try {
        await clerk.load()
        const { getToken } = useAuth();
        const token = await getToken();
        return token;
      } catch (error) {
        
        console.error('Error getting token:', error);
        throw error;
      }
    },
    
    closeCurrentWindow: () => {
      try {
        ipcRenderer.invoke('close-current-window');
      } catch (error) {
        console.error('Error closing window:', error);
        throw error;
      }
    },
    getWindowParams: async () => {
      try {
        return await ipcRenderer.invoke('get-window-params');
      } catch (error) {
        console.error('Error getting window params:', error);
        throw error;
      }
    },
    
    // Inter-window communication
    notifyAppUpdated: () => {
      try {
        ipcRenderer.invoke('notify-app-updated');
      } catch (error) {
        console.error('Error notifying app updated:', error);
        throw error;
      }
    },
    notifyApiKeyUpdated: () => {
      try {
        ipcRenderer.invoke('notify-api-key-updated');
      } catch (error) {
        console.error('Error notifying API key updated:', error);
        throw error;
      }
    },
    onAppUpdated: (callback) => {
      ipcRenderer.on('app-updated', () => callback());
    },
    onApiKeyUpdated: (callback) => {
      ipcRenderer.on('api-key-updated', () => callback());
    },
    
    // Claude API key management
    setApiKey: async (apiKey) => {
      try {
        return await ipcRenderer.invoke('set-api-key', apiKey);
      } catch (error) {
        console.error('Error setting API key:', error);
        throw error;
      }
    },
    checkApiKey: async () => {
      try {
        return await ipcRenderer.invoke('check-api-key');
      } catch (error) {
        console.error('Error checking API key:', error);
        throw error;
      }
    },
    
    // Mini app generation and management
    generateMiniApp: async (params) => {
      try {
        return await ipcRenderer.invoke('generate-mini-app', params);
      } catch (error) {
        console.error('Error generating mini app:', error);
        throw error;
      }
    },
    listMiniApps: async () => {
      try {
        return await ipcRenderer.invoke('list-mini-apps');
      } catch (error) {
        console.error('Error listing mini apps:', error);
        throw error;
      }
    },
    openMiniApp: async (params) => {
      try {
        return await ipcRenderer.invoke('open-mini-app', params);
      } catch (error) {
        console.error('Error opening mini app:', error);
        throw error;
      }
    },
    updateMiniApp: async (params) => {
      try {
        return await ipcRenderer.invoke('update-mini-app', params);
      } catch (error) {
        console.error('Error updating mini app:', error);
        throw error;
      }
    },
    deleteMiniApp: async (params) => {
      try {
        return await ipcRenderer.invoke('delete-mini-app', params);
      } catch (error) {
        console.error('Error deleting mini app:', error);
        throw error;
      }
    },
    exportMiniApp: async (params) => {
      try {
        return await ipcRenderer.invoke('export-mini-app', params);
      } catch (error) {
        console.error('Error exporting mini app:', error);
        throw error;
      }
    },
    importMiniApp: async () => {
      try {
        return await ipcRenderer.invoke('import-mini-app');
      } catch (error) {
        console.error('Error importing mini app:', error);
        throw error;
      }
    },
    openAppDirectory: async () => {
      try {
        return await ipcRenderer.invoke('open-app-directory');
      } catch (error) {
        console.error('Error opening app directory:', error);
        throw error;
      }
    },
    
    // Event listeners for generation progress
    onGenerationStatus: (callback) => {
      ipcRenderer.on('generation-status', (_event, status) => callback(status));
    },
    onGenerationChunk: (callback) => {
      ipcRenderer.on('generation-chunk', (_event, chunk) => callback(chunk));
    },
    
    // Title and description generation
    generateTitleAndDescription: async (params) => {
      try {
        return await ipcRenderer.invoke('generate-title-and-description', params);
      } catch (error) {
        console.error('Error generating title and description:', error);
        throw error;
      }
    },
    onTitleDescriptionChunk: (callback) => {
      ipcRenderer.on('title-description-chunk', (_event, chunk) => callback(chunk));
    },

    // QR Code Generation
    generateQRCodeToCanvas: async (canvasElement, text, options) => {
      try {
        // Ensure canvasElement is a valid canvas
        if (!(canvasElement instanceof HTMLCanvasElement)) {
          throw new Error('Invalid canvas element provided.');
        }
        // Use the imported QRCode library
        await QRCode.toCanvas(canvasElement, text, options);
        return { success: true };
      } catch (error) {
        console.error('Error generating QR code in preload:', error);
        return { success: false, error: error.message };
      }
    }
  }
);
