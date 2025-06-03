/**
 * App Launcher Capability - Launch and manage mini apps remotely
 * Provides MCP tools for starting, stopping, and monitoring apps
 */

import { EventEmitter } from 'events';

export class AppLauncher extends EventEmitter {
  constructor(lahatRuntime) {
    super();
    this.runtime = lahatRuntime;
  }

  /**
   * Launch a mini app
   * @param {string} appId - App ID or name to launch
   * @param {Object} args - Launch arguments
   * @returns {Promise<Object>} Launch result
   */
  async launchApp(appId, args = {}) {
    try {
      // Find the app configuration
      const appConfig = await this._findApp(appId);
      if (!appConfig) {
        throw new Error(`App not found: ${appId}`);
      }

      // Check if app is already running
      if (this.runtime.runningApps.has(appConfig.id)) {
        return {
          success: false,
          error: 'App is already running',
          appId: appConfig.id,
          status: 'already_running'
        };
      }

      // Launch the app
      const result = await this.runtime.executeApp(appConfig, appConfig.path);
      
      this.emit('app:launched', { appId: appConfig.id, args, result });
      
      return {
        success: true,
        appId: appConfig.id,
        name: appConfig.name,
        version: appConfig.version,
        pid: result.pid,
        status: 'running',
        launchedAt: new Date().toISOString()
      };
    } catch (error) {
      this.emit('app:launch-failed', { appId, args, error: error.message });
      throw error;
    }
  }

  /**
   * Stop a running mini app
   * @param {string} appId - App ID to stop
   * @returns {Promise<Object>} Stop result
   */
  async stopApp(appId) {
    try {
      if (!this.runtime.runningApps.has(appId)) {
        return {
          success: false,
          error: 'App is not running',
          appId,
          status: 'not_running'
        };
      }

      const result = await this.runtime.stopApp(appId);
      
      this.emit('app:stopped', { appId, result });
      
      return {
        success: true,
        appId,
        status: 'stopped',
        stoppedAt: new Date().toISOString()
      };
    } catch (error) {
      this.emit('app:stop-failed', { appId, error: error.message });
      throw error;
    }
  }

  /**
   * List all apps with their status
   * @param {Object} options - List options
   * @returns {Promise<Object>} Apps list
   */
  async listApps(options = {}) {
    try {
      const { filter, includeRunning = true } = options;
      
      // Get installed apps (this would come from a real app registry)
      const installedApps = await this._getInstalledApps();
      
      // Filter apps if requested
      let apps = installedApps;
      if (filter) {
        const filterLower = filter.toLowerCase();
        apps = apps.filter(app => 
          app.name.toLowerCase().includes(filterLower) ||
          app.id.toLowerCase().includes(filterLower) ||
          app.description?.toLowerCase().includes(filterLower)
        );
      }

      // Add running status if requested
      if (includeRunning) {
        apps = apps.map(app => ({
          ...app,
          isRunning: this.runtime.runningApps.has(app.id),
          runningInfo: this.runtime.runningApps.get(app.id) || null
        }));
      }

      return {
        success: true,
        apps,
        total: apps.length,
        running: includeRunning ? Array.from(this.runtime.runningApps.keys()) : undefined
      };
    } catch (error) {
      this.emit('apps:list-failed', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Get app status and information
   * @param {string} appId - App ID to check
   * @returns {Promise<Object>} App status
   */
  async getAppStatus(appId) {
    try {
      const app = await this._findApp(appId);
      if (!app) {
        throw new Error(`App not found: ${appId}`);
      }

      const isRunning = this.runtime.runningApps.has(appId);
      const runningInfo = this.runtime.runningApps.get(appId);

      return {
        success: true,
        app: {
          id: app.id,
          name: app.name,
          version: app.version,
          description: app.description,
          author: app.author,
          permissions: app.permissions,
          mcpRequirements: app.mcpRequirements
        },
        status: {
          isRunning,
          ...runningInfo
        }
      };
    } catch (error) {
      this.emit('app:status-failed', { appId, error: error.message });
      throw error;
    }
  }

  /**
   * Send a message to a running app
   * @param {string} appId - Target app ID
   * @param {Object} message - Message to send
   * @returns {Promise<Object>} Send result
   */
  async sendMessageToApp(appId, message) {
    try {
      if (!this.runtime.runningApps.has(appId)) {
        throw new Error(`App is not running: ${appId}`);
      }

      // This would integrate with the runtime's messaging system
      const result = await this.runtime.sendMessage(appId, message);
      
      this.emit('app:message-sent', { appId, message, result });
      
      return {
        success: true,
        appId,
        messageId: result.messageId,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      this.emit('app:message-failed', { appId, message, error: error.message });
      throw error;
    }
  }

  /**
   * Find an app by ID or name
   * @private
   */
  async _findApp(appId) {
    const apps = await this._getInstalledApps();
    return apps.find(app => app.id === appId || app.name === appId);
  }

  /**
   * Get list of installed apps
   * @private
   */
  async _getInstalledApps() {
    // Mock implementation - in real system this would query the app registry
    return [
      {
        id: 'sample-todo-app',
        name: 'Sample Todo App',
        version: '1.0.0',
        description: 'A simple todo management app',
        author: 'Lahat Team',
        path: '/path/to/sample-todo-app',
        permissions: ['lahat:storage'],
        mcpRequirements: []
      },
      {
        id: 'weather-dashboard',
        name: 'Weather Dashboard',
        version: '2.1.0',
        description: 'Weather information dashboard with MCP integration',
        author: 'Weather Corp',
        path: '/path/to/weather-dashboard',
        permissions: ['lahat:storage', 'lahat:network'],
        mcpRequirements: ['weather-api', 'location-services']
      },
      {
        id: 'ai-chat-assistant',
        name: 'AI Chat Assistant',
        version: '1.5.0',
        description: 'Chat interface with AI capabilities',
        author: 'AI Systems',
        path: '/path/to/ai-chat-assistant',
        permissions: ['lahat:storage', 'lahat:mcp:*'],
        mcpRequirements: ['ai-text-generation', 'conversation-memory']
      }
    ];
  }

  /**
   * Get launcher status
   */
  getStatus() {
    return {
      runningApps: Array.from(this.runtime.runningApps.keys()),
      totalApps: this.runtime.runningApps.size,
      capabilities: ['launch', 'stop', 'list', 'status', 'message']
    };
  }
}