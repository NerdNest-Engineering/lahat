import Store from 'electron-store';

// Define the schema for our store
const schema = {
  apiKey: {
    type: 'string'
  },
  recentApps: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        created: { type: 'string' },
        filePath: { type: 'string' }
      }
    },
    default: []
  },
  settings: {
    type: 'object',
    properties: {
      defaultWindowWidth: { type: 'number', default: 800 },
      defaultWindowHeight: { type: 'number', default: 600 },
      theme: { type: 'string', enum: ['light', 'dark'], default: 'light' }
    },
    default: {
      defaultWindowWidth: 800,
      defaultWindowHeight: 600,
      theme: 'light'
    }
  },
  windowConfig: {
    type: 'object',
    properties: {
      main: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      },
      'api-setup': {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      },
      'app-creation': {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' }
        }
      }
    },
    default: {}
  }
};

// Create the store
const store = new Store({ schema });

export default store;
