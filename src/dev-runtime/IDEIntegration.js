/**
 * IDE Integration - Launch and integrate with IDEs
 * Provides integration with Visual Studio Code and other editors
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class IDEIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      preferredIDE: 'vscode', // 'vscode', 'cursor', 'webstorm', 'sublime'
      autoInstallExtensions: true,
      createLaunchConfig: true,
      ...options
    };
    
    this.availableIDEs = new Map();
    this.isStarted = false;
  }

  /**
   * Start IDE integration
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isStarted) return;
    
    try {
      // Detect available IDEs
      await this._detectAvailableIDEs();
      
      this.isStarted = true;
      this.emit('ide-integration:started');
    } catch (error) {
      this.emit('ide:error', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop IDE integration
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isStarted) return;
    
    this.isStarted = false;
    this.emit('ide-integration:stopped');
  }

  /**
   * Open project in IDE
   * @param {string} projectPath - Path to the project directory
   * @param {Object} options - IDE options
   * @returns {Promise<void>}
   */
  async openProject(projectPath, options = {}) {
    if (!this.isStarted) {
      throw new Error('IDE integration not started');
    }

    const ide = options.ide || this.options.preferredIDE;
    const ideInfo = this.availableIDEs.get(ide);
    
    if (!ideInfo) {
      throw new Error(`IDE '${ide}' not available. Available IDEs: ${Array.from(this.availableIDEs.keys()).join(', ')}`);
    }

    try {
      // Create IDE-specific configuration if needed
      if (this.options.createLaunchConfig) {
        await this._createIDEConfig(projectPath, ide, ideInfo);
      }

      // Install extensions if supported and enabled
      if (this.options.autoInstallExtensions && ideInfo.supportsExtensions) {
        await this._installExtensions(ide, ideInfo);
      }

      // Open the project
      await this._openProjectInIDE(projectPath, ide, ideInfo, options);
      
      this.emit('project:opened', { path: projectPath, ide });
    } catch (error) {
      this.emit('ide:error', { ide, error: error.message });
      throw error;
    }
  }

  /**
   * Check if IDE integration is available
   * @returns {boolean} Whether any IDE is available
   */
  isAvailable() {
    return this.availableIDEs.size > 0;
  }

  /**
   * Get available IDEs
   * @returns {Array<Object>} Available IDE information
   */
  getAvailableIDEs() {
    return Array.from(this.availableIDEs.entries()).map(([name, info]) => ({
      name,
      ...info
    }));
  }

  /**
   * Get preferred IDE
   * @returns {string|null} Preferred IDE name
   */
  getPreferredIDE() {
    if (this.availableIDEs.has(this.options.preferredIDE)) {
      return this.options.preferredIDE;
    }
    
    // Return first available IDE
    const available = Array.from(this.availableIDEs.keys());
    return available.length > 0 ? available[0] : null;
  }

  /**
   * Set preferred IDE
   * @param {string} ideName - IDE name
   * @returns {boolean} Success status
   */
  setPreferredIDE(ideName) {
    if (!this.availableIDEs.has(ideName)) {
      return false;
    }
    
    this.options.preferredIDE = ideName;
    return true;
  }

  /**
   * Detect available IDEs on the system
   * @returns {Promise<void>}
   */
  async _detectAvailableIDEs() {
    const ideDetectors = [
      this._detectVSCode.bind(this),
      this._detectCursor.bind(this),
      this._detectWebStorm.bind(this),
      this._detectSublimeText.bind(this)
    ];

    for (const detector of ideDetectors) {
      try {
        await detector();
      } catch (error) {
        // IDE not available, continue
      }
    }

    console.log(`Detected ${this.availableIDEs.size} IDE(s):`, Array.from(this.availableIDEs.keys()));
  }

  /**
   * Detect Visual Studio Code
   * @returns {Promise<void>}
   */
  async _detectVSCode() {
    const commands = process.platform === 'win32' 
      ? ['code.cmd', 'code']
      : ['code'];

    for (const command of commands) {
      try {
        await this._checkCommand(command, ['--version']);
        
        this.availableIDEs.set('vscode', {
          name: 'Visual Studio Code',
          command,
          supportsExtensions: true,
          extensions: [
            'ms-vscode.vscode-json',
            'bradlc.vscode-tailwindcss',
            'esbenp.prettier-vscode'
          ]
        });
        
        return;
      } catch (error) {
        // Continue to next command
      }
    }
    
    throw new Error('VS Code not found');
  }

  /**
   * Detect Cursor
   * @returns {Promise<void>}
   */
  async _detectCursor() {
    const commands = process.platform === 'win32' 
      ? ['cursor.cmd', 'cursor']
      : ['cursor'];

    for (const command of commands) {
      try {
        await this._checkCommand(command, ['--version']);
        
        this.availableIDEs.set('cursor', {
          name: 'Cursor',
          command,
          supportsExtensions: true,
          extensions: [
            'ms-vscode.vscode-json',
            'bradlc.vscode-tailwindcss',
            'esbenp.prettier-vscode'
          ]
        });
        
        return;
      } catch (error) {
        // Continue to next command
      }
    }
    
    throw new Error('Cursor not found');
  }

  /**
   * Detect WebStorm
   * @returns {Promise<void>}
   */
  async _detectWebStorm() {
    const commands = process.platform === 'darwin'
      ? ['/Applications/WebStorm.app/Contents/bin/webstorm']
      : process.platform === 'win32'
      ? ['webstorm.exe', 'webstorm']
      : ['webstorm'];

    for (const command of commands) {
      try {
        // WebStorm doesn't have a simple --version check, so we'll try to access it
        if (process.platform === 'darwin') {
          await fs.access(command);
        } else {
          await this._checkCommand(command, ['--version']);
        }
        
        this.availableIDEs.set('webstorm', {
          name: 'WebStorm',
          command,
          supportsExtensions: false
        });
        
        return;
      } catch (error) {
        // Continue to next command
      }
    }
    
    throw new Error('WebStorm not found');
  }

  /**
   * Detect Sublime Text
   * @returns {Promise<void>}
   */
  async _detectSublimeText() {
    const commands = process.platform === 'darwin'
      ? ['/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl']
      : process.platform === 'win32'
      ? ['subl.exe', 'sublime_text.exe']
      : ['subl', 'sublime_text'];

    for (const command of commands) {
      try {
        await this._checkCommand(command, ['--version']);
        
        this.availableIDEs.set('sublime', {
          name: 'Sublime Text',
          command,
          supportsExtensions: false
        });
        
        return;
      } catch (error) {
        // Continue to next command
      }
    }
    
    throw new Error('Sublime Text not found');
  }

  /**
   * Check if command is available
   * @param {string} command - Command to check
   * @param {Array<string>} args - Arguments to pass
   * @returns {Promise<void>}
   */
  async _checkCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { 
        stdio: 'pipe',
        timeout: 5000
      });
      
      let hasResponded = false;
      
      process.on('close', (code) => {
        if (!hasResponded) {
          hasResponded = true;
          if (code === 0 || code === null) {
            resolve();
          } else {
            reject(new Error(`Command failed with code ${code}`));
          }
        }
      });
      
      process.on('error', (error) => {
        if (!hasResponded) {
          hasResponded = true;
          reject(error);
        }
      });

      // Some IDEs respond quickly to --version
      setTimeout(() => {
        if (!hasResponded) {
          hasResponded = true;
          process.kill();
          resolve(); // Assume success if process starts
        }
      }, 2000);
    });
  }

  /**
   * Create IDE-specific configuration
   * @param {string} projectPath - Project path
   * @param {string} ide - IDE name
   * @param {Object} ideInfo - IDE information
   * @returns {Promise<void>}
   */
  async _createIDEConfig(projectPath, ide, ideInfo) {
    switch (ide) {
      case 'vscode':
      case 'cursor':
        await this._createVSCodeConfig(projectPath);
        break;
      case 'webstorm':
        await this._createWebStormConfig(projectPath);
        break;
      default:
        // No specific config needed
        break;
    }
  }

  /**
   * Create VS Code configuration
   * @param {string} projectPath - Project path
   * @returns {Promise<void>}
   */
  async _createVSCodeConfig(projectPath) {
    const vscodeDir = path.join(projectPath, '.vscode');
    
    try {
      await fs.mkdir(vscodeDir, { recursive: true });
      
      // Create launch.json for debugging
      const launchConfig = {
        version: '0.2.0',
        configurations: [
          {
            name: 'Debug Lahat App',
            type: 'node',
            request: 'launch',
            program: '${workspaceFolder}/main.js',
            env: {
              NODE_ENV: 'development',
              LAHAT_DEV_MODE: 'true'
            },
            console: 'integratedTerminal',
            skipFiles: ['<node_internals>/**']
          }
        ]
      };
      
      const launchPath = path.join(vscodeDir, 'launch.json');
      await fs.writeFile(launchPath, JSON.stringify(launchConfig, null, 2));
      
      // Create settings.json
      const settings = {
        'typescript.preferences.importModuleSpecifier': 'relative',
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
        'editor.formatOnSave': true,
        'files.associations': {
          '*.lahat': 'json'
        }
      };
      
      const settingsPath = path.join(vscodeDir, 'settings.json');
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      
    } catch (error) {
      console.warn('Failed to create VS Code configuration:', error);
    }
  }

  /**
   * Create WebStorm configuration
   * @param {string} projectPath - Project path
   * @returns {Promise<void>}
   */
  async _createWebStormConfig(projectPath) {
    // WebStorm configuration would go here
    // For now, just create a simple .idea directory
    const ideaDir = path.join(projectPath, '.idea');
    
    try {
      await fs.mkdir(ideaDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create WebStorm configuration:', error);
    }
  }

  /**
   * Install IDE extensions
   * @param {string} ide - IDE name
   * @param {Object} ideInfo - IDE information
   * @returns {Promise<void>}
   */
  async _installExtensions(ide, ideInfo) {
    if (!ideInfo.supportsExtensions || !ideInfo.extensions) {
      return;
    }

    for (const extension of ideInfo.extensions) {
      try {
        await this._installExtension(ide, ideInfo, extension);
      } catch (error) {
        console.warn(`Failed to install extension ${extension}:`, error);
      }
    }
  }

  /**
   * Install a single extension
   * @param {string} ide - IDE name
   * @param {Object} ideInfo - IDE information
   * @param {string} extension - Extension ID
   * @returns {Promise<void>}
   */
  async _installExtension(ide, ideInfo, extension) {
    return new Promise((resolve, reject) => {
      const process = spawn(ideInfo.command, ['--install-extension', extension], {
        stdio: 'pipe'
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Extension installation failed with code ${code}`));
        }
      });
      
      process.on('error', reject);
    });
  }

  /**
   * Open project in IDE
   * @param {string} projectPath - Project path
   * @param {string} ide - IDE name
   * @param {Object} ideInfo - IDE information
   * @param {Object} options - Open options
   * @returns {Promise<void>}
   */
  async _openProjectInIDE(projectPath, ide, ideInfo, options) {
    const args = [projectPath];
    
    // Add IDE-specific arguments
    if (options.newWindow && (ide === 'vscode' || ide === 'cursor')) {
      args.unshift('--new-window');
    }

    return new Promise((resolve, reject) => {
      const process = spawn(ideInfo.command, args, {
        stdio: 'pipe',
        detached: true
      });
      
      // Don't wait for the IDE to close, just ensure it launches
      setTimeout(() => {
        resolve();
      }, 1000);
      
      process.on('error', (error) => {
        reject(new Error(`Failed to open IDE: ${error.message}`));
      });
      
      // Allow the IDE process to run independently
      process.unref();
    });
  }
}