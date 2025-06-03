/**
 * Lahat MCP Server - Exposes Lahat capabilities as MCP server
 * Allows external tools to interact with Lahat programmatically
 */

import { EventEmitter } from 'events';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { AppLauncher } from './capabilities/AppLauncher.js';
import { AppInstaller } from './capabilities/AppInstaller.js';
import { ProjectOperations } from './capabilities/ProjectOperations.js';

export class LahatMCPServer extends EventEmitter {
  constructor(lahatRuntime, options = {}) {
    super();
    
    this.runtime = lahatRuntime;
    this.options = {
      name: 'lahat-platform',
      version: '3.0.0',
      description: 'Lahat Mini App Platform MCP Server',
      transport: 'stdio', // 'stdio' | 'sse' | 'websocket'
      ...options
    };
    
    // Create MCP server using official SDK
    this.server = new Server(
      {
        name: this.options.name,
        version: this.options.version,
        description: this.options.description
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );
    
    this.capabilities = this._initializeCapabilities();
    this.transport = null;
    this.isRunning = false;
    
    this._setupMCPHandlers();
  }

  /**
   * Initialize MCP server capabilities
   */
  _initializeCapabilities() {
    return {
      appLauncher: new AppLauncher(this.runtime),
      appInstaller: new AppInstaller(this.runtime),
      projectOperations: new ProjectOperations(this.runtime)
    };
  }

  /**
   * Start the MCP server
   */
  async start() {
    try {
      // Create transport based on options
      switch (this.options.transport) {
        case 'stdio':
          this.transport = new StdioServerTransport();
          break;
        default:
          throw new Error(`Unsupported transport: ${this.options.transport}`);
      }
      
      // Connect server to transport
      await this.server.connect(this.transport);
      
      this.isRunning = true;
      this.emit('started', {
        name: this.options.name,
        version: this.options.version,
        transport: this.options.transport
      });
      
      console.log(`🚀 Lahat MCP Server started with ${this.options.transport} transport`);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop() {
    try {
      if (this.server) {
        await this.server.close();
      }
      
      this.isRunning = false;
      this.emit('stopped');
      
      console.log('🛑 Lahat MCP Server stopped');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Setup MCP protocol handlers
   */
  _setupMCPHandlers() {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this._getAvailableTools()
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this._executeTool(name, args || {});
    });

    // Handle resource listing
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: this._getAvailableResources()
      };
    });

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      return await this._readResource(uri);
    });

    // Handle prompt listing
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: this._getAvailablePrompts()
      };
    });

    // Handle prompt execution
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this._executePrompt(name, args || {});
    });
  }

  /**
   * Get available tools
   */
  _getAvailableTools() {
    return [
      // App Management Tools
      {
        name: 'lahat:app:create',
        description: 'Create a new mini app project',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'App name' },
            template: { type: 'string', enum: ['minimal', 'ui-focused', 'mcp-enabled'], default: 'minimal' },
            description: { type: 'string', description: 'App description' },
            author: { type: 'string', description: 'App author' },
            permissions: { type: 'array', items: { type: 'string' }, description: 'Required permissions' },
            mcpRequirements: { type: 'array', items: { type: 'string' }, description: 'Required MCP capabilities' }
          },
          required: ['name']
        }
      },
      {
        name: 'lahat:app:launch',
        description: 'Launch an installed mini app',
        inputSchema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'App ID or name to launch' },
            args: { type: 'object', description: 'Launch arguments' }
          },
          required: ['appId']
        }
      },
      {
        name: 'lahat:app:install',
        description: 'Install a .lahat app package',
        inputSchema: {
          type: 'object',
          properties: {
            packagePath: { type: 'string', description: 'Path to .lahat package file' },
            overwrite: { type: 'boolean', default: false, description: 'Overwrite if app exists' }
          },
          required: ['packagePath']
        }
      },
      {
        name: 'lahat:app:list',
        description: 'List all installed apps',
        inputSchema: {
          type: 'object',
          properties: {
            filter: { type: 'string', description: 'Filter apps by name or status' },
            includeRunning: { type: 'boolean', default: true, description: 'Include running status' }
          }
        }
      },
      {
        name: 'lahat:app:stop',
        description: 'Stop a running mini app',
        inputSchema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'App ID to stop' }
          },
          required: ['appId']
        }
      },

      // Project Management Tools
      {
        name: 'lahat:project:package',
        description: 'Package a project into .lahat file',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: { type: 'string', description: 'Path to project directory' },
            outputPath: { type: 'string', description: 'Output path for .lahat file' },
            version: { type: 'string', description: 'Package version' },
            metadata: { type: 'object', description: 'Additional package metadata' }
          },
          required: ['projectPath']
        }
      },
      {
        name: 'lahat:project:validate',
        description: 'Validate a project structure',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: { type: 'string', description: 'Path to project directory' }
          },
          required: ['projectPath']
        }
      },

      // MCP Integration Tools
      {
        name: 'lahat:mcp:servers',
        description: 'List available MCP servers',
        inputSchema: {
          type: 'object',
          properties: {
            filter: { type: 'string', description: 'Filter by capability or status' }
          }
        }
      },
      {
        name: 'lahat:mcp:capabilities',
        description: 'List available MCP capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            server: { type: 'string', description: 'Filter by specific server' }
          }
        }
      }
    ];
  }

  /**
   * Get available resources
   */
  _getAvailableResources() {
    return [
      {
        uri: 'lahat://apps/list',
        name: 'Installed Apps',
        description: 'List of all installed mini apps',
        mimeType: 'application/json'
      },
      {
        uri: 'lahat://projects/list',
        name: 'Local Projects',
        description: 'List of local development projects',
        mimeType: 'application/json'
      },
      {
        uri: 'lahat://mcp/servers',
        name: 'MCP Servers',
        description: 'List of available MCP servers and their capabilities',
        mimeType: 'application/json'
      },
      {
        uri: 'lahat://platform/status',
        name: 'Platform Status',
        description: 'Current platform status and statistics',
        mimeType: 'application/json'
      }
    ];
  }

  /**
   * Get available prompts
   */
  _getAvailablePrompts() {
    return [
      {
        name: 'create-app-prompt',
        description: 'Generate a prompt for creating a new mini app',
        arguments: [
          {
            name: 'description',
            description: 'What the app should do',
            required: true
          },
          {
            name: 'complexity',
            description: 'App complexity level',
            required: false
          }
        ]
      },
      {
        name: 'debug-app-prompt',
        description: 'Generate debugging prompts for app issues',
        arguments: [
          {
            name: 'appId',
            description: 'App to debug',
            required: true
          },
          {
            name: 'issue',
            description: 'Description of the issue',
            required: true
          }
        ]
      }
    ];
  }

  /**
   * Execute a tool
   */
  async _executeTool(toolName, args = {}) {
    try {
      switch (toolName) {
        case 'lahat:app:create':
          return await this.capabilities.projectOperations.createProject(args);
        
        case 'lahat:app:launch':
          return await this.capabilities.appLauncher.launchApp(args.appId, args.args);
        
        case 'lahat:app:install':
          return await this.capabilities.appInstaller.installApp(args.packagePath, args);
        
        case 'lahat:app:list':
          return await this.capabilities.appLauncher.listApps(args);
        
        case 'lahat:app:stop':
          return await this.capabilities.appLauncher.stopApp(args.appId);
        
        case 'lahat:project:package':
          return await this.capabilities.projectOperations.packageProject(args);
        
        case 'lahat:project:validate':
          return await this.capabilities.projectOperations.validateProject(args.projectPath);
        
        case 'lahat:mcp:servers':
          return await this.capabilities.projectOperations.listMCPServers(args);
        
        case 'lahat:mcp:capabilities':
          return await this.capabilities.projectOperations.listMCPCapabilities(args);
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      this.emit('tool:error', { toolName, args, error: error.message });
      throw error;
    }
  }

  /**
   * Read a resource
   */
  async _readResource(uri) {
    try {
      // Parse lahat:// URIs manually since they're custom
      const path = uri.replace('lahat://', '/');
      
      switch (path) {
        case '/apps/list':
          return {
            contents: [
              {
                type: 'text',
                text: JSON.stringify(await this.capabilities.appLauncher.listApps(), null, 2)
              }
            ]
          };
        
        case '/projects/list':
          return {
            contents: [
              {
                type: 'text', 
                text: JSON.stringify(await this.capabilities.projectOperations.listProjects(), null, 2)
              }
            ]
          };
        
        case '/mcp/servers':
          return {
            contents: [
              {
                type: 'text',
                text: JSON.stringify(await this.capabilities.projectOperations.listMCPServers(), null, 2)
              }
            ]
          };
        
        case '/platform/status':
          return {
            contents: [
              {
                type: 'text',
                text: JSON.stringify({
                  isRunning: this.isRunning,
                  version: this.options.version,
                  uptime: process.uptime(),
                  memoryUsage: process.memoryUsage(),
                  runningApps: this.runtime.runningApps.size
                }, null, 2)
              }
            ]
          };
        
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    } catch (error) {
      this.emit('resource:error', { uri, error: error.message });
      throw error;
    }
  }

  /**
   * Execute a prompt
   */
  async _executePrompt(promptName, args = {}) {
    try {
      switch (promptName) {
        case 'create-app-prompt':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: this._generateCreateAppPrompt(args)
                }
              }
            ]
          };
        
        case 'debug-app-prompt':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: this._generateDebugAppPrompt(args)
                }
              }
            ]
          };
        
        default:
          throw new Error(`Unknown prompt: ${promptName}`);
      }
    } catch (error) {
      this.emit('prompt:error', { promptName, args, error: error.message });
      throw error;
    }
  }

  /**
   * Generate create app prompt
   */
  _generateCreateAppPrompt(args) {
    const { description, complexity = 'simple' } = args;
    
    return `Create a Lahat mini app that ${description}.

The app should be built using the Lahat platform APIs:
- Use @lahat/runtime for platform integration
- Access persistent storage via the storage API
- Leverage MCP servers for enhanced capabilities
- Follow Lahat's security model with proper permissions

Complexity level: ${complexity}

Please scaffold the project structure and implement the core functionality.`;
  }

  /**
   * Generate debug app prompt
   */
  _generateDebugAppPrompt(args) {
    const { appId, issue } = args;
    
    return `Debug the Lahat mini app "${appId}" which is experiencing the following issue:

${issue}

Please analyze the app's code, configuration, and runtime behavior to identify the root cause and suggest fixes. Consider:
- Lahat API usage and permissions
- MCP server integration issues
- Runtime environment conflicts
- Configuration problems in lahat.config.js

Provide step-by-step debugging instructions and code fixes.`;
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      name: this.options.name,
      version: this.options.version,
      transport: this.options.transport,
      capabilities: Object.keys(this.capabilities),
      toolCount: this._getAvailableTools().length,
      resourceCount: this._getAvailableResources().length,
      promptCount: this._getAvailablePrompts().length
    };
  }
}