/**
 * Project Generator - Creates bare-bones Node.js projects for mini apps
 * Handles scaffolding new apps with templates and configuration
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class ProjectGenerator {
  constructor(options = {}) {
    this.options = {
      templatesDir: path.join(import.meta.url.replace('file://', ''), '../templates'),
      outputDir: path.join(os.homedir(), 'LahatApps'),
      ...options
    };
  }

  /**
   * Generate a new mini app project
   * @param {Object} config - Project configuration
   * @returns {Promise<string>} Path to generated project
   */
  async generateProject(config) {
    const {
      name,
      template = 'minimal',
      description = '',
      author = '',
      permissions = ['lahat:storage'],
      mcpRequirements = []
    } = config;

    // Validate configuration
    this._validateConfig(config);

    // Create project directory
    const projectPath = await this._createProjectDirectory(name);

    // Generate project from template
    await this._generateFromTemplate(template, projectPath, {
      name,
      description,
      author,
      permissions,
      mcpRequirements
    });

    // Initialize package.json
    await this._generatePackageJson(projectPath, {
      name,
      description,
      author
    });

    // Generate lahat.config.js
    await this._generateLahatConfig(projectPath, {
      name,
      permissions,
      mcpRequirements
    });

    // Generate README.md
    await this._generateReadme(projectPath, {
      name,
      description,
      template
    });

    return projectPath;
  }

  /**
   * List available templates
   * @returns {Promise<Array<Object>>} Available templates
   */
  async getAvailableTemplates() {
    const templatesPath = this._getTemplatesPath();
    
    try {
      const templateDirs = await fs.readdir(templatesPath);
      const templates = [];

      for (const dir of templateDirs) {
        const templatePath = path.join(templatesPath, dir);
        const stat = await fs.stat(templatePath);
        
        if (stat.isDirectory()) {
          const templateInfo = await this._getTemplateInfo(templatePath);
          templates.push({
            name: dir,
            ...templateInfo
          });
        }
      }

      return templates;
    } catch (error) {
      console.warn('Could not load templates:', error.message);
      return this._getBuiltInTemplates();
    }
  }

  /**
   * Validate project configuration
   * @param {Object} config - Configuration to validate
   */
  _validateConfig(config) {
    if (!config.name) {
      throw new Error('Project name is required');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(config.name)) {
      throw new Error('Project name must contain only letters, numbers, hyphens, and underscores');
    }

    if (config.name.length > 50) {
      throw new Error('Project name must be 50 characters or less');
    }
  }

  /**
   * Create project directory
   * @param {string} projectName - Name of the project
   * @returns {Promise<string>} Path to created directory
   */
  async _createProjectDirectory(projectName) {
    await fs.mkdir(this.options.outputDir, { recursive: true });
    
    const projectPath = path.join(this.options.outputDir, projectName);
    
    // Check if directory already exists
    try {
      await fs.access(projectPath);
      throw new Error(`Project directory already exists: ${projectPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await fs.mkdir(projectPath, { recursive: true });
    return projectPath;
  }

  /**
   * Generate project from template
   * @param {string} templateName - Name of the template
   * @param {string} projectPath - Path to the project directory
   * @param {Object} variables - Template variables
   */
  async _generateFromTemplate(templateName, projectPath, variables) {
    const templatePath = path.join(this._getTemplatesPath(), templateName);
    
    try {
      await fs.access(templatePath);
      await this._copyTemplate(templatePath, projectPath, variables);
    } catch (error) {
      // Fall back to built-in template
      await this._generateBuiltInTemplate(templateName, projectPath, variables);
    }
  }

  /**
   * Copy template files to project directory
   * @param {string} templatePath - Path to template directory
   * @param {string} projectPath - Path to project directory
   * @param {Object} variables - Template variables
   */
  async _copyTemplate(templatePath, projectPath, variables) {
    const files = await fs.readdir(templatePath, { withFileTypes: true });
    
    for (const file of files) {
      const sourcePath = path.join(templatePath, file.name);
      const targetPath = path.join(projectPath, file.name);
      
      if (file.isDirectory()) {
        await fs.mkdir(targetPath, { recursive: true });
        await this._copyTemplate(sourcePath, targetPath, variables);
      } else {
        let content = await fs.readFile(sourcePath, 'utf8');
        content = this._processTemplate(content, variables);
        await fs.writeFile(targetPath, content);
      }
    }
  }

  /**
   * Process template content with variables
   * @param {string} content - Template content
   * @param {Object} variables - Template variables
   * @returns {string} Processed content
   */
  _processTemplate(content, variables) {
    let processed = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    }
    
    return processed;
  }

  /**
   * Generate built-in template
   * @param {string} templateName - Name of the template
   * @param {string} projectPath - Path to project directory
   * @param {Object} variables - Template variables
   */
  async _generateBuiltInTemplate(templateName, projectPath, variables) {
    const templates = {
      minimal: this._generateMinimalTemplate,
      'ui-focused': this._generateUIFocusedTemplate,
      'mcp-enabled': this._generateMCPEnabledTemplate
    };

    const generator = templates[templateName] || templates.minimal;
    await generator.call(this, projectPath, variables);
  }

  /**
   * Generate minimal template
   * @param {string} projectPath - Path to project directory
   * @param {Object} variables - Template variables
   */
  async _generateMinimalTemplate(projectPath, variables) {
    // Create src directory
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });

    // Create main.js
    const mainJs = `/**
 * ${variables.name} - Main entry point
 * Generated by Lahat Project Generator
 */

import { lahat, storage } from '@lahat/runtime';

export async function main() {
  const logger = lahat.getLogger();
  
  logger.info('Starting ${variables.name}...');
  
  // Your app logic here
  console.log('Hello from ${variables.name}!');
  
  return { status: 'success', message: 'App executed successfully' };
}

// Export main function as default
export default main;
`;
    await fs.writeFile(path.join(projectPath, 'main.js'), mainJs);

    // Create src/app.js
    const appJs = `/**
 * ${variables.name} - Application logic
 */

export class App {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    // Initialize your app here
    console.log('Initializing ${variables.name}...');
    
    this.initialized = true;
  }

  async run() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Run your app logic here
    console.log('Running ${variables.name}...');
    
    return { success: true };
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'src', 'app.js'), appJs);

    // Create src/index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${variables.name}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>${variables.name}</h1>
        <p>Welcome to your new Lahat mini app!</p>
        
        <div class="status">
            <span id="status">Ready</span>
        </div>
        
        <button id="run-btn">Run App</button>
    </div>
    
    <script type="module" src="ui.js"></script>
</body>
</html>
`;
    await fs.writeFile(path.join(projectPath, 'src', 'index.html'), indexHtml);

    // Create src/style.css
    const styleCss = `/* ${variables.name} - Styles */

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
    color: #333;
    margin-bottom: 10px;
}

p {
    color: #666;
    line-height: 1.6;
}

.status {
    margin: 20px 0;
    padding: 10px;
    background-color: #e8f5e8;
    border-radius: 4px;
}

#status {
    font-weight: bold;
    color: #2d5a2d;
}

button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background-color: #0056b3;
}
`;
    await fs.writeFile(path.join(projectPath, 'src', 'style.css'), styleCss);

    // Create src/ui.js
    const uiJs = `/**
 * ${variables.name} - UI interactions
 */

import { App } from './app.js';

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const runButton = document.getElementById('run-btn');
    
    runButton.addEventListener('click', async () => {
        statusElement.textContent = 'Running...';
        runButton.disabled = true;
        
        try {
            const result = await app.run();
            
            if (result.success) {
                statusElement.textContent = 'Completed successfully!';
            } else {
                statusElement.textContent = 'Failed to run';
            }
        } catch (error) {
            statusElement.textContent = \`Error: \${error.message}\`;
        } finally {
            runButton.disabled = false;
        }
    });
});
`;
    await fs.writeFile(path.join(projectPath, 'src', 'ui.js'), uiJs);
  }

  /**
   * Generate UI-focused template
   * @param {string} projectPath - Path to project directory
   * @param {Object} variables - Template variables
   */
  async _generateUIFocusedTemplate(projectPath, variables) {
    // Start with minimal template
    await this._generateMinimalTemplate(projectPath, variables);
    
    // Add additional UI components and styling
    // This would include more sophisticated UI setup
  }

  /**
   * Generate MCP-enabled template
   * @param {string} projectPath - Path to project directory
   * @param {Object} variables - Template variables
   */
  async _generateMCPEnabledTemplate(projectPath, variables) {
    // Start with minimal template
    await this._generateMinimalTemplate(projectPath, variables);
    
    // Add MCP integration example
    const mcpExampleJs = `/**
 * ${variables.name} - MCP Integration Example
 */

import { getMCP } from '@lahat/runtime';

export class MCPIntegration {
  constructor() {
    this.mcp = getMCP();
  }

  async demonstrateMCP() {
    try {
      // List available MCP servers
      const servers = await this.mcp.listServers();
      console.log('Available MCP servers:', servers);
      
      // Example: Call AI text generation if available
      const hasAI = await this.mcp.isAvailable('ai-text-generation');
      if (hasAI) {
        const response = await this.mcp.call('ai-text-generation', 'generate', {
          prompt: 'Hello from ${variables.name}!',
          maxTokens: 50
        });
        console.log('AI Response:', response);
        return response;
      } else {
        console.log('AI text generation not available');
        return null;
      }
    } catch (error) {
      console.error('MCP Error:', error);
      throw error;
    }
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'src', 'mcp-integration.js'), mcpExampleJs);
  }

  /**
   * Generate package.json
   * @param {string} projectPath - Path to project directory
   * @param {Object} metadata - Project metadata
   */
  async _generatePackageJson(projectPath, metadata) {
    const packageJson = {
      name: metadata.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: metadata.description || `A Lahat mini app: ${metadata.name}`,
      main: 'main.js',
      type: 'module',
      scripts: {
        start: 'node main.js',
        dev: 'node --watch main.js'
      },
      dependencies: {
        '@lahat/runtime': '^3.0.0'
      },
      author: metadata.author || '',
      license: 'MIT',
      keywords: ['lahat', 'mini-app'],
      engines: {
        node: '>=18.0.0'
      }
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  /**
   * Generate lahat.config.js
   * @param {string} projectPath - Path to project directory
   * @param {Object} config - Lahat configuration
   */
  async _generateLahatConfig(projectPath, config) {
    const lahatConfig = `/**
 * Lahat Configuration for ${config.name}
 * This file defines how your app integrates with the Lahat platform
 */

export default {
  // App metadata
  name: "${config.name}",
  version: "1.0.0",
  description: "A Lahat mini app",
  
  // Entry point for the app
  entrypoint: "./main.js",
  
  // Permissions required by the app
  permissions: ${JSON.stringify(config.permissions, null, 4)},
  
  // MCP server requirements
  mcpRequirements: ${JSON.stringify(config.mcpRequirements, null, 4)},
  
  // UI configuration
  ui: {
    // Path to the main UI file (optional)
    main: "./src/index.html",
    
    // Window configuration
    window: {
      width: 800,
      height: 600,
      resizable: true
    }
  },
  
  // Development configuration
  development: {
    // Enable hot reload in development
    hotReload: true,
    
    // Development server port (optional)
    port: 3000
  }
};
`;

    await fs.writeFile(path.join(projectPath, 'lahat.config.js'), lahatConfig);
  }

  /**
   * Generate README.md
   * @param {string} projectPath - Path to project directory
   * @param {Object} metadata - Project metadata
   */
  async _generateReadme(projectPath, metadata) {
    const readme = `# ${metadata.name}

${metadata.description || 'A Lahat mini app'}

## Getting Started

This project was generated using the Lahat Project Generator with the "${metadata.template}" template.

### Development

1. Open this project in your preferred IDE (VS Code recommended)
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run in development mode:
   \`\`\`bash
   npm run dev
   \`\`\`

### Project Structure

- \`main.js\` - Main entry point for the app
- \`lahat.config.js\` - Lahat platform configuration
- \`src/\` - Application source code
  - \`app.js\` - Core application logic
  - \`index.html\` - Main UI file
  - \`style.css\` - Styles
  - \`ui.js\` - UI interactions

### Lahat APIs

This app has access to the following Lahat APIs:

- **Platform API**: \`lahat.getPlatformInfo()\`, \`lahat.emit()\`, etc.
- **Storage API**: \`storage.set()\`, \`storage.get()\`, etc.
- **Logger API**: \`lahat.getLogger()\`
- **Utils API**: \`lahat.getUtils()\`

### Permissions

This app requests the following permissions:

${metadata.permissions ? metadata.permissions.map(p => `- \`${p}\``).join('\n') : '- None'}

### Building

When you're ready to share your app:

1. Use the Lahat platform to package your app as a \`.lahat\` file
2. Share the \`.lahat\` file with others
3. Others can install and run your app with one click

## Learn More

- [Lahat Documentation](https://docs.lahat.dev)
- [API Reference](https://docs.lahat.dev/api)
- [Examples](https://docs.lahat.dev/examples)
`;

    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  /**
   * Get templates directory path
   * @returns {string} Templates directory path
   */
  _getTemplatesPath() {
    return path.resolve(path.dirname(import.meta.url.replace('file://', '')), 'templates');
  }

  /**
   * Get template information
   * @param {string} templatePath - Path to template directory
   * @returns {Promise<Object>} Template information
   */
  async _getTemplateInfo(templatePath) {
    try {
      const infoPath = path.join(templatePath, 'template.json');
      const infoContent = await fs.readFile(infoPath, 'utf8');
      return JSON.parse(infoContent);
    } catch (error) {
      return {
        description: 'Custom template',
        features: []
      };
    }
  }

  /**
   * Get built-in template definitions
   * @returns {Array<Object>} Built-in templates
   */
  _getBuiltInTemplates() {
    return [
      {
        name: 'minimal',
        description: 'A minimal Node.js app with basic Lahat integration',
        features: ['Basic structure', 'Lahat APIs', 'Simple UI']
      },
      {
        name: 'ui-focused',
        description: 'A template focused on user interface development',
        features: ['Enhanced UI', 'CSS framework', 'Interactive components']
      },
      {
        name: 'mcp-enabled',
        description: 'A template with MCP server integration examples',
        features: ['MCP integration', 'AI capabilities', 'External services']
      }
    ];
  }
}