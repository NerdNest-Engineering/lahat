/**
 * IDE Launcher - Opens projects in user's preferred IDE
 * Supports VS Code, WebStorm, Sublime Text, and other popular editors
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const execAsync = promisify(exec);

export class IDELauncher {
  constructor() {
    this.supportedIDEs = [
      {
        name: 'Visual Studio Code',
        id: 'vscode',
        commands: {
          darwin: ['code'],
          win32: ['code.cmd', 'code'],
          linux: ['code']
        },
        extensions: ['.vscode']
      },
      {
        name: 'WebStorm',
        id: 'webstorm',
        commands: {
          darwin: ['webstorm'],
          win32: ['webstorm.cmd', 'webstorm'],
          linux: ['webstorm']
        },
        extensions: ['.idea']
      },
      {
        name: 'Sublime Text',
        id: 'sublime',
        commands: {
          darwin: ['subl'],
          win32: ['subl.exe', 'sublime_text.exe'],
          linux: ['subl', 'sublime_text']
        },
        extensions: []
      },
      {
        name: 'Atom',
        id: 'atom',
        commands: {
          darwin: ['atom'],
          win32: ['atom.cmd', 'atom'],
          linux: ['atom']
        },
        extensions: []
      }
    ];
  }

  /**
   * Launch project in user's preferred IDE
   * @param {string} projectPath - Path to the project directory
   * @param {Object} options - Launch options
   * @returns {Promise<boolean>} Success status
   */
  async launchProject(projectPath, options = {}) {
    const {
      preferredIDE = null,
      fallbackToSystem = true,
      timeout = 10000
    } = options;

    try {
      // Try preferred IDE first
      if (preferredIDE) {
        const success = await this._launchWithIDE(projectPath, preferredIDE, timeout);
        if (success) return true;
      }

      // Auto-detect and launch with available IDE
      const availableIDE = await this._detectAvailableIDE(projectPath);
      if (availableIDE) {
        const success = await this._launchWithIDE(projectPath, availableIDE, timeout);
        if (success) return true;
      }

      // Fallback to system default
      if (fallbackToSystem) {
        return await this._launchWithSystemDefault(projectPath);
      }

      return false;
    } catch (error) {
      console.error('Failed to launch IDE:', error);
      return false;
    }
  }

  /**
   * Detect available IDEs on the system
   * @returns {Promise<Array<Object>>} Available IDEs
   */
  async getAvailableIDEs() {
    const available = [];
    
    for (const ide of this.supportedIDEs) {
      const isAvailable = await this._isIDEAvailable(ide);
      if (isAvailable) {
        available.push({
          name: ide.name,
          id: ide.id,
          installed: true
        });
      }
    }
    
    return available;
  }

  /**
   * Set up IDE-specific project configuration
   * @param {string} projectPath - Path to the project directory
   * @param {string} ideId - IDE identifier
   * @returns {Promise<void>}
   */
  async setupIDEConfig(projectPath, ideId) {
    const ide = this.supportedIDEs.find(i => i.id === ideId);
    if (!ide) return;

    try {
      if (ideId === 'vscode') {
        await this._setupVSCodeConfig(projectPath);
      } else if (ideId === 'webstorm') {
        await this._setupWebStormConfig(projectPath);
      }
    } catch (error) {
      console.warn(`Failed to setup ${ide.name} configuration:`, error);
    }
  }

  /**
   * Launch with specific IDE
   * @param {string} projectPath - Path to the project directory
   * @param {string} ideId - IDE identifier
   * @param {number} timeout - Launch timeout in ms
   * @returns {Promise<boolean>} Success status
   */
  async _launchWithIDE(projectPath, ideId, timeout) {
    const ide = this.supportedIDEs.find(i => i.id === ideId);
    if (!ide) return false;

    const platform = os.platform();
    const commands = ide.commands[platform] || ide.commands.linux;
    
    for (const command of commands) {
      try {
        await this._executeCommand(command, [projectPath], timeout);
        console.log(`Successfully launched ${ide.name}`);
        return true;
      } catch (error) {
        // Try next command
        continue;
      }
    }
    
    return false;
  }

  /**
   * Detect which IDE should be used for the project
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<string|null>} IDE identifier or null
   */
  async _detectAvailableIDE(projectPath) {
    // Check for IDE-specific project files
    for (const ide of this.supportedIDEs) {
      for (const extension of ide.extensions) {
        try {
          await fs.access(path.join(projectPath, extension));
          const isAvailable = await this._isIDEAvailable(ide);
          if (isAvailable) {
            return ide.id;
          }
        } catch (error) {
          // Extension directory doesn't exist
        }
      }
    }

    // Return first available IDE
    for (const ide of this.supportedIDEs) {
      const isAvailable = await this._isIDEAvailable(ide);
      if (isAvailable) {
        return ide.id;
      }
    }

    return null;
  }

  /**
   * Check if IDE is available on the system
   * @param {Object} ide - IDE configuration
   * @returns {Promise<boolean>} Whether IDE is available
   */
  async _isIDEAvailable(ide) {
    const platform = os.platform();
    const commands = ide.commands[platform] || ide.commands.linux;
    
    for (const command of commands) {
      try {
        const checkCommand = platform === 'win32' ? 
          `where ${command}` : 
          `which ${command}`;
        
        await execAsync(checkCommand);
        return true;
      } catch (error) {
        // Command not found, try next
        continue;
      }
    }
    
    return false;
  }

  /**
   * Launch with system default application
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<boolean>} Success status
   */
  async _launchWithSystemDefault(projectPath) {
    try {
      const platform = os.platform();
      
      if (platform === 'darwin') {
        await execAsync(`open "${projectPath}"`);
      } else if (platform === 'win32') {
        await execAsync(`start "" "${projectPath}"`);
      } else {
        await execAsync(`xdg-open "${projectPath}"`);
      }
      
      console.log('Opened project with system default application');
      return true;
    } catch (error) {
      console.error('Failed to open with system default:', error);
      return false;
    }
  }

  /**
   * Execute command with timeout
   * @param {string} command - Command to execute
   * @param {Array<string>} args - Command arguments
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  _executeCommand(command, args, timeout) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        detached: true,
        stdio: 'ignore'
      });

      const timer = setTimeout(() => {
        child.kill();
        reject(new Error('Command timeout'));
      }, timeout);

      child.on('spawn', () => {
        clearTimeout(timer);
        child.unref(); // Allow parent process to exit
        resolve();
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Setup VS Code specific configuration
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<void>}
   */
  async _setupVSCodeConfig(projectPath) {
    const vscodeDir = path.join(projectPath, '.vscode');
    await fs.mkdir(vscodeDir, { recursive: true });

    // Create settings.json
    const settings = {
      "files.associations": {
        "lahat.config.js": "javascript"
      },
      "emmet.includeLanguages": {
        "javascript": "javascriptreact"
      },
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      }
    };

    await fs.writeFile(
      path.join(vscodeDir, 'settings.json'),
      JSON.stringify(settings, null, 2)
    );

    // Create launch.json for debugging
    const launch = {
      "version": "0.2.0",
      "configurations": [
        {
          "name": "Launch App",
          "type": "node",
          "request": "launch",
          "program": "${workspaceFolder}/main.js",
          "skipFiles": ["<node_internals>/**"],
          "env": {
            "NODE_ENV": "development"
          }
        }
      ]
    };

    await fs.writeFile(
      path.join(vscodeDir, 'launch.json'),
      JSON.stringify(launch, null, 2)
    );

    // Create extensions.json for recommended extensions
    const extensions = {
      "recommendations": [
        "ms-vscode.vscode-node-azure-pack",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-eslint",
        "bradlc.vscode-tailwindcss"
      ]
    };

    await fs.writeFile(
      path.join(vscodeDir, 'extensions.json'),
      JSON.stringify(extensions, null, 2)
    );
  }

  /**
   * Setup WebStorm specific configuration
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<void>}
   */
  async _setupWebStormConfig(projectPath) {
    const ideaDir = path.join(projectPath, '.idea');
    await fs.mkdir(ideaDir, { recursive: true });

    // Create basic WebStorm configuration
    const workspace = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="NodeJsWorkspace">
    <option name="interpreterRef" value="project" />
    <option name="packageManagerPath" value="npm" />
  </component>
</project>`;

    await fs.writeFile(
      path.join(ideaDir, 'workspace.xml'),
      workspace
    );
  }
}