/**
 * App Validator - Validate .lahat packages and apps
 * TODO: Implement full validation functionality
 */

import fs from 'fs/promises';
import path from 'path';

export class AppValidator {
  constructor(options = {}) {
    this.options = {
      strict: false,
      ...options
    };
  }

  /**
   * Validate an app directory
   * @param {string} appPath - Path to app directory
   * @returns {Promise<Object>} Validation result
   */
  async validateApp(appPath) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check required files
    const requiredFiles = ['main.js', 'package.json'];
    for (const file of requiredFiles) {
      const filePath = path.join(appPath, file);
      try {
        await fs.access(filePath);
      } catch (error) {
        result.errors.push(`Missing required file: ${file}`);
        result.isValid = false;
      }
    }

    // Validate package.json
    try {
      const packageJsonPath = path.join(appPath, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);

      if (!packageJson.name) {
        result.errors.push('package.json missing required field: name');
        result.isValid = false;
      }

      if (!packageJson.type || packageJson.type !== 'module') {
        result.warnings.push('package.json should specify "type": "module"');
      }

      if (!packageJson.dependencies || !packageJson.dependencies['@lahat/runtime']) {
        result.warnings.push('App should depend on @lahat/runtime');
      }
    } catch (error) {
      // package.json validation already handled above
    }

    // Validate main.js
    try {
      const mainJsPath = path.join(appPath, 'main.js');
      const mainContent = await fs.readFile(mainJsPath, 'utf8');
      
      if (!mainContent.includes('LahatAPI')) {
        result.warnings.push('main.js should import and use LahatAPI');
      }
    } catch (error) {
      // main.js validation already handled above
    }

    return result;
  }

  /**
   * Validate a .lahat package file
   * @param {string} packagePath - Path to .lahat package
   * @returns {Promise<Object>} Validation result
   */
  async validatePackage(packagePath) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check file exists and is readable
      const stats = await fs.stat(packagePath);
      
      if (stats.size === 0) {
        result.errors.push('Package file is empty');
        result.isValid = false;
        return result;
      }

      if (stats.size > 100 * 1024 * 1024) { // 100MB
        result.warnings.push('Package file is very large (>100MB)');
      }

      // Basic ZIP format validation
      const buffer = await fs.readFile(packagePath);
      
      // Check ZIP signature
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        result.errors.push('Invalid package format (not a valid ZIP file)');
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push(`Cannot validate package: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate app configuration
   * @param {Object} config - App configuration
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!config.name) {
      result.errors.push('Configuration missing required field: name');
      result.isValid = false;
    }

    if (config.permissions && !Array.isArray(config.permissions)) {
      result.errors.push('Permissions must be an array');
      result.isValid = false;
    }

    if (config.mcpRequirements && !Array.isArray(config.mcpRequirements)) {
      result.errors.push('MCP requirements must be an array');
      result.isValid = false;
    }

    return result;
  }
}