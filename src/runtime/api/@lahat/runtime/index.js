/**
 * @lahat/runtime - NPM package for mini apps
 * Provides access to Lahat platform APIs
 */

// Check if running in Lahat runtime environment
const isLahatEnvironment = typeof global !== 'undefined' && 
                          (global.lahat || global.storage);

if (!isLahatEnvironment) {
  console.warn('@lahat/runtime: Not running in Lahat environment. APIs will be mocked.');
}

/**
 * Lahat platform API
 */
export const lahat = isLahatEnvironment ? global.lahat : {
  getPlatformInfo: () => ({ name: 'Lahat (Mock)', version: '3.0.0', mode: 'development' }),
  emit: () => console.log('Mock: lahat.emit called'),
  on: () => console.log('Mock: lahat.on called'),
  off: () => console.log('Mock: lahat.off called'),
  getCurrentApp: () => ({ id: 'mock-app', name: 'Mock App', version: '1.0.0' }),
  getMCP: () => ({
    listServers: async () => [],
    call: async () => { throw new Error('Mock MCP: Not implemented'); },
    isAvailable: async () => false
  }),
  getApps: () => ({
    list: async () => [],
    launch: async () => { throw new Error('Mock Apps: Not implemented'); },
    sendMessage: async () => { throw new Error('Mock Apps: Not implemented'); }
  }),
  getLogger: () => ({
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  }),
  getUtils: () => ({
    generateId: () => `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    debounce: (func, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    }
  })
};

/**
 * Storage API
 */
export const storage = isLahatEnvironment ? global.storage : {
  set: async () => console.log('Mock: storage.set called'),
  get: async () => { console.log('Mock: storage.get called'); return null; },
  has: async () => { console.log('Mock: storage.has called'); return false; },
  delete: async () => { console.log('Mock: storage.delete called'); return false; },
  keys: async () => { console.log('Mock: storage.keys called'); return []; },
  clear: async () => console.log('Mock: storage.clear called'),
  getSize: async () => { console.log('Mock: storage.getSize called'); return 0; }
};

/**
 * Convenience exports
 */
export const { 
  getPlatformInfo, 
  emit, 
  on, 
  off, 
  getCurrentApp 
} = lahat;

export const { 
  getMCP, 
  getApps, 
  getLogger, 
  getUtils 
} = lahat;

// Default export
export default {
  lahat,
  storage,
  getPlatformInfo,
  emit,
  on,
  off,
  getCurrentApp,
  getMCP,
  getApps,
  getLogger,
  getUtils
};