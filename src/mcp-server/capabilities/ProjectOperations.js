/**
 * Project Operations Capability - Manage projects and platform features
 * Provides MCP tools for project creation, packaging, and platform management
 */

import { EventEmitter } from 'events';
import { ProjectGenerator } from '../../scaffolding/ProjectGenerator.js';
import { AppPackager } from '../../distribution/AppPackager.js';
import { AppValidator } from '../../distribution/AppValidator.js';
import path from 'path';
import os from 'os';

export class ProjectOperations extends EventEmitter {
  constructor(lahatRuntime) {
    super();
    this.runtime = lahatRuntime;
    this.generator = new ProjectGenerator({
      outputDir: path.join(os.homedir(), 'LahatProjects')
    });
    this.packager = new AppPackager({
      outputDir: path.join(os.homedir(), 'LahatPackages')
    });
    this.validator = new AppValidator();
  }

  /**
   * Create a new project
   * @param {Object} config - Project configuration
   * @returns {Promise<Object>} Creation result
   */
  async createProject(config) {
    try {
      const {
        name,
        template = 'minimal',
        description = '',
        author = '',
        permissions = ['lahat:storage'],
        mcpRequirements = []
      } = config;

      // Validate project configuration
      if (!name || typeof name !== 'string') {
        throw new Error('Project name is required and must be a string');
      }

      // Generate the project
      const projectPath = await this.generator.generateProject({
        name,
        template,
        description,
        author,
        permissions,
        mcpRequirements
      });

      this.emit('project:created', { 
        name, 
        projectPath, 
        template, 
        config 
      });

      return {
        success: true,
        projectName: name,
        projectPath,
        template,
        createdAt: new Date().toISOString(),
        files: await this._getProjectFiles(projectPath)
      };
    } catch (error) {
      this.emit('project:create-failed', { config, error: error.message });
      throw error;
    }
  }

  /**
   * Package a project into .lahat file
   * @param {Object} options - Packaging options
   * @returns {Promise<Object>} Packaging result
   */
  async packageProject(options) {
    try {
      const {
        projectPath,
        outputPath,
        version,
        metadata = {}
      } = options;

      if (!projectPath) {
        throw new Error('Project path is required');
      }

      // Validate project first
      const validationResult = await this.validator.validateApp(projectPath);
      if (!validationResult.isValid) {
        throw new Error(`Invalid project: ${validationResult.errors.join(', ')}`);
      }

      // Package the project
      const packagePath = await this.packager.packageApp(projectPath, {
        outputName: outputPath ? path.basename(outputPath, '.lahat') : undefined,
        version,
        ...metadata
      });

      // Get package metadata
      const packageMetadata = await this.packager.getPackageMetadata(packagePath);

      this.emit('project:packaged', { 
        projectPath, 
        packagePath, 
        metadata: packageMetadata 
      });

      return {
        success: true,
        projectPath,
        packagePath,
        version: packageMetadata.version,
        size: packageMetadata.size,
        packagedAt: packageMetadata.packagedAt
      };
    } catch (error) {
      this.emit('project:package-failed', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Validate a project
   * @param {string} projectPath - Path to project directory
   * @returns {Promise<Object>} Validation result
   */
  async validateProject(projectPath) {
    try {
      const result = await this.validator.validateApp(projectPath);

      this.emit('project:validated', { 
        projectPath, 
        isValid: result.isValid,
        issues: result.errors.length + result.warnings.length
      });

      return {
        success: true,
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        validatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.emit('project:validate-failed', { projectPath, error: error.message });
      throw error;
    }
  }

  /**
   * List local projects
   * @param {Object} options - List options
   * @returns {Promise<Object>} Projects list
   */
  async listProjects(options = {}) {
    try {
      const { includeMetadata = true } = options;
      
      const projects = await this._getLocalProjects();

      // Add metadata if requested
      if (includeMetadata) {
        for (const project of projects) {
          try {
            const validation = await this.validator.validateApp(project.path);
            project.isValid = validation.isValid;
            project.issueCount = validation.errors.length + validation.warnings.length;
          } catch {
            project.isValid = false;
            project.issueCount = -1;
          }
        }
      }

      return {
        success: true,
        projects,
        total: projects.length
      };
    } catch (error) {
      this.emit('projects:list-failed', { options, error: error.message });
      throw error;
    }
  }

  /**
   * List available MCP servers
   * @param {Object} options - List options
   * @returns {Promise<Object>} MCP servers list
   */
  async listMCPServers(options = {}) {
    try {
      const { filter } = options;
      
      // Get MCP registry from runtime
      const mcpManager = this.runtime.apis?.lahat?.getMCP?.();
      if (!mcpManager) {
        throw new Error('MCP system not available');
      }

      const servers = await mcpManager.listServers();
      
      // Filter servers if requested
      let filteredServers = servers;
      if (filter) {
        const filterLower = filter.toLowerCase();
        filteredServers = servers.filter(server =>
          server.name.toLowerCase().includes(filterLower) ||
          server.capabilities?.some(cap => cap.toLowerCase().includes(filterLower))
        );
      }

      return {
        success: true,
        servers: filteredServers,
        total: filteredServers.length,
        totalAvailable: servers.length
      };
    } catch (error) {
      this.emit('mcp:list-servers-failed', { options, error: error.message });
      throw error;
    }
  }

  /**
   * List available MCP capabilities
   * @param {Object} options - List options
   * @returns {Promise<Object>} MCP capabilities list
   */
  async listMCPCapabilities(options = {}) {
    try {
      const { server } = options;
      
      // Get MCP registry from runtime
      const mcpManager = this.runtime.apis?.lahat?.getMCP?.();
      if (!mcpManager) {
        throw new Error('MCP system not available');
      }

      let capabilities = [];
      
      if (server) {
        // Get capabilities for specific server
        const serverInfo = await mcpManager.getServer(server);
        if (!serverInfo) {
          throw new Error(`Server not found: ${server}`);
        }
        capabilities = serverInfo.capabilities || [];
      } else {
        // Get all capabilities from all servers
        const servers = await mcpManager.listServers();
        capabilities = servers.flatMap(s => 
          (s.capabilities || []).map(cap => ({
            ...cap,
            server: s.name
          }))
        );
      }

      return {
        success: true,
        capabilities,
        total: capabilities.length,
        server: server || 'all'
      };
    } catch (error) {
      this.emit('mcp:list-capabilities-failed', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Get project templates
   * @returns {Promise<Object>} Available templates
   */
  async getProjectTemplates() {
    try {
      const templates = [
        {
          name: 'minimal',
          displayName: 'Minimal App',
          description: 'Basic Node.js setup with Lahat integration',
          files: ['main.js', 'package.json', 'lahat.config.js', 'README.md']
        },
        {
          name: 'ui-focused',
          displayName: 'UI-Focused App',
          description: 'Template for apps with user interfaces',
          files: ['main.js', 'package.json', 'lahat.config.js', 'index.html', 'styles.css']
        },
        {
          name: 'mcp-enabled',
          displayName: 'MCP-Enabled App',
          description: 'Template with MCP server integration',
          files: ['main.js', 'package.json', 'lahat.config.js', 'mcp-config.js']
        }
      ];

      return {
        success: true,
        templates,
        total: templates.length
      };
    } catch (error) {
      this.emit('templates:list-failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get platform status
   * @returns {Promise<Object>} Platform status
   */
  async getPlatformStatus() {
    try {
      const status = {
        runtime: {
          isActive: true,
          runningApps: this.runtime.runningApps.size,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime()
        },
        mcp: {
          isEnabled: Boolean(this.runtime.apis?.lahat?.getMCP),
          serverCount: await this._getMCPServerCount(),
          capabilityCount: await this._getMCPCapabilityCount()
        },
        projects: {
          projectsDir: this.generator.options.outputDir,
          packagesDir: this.packager.options.outputDir,
          totalProjects: await this._getProjectCount()
        }
      };

      return {
        success: true,
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.emit('platform:status-failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get project files
   * @private
   */
  async _getProjectFiles(projectPath) {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(projectPath, { withFileTypes: true });
      return files
        .filter(file => file.isFile())
        .map(file => file.name);
    } catch {
      return [];
    }
  }

  /**
   * Get local projects
   * @private
   */
  async _getLocalProjects() {
    // Mock implementation - would scan projects directory
    return [
      {
        name: 'my-todo-app',
        path: '/Users/user/LahatProjects/my-todo-app',
        template: 'ui-focused',
        createdAt: '2024-01-15T10:30:00.000Z',
        lastModified: '2024-01-20T14:45:00.000Z'
      },
      {
        name: 'weather-widget',
        path: '/Users/user/LahatProjects/weather-widget',
        template: 'mcp-enabled',
        createdAt: '2024-01-18T09:15:00.000Z',
        lastModified: '2024-01-22T16:20:00.000Z'
      }
    ];
  }

  /**
   * Get MCP server count
   * @private
   */
  async _getMCPServerCount() {
    try {
      const mcpManager = this.runtime.apis?.lahat?.getMCP?.();
      if (!mcpManager) return 0;
      const servers = await mcpManager.listServers();
      return servers.length;
    } catch {
      return 0;
    }
  }

  /**
   * Get MCP capability count
   * @private
   */
  async _getMCPCapabilityCount() {
    try {
      const mcpManager = this.runtime.apis?.lahat?.getMCP?.();
      if (!mcpManager) return 0;
      const servers = await mcpManager.listServers();
      return servers.reduce((total, server) => total + (server.capabilities?.length || 0), 0);
    } catch {
      return 0;
    }
  }

  /**
   * Get project count
   * @private
   */
  async _getProjectCount() {
    try {
      const projects = await this._getLocalProjects();
      return projects.length;
    } catch {
      return 0;
    }
  }

  /**
   * Get project operations status
   */
  getStatus() {
    return {
      projectsDir: this.generator.options.outputDir,
      packagesDir: this.packager.options.outputDir,
      capabilities: ['create', 'package', 'validate', 'list', 'templates', 'status']
    };
  }
}