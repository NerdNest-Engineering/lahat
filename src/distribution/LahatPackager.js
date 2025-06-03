/**
 * Lahat Packager - Create .lahat packages (Node.js projects)
 * Handles packaging mini apps for distribution and sharing
 */

import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export class LahatPackager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      compression: 'gzip',
      compressionLevel: 6,
      includeNodeModules: false,
      includeDotFiles: false,
      excludePatterns: [
        'node_modules/**',
        '.git/**',
        '*.log',
        '.DS_Store',
        'Thumbs.db',
        '.env*',
        '*.tmp',
        '*.temp'
      ],
      ...options
    };
  }

  /**
   * Package a mini app into a .lahat file
   * @param {string} projectPath - Path to the project directory
   * @param {string} outputPath - Path for the output .lahat file
   * @param {Object} options - Packaging options
   * @returns {Promise<Object>} Package information
   */
  async packageApp(projectPath, outputPath, options = {}) {
    try {
      this.emit('packaging:started', { projectPath, outputPath });

      // Validate project
      await this._validateProject(projectPath);

      // Load project configuration
      const projectConfig = await this._loadProjectConfig(projectPath);

      // Create package manifest
      const manifest = await this._createManifest(projectPath, projectConfig, options);

      // Create the package
      const packageInfo = await this._createPackage(projectPath, outputPath, manifest, options);

      this.emit('packaging:completed', { projectPath, outputPath, packageInfo });

      return packageInfo;
    } catch (error) {
      this.emit('packaging:failed', { projectPath, outputPath, error: error.message });
      throw error;
    }
  }

  /**
   * Extract metadata from a .lahat package without extracting contents
   * @param {string} packagePath - Path to the .lahat file
   * @returns {Promise<Object>} Package metadata
   */
  async getPackageMetadata(packagePath) {
    try {
      // For now, return basic file information
      // In a real implementation, this would extract the manifest from the ZIP
      const stats = await fs.stat(packagePath);
      
      return {
        filePath: packagePath,
        fileName: path.basename(packagePath),
        fileSize: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        // These would come from the actual manifest in the ZIP
        name: path.basename(packagePath, '.lahat'),
        version: '1.0.0',
        description: 'Lahat mini app package'
      };
    } catch (error) {
      throw new Error(`Failed to read package metadata: ${error.message}`);
    }
  }

  /**
   * Validate package integrity
   * @param {string} packagePath - Path to the .lahat file
   * @returns {Promise<Object>} Validation result
   */
  async validatePackage(packagePath) {
    try {
      const stats = await fs.stat(packagePath);
      
      // Basic validation
      const validation = {
        valid: true,
        fileExists: true,
        fileSize: stats.size,
        issues: []
      };

      // Check file size (should not be empty or too large)
      if (stats.size === 0) {
        validation.valid = false;
        validation.issues.push('Package file is empty');
      }

      if (stats.size > 100 * 1024 * 1024) { // 100MB limit
        validation.valid = false;
        validation.issues.push('Package file is too large (>100MB)');
      }

      // Check file extension
      if (!packagePath.endsWith('.lahat')) {
        validation.issues.push('File does not have .lahat extension');
      }

      this.emit('package:validated', { packagePath, validation });

      return validation;
    } catch (error) {
      return {
        valid: false,
        fileExists: false,
        error: error.message,
        issues: ['Package file does not exist or is not accessible']
      };
    }
  }

  /**
   * Create package signature for verification
   * @param {string} packagePath - Path to the .lahat file
   * @param {string} privateKey - Private key for signing (optional)
   * @returns {Promise<string>} Package signature
   */
  async createPackageSignature(packagePath, privateKey = null) {
    try {
      const content = await fs.readFile(packagePath);
      
      if (privateKey) {
        // Create cryptographic signature
        const sign = crypto.createSign('SHA256');
        sign.update(content);
        return sign.sign(privateKey, 'base64');
      } else {
        // Create simple hash
        const hash = crypto.createHash('sha256');
        hash.update(content);
        return hash.digest('hex');
      }
    } catch (error) {
      throw new Error(`Failed to create package signature: ${error.message}`);
    }
  }

  /**
   * Verify package signature
   * @param {string} packagePath - Path to the .lahat file
   * @param {string} signature - Signature to verify
   * @param {string} publicKey - Public key for verification (optional)
   * @returns {Promise<boolean>} Whether signature is valid
   */
  async verifyPackageSignature(packagePath, signature, publicKey = null) {
    try {
      const content = await fs.readFile(packagePath);
      
      if (publicKey) {
        // Verify cryptographic signature
        const verify = crypto.createVerify('SHA256');
        verify.update(content);
        return verify.verify(publicKey, signature, 'base64');
      } else {
        // Verify simple hash
        const hash = crypto.createHash('sha256');
        hash.update(content);
        const expectedSignature = hash.digest('hex');
        return expectedSignature === signature;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get package statistics
   * @param {string} packagePath - Path to the .lahat file
   * @returns {Promise<Object>} Package statistics
   */
  async getPackageStats(packagePath) {
    try {
      const stats = await fs.stat(packagePath);
      const metadata = await this.getPackageMetadata(packagePath);
      
      return {
        ...metadata,
        fileSize: stats.size,
        fileSizeFormatted: this._formatFileSize(stats.size),
        created: stats.birthtime,
        modified: stats.mtime,
        signature: await this.createPackageSignature(packagePath)
      };
    } catch (error) {
      throw new Error(`Failed to get package statistics: ${error.message}`);
    }
  }

  /**
   * Validate project structure
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<void>}
   */
  async _validateProject(projectPath) {
    // Check if directory exists
    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error('Project path is not a directory');
      }
    } catch (error) {
      throw new Error(`Project directory does not exist: ${projectPath}`);
    }

    // Check for required files
    const requiredFiles = ['package.json', 'lahat.config.js'];
    
    for (const file of requiredFiles) {
      const filePath = path.join(projectPath, file);
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    // Validate package.json
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      if (!packageJson.name) {
        throw new Error('package.json must include a name field');
      }
      
      if (!packageJson.version) {
        throw new Error('package.json must include a version field');
      }
    } catch (error) {
      if (error.message.includes('must include')) {
        throw error;
      }
      throw new Error('Invalid package.json file');
    }

    // Validate lahat.config.js
    try {
      const configPath = path.join(projectPath, 'lahat.config.js');
      // For now, just check that it exists and is readable
      await fs.access(configPath);
    } catch (error) {
      throw new Error('Invalid lahat.config.js file');
    }
  }

  /**
   * Load project configuration
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Object>} Project configuration
   */
  async _loadProjectConfig(projectPath) {
    try {
      // Load package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      // Load lahat.config.js (simplified - in reality would need proper import)
      const configPath = path.join(projectPath, 'lahat.config.js');
      const configContent = await fs.readFile(configPath, 'utf8');
      
      // For now, return basic configuration
      // In a real implementation, this would properly parse the ES module
      return {
        packageJson,
        lahatConfig: {
          name: packageJson.name,
          version: packageJson.version,
          entrypoint: './main.js',
          permissions: ['lahat:storage'],
          mcpRequirements: []
        }
      };
    } catch (error) {
      throw new Error(`Failed to load project configuration: ${error.message}`);
    }
  }

  /**
   * Create package manifest
   * @param {string} projectPath - Path to the project directory
   * @param {Object} projectConfig - Project configuration
   * @param {Object} options - Packaging options
   * @returns {Promise<Object>} Package manifest
   */
  async _createManifest(projectPath, projectConfig, options) {
    const { packageJson, lahatConfig } = projectConfig;
    
    const manifest = {
      // Package metadata
      formatVersion: '1.0.0',
      packagedAt: new Date().toISOString(),
      packagedBy: 'Lahat Packager v3.0.0',
      
      // App information
      app: {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description || '',
        author: packageJson.author || '',
        keywords: packageJson.keywords || [],
        homepage: packageJson.homepage || '',
        repository: packageJson.repository || ''
      },
      
      // Lahat configuration
      lahat: {
        ...lahatConfig,
        platform: 'lahat',
        runtime: 'nodejs'
      },
      
      // Package contents
      contents: await this._scanProjectContents(projectPath),
      
      // Package options
      packaging: {
        compression: this.options.compression,
        includeNodeModules: this.options.includeNodeModules,
        excludePatterns: this.options.excludePatterns
      },
      
      // Checksums and security
      checksums: {},
      
      // Package signature (to be filled later)
      signature: null
    };

    return manifest;
  }

  /**
   * Scan project contents
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Array>} List of files to include
   */
  async _scanProjectContents(projectPath) {
    const contents = [];
    
    const scanDirectory = async (dirPath, relativePath = '') => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);
        
        // Check if file should be excluded
        if (this._shouldExcludeFile(relativeFilePath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath, relativeFilePath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          
          contents.push({
            path: relativeFilePath,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            type: 'file'
          });
        }
      }
    };
    
    await scanDirectory(projectPath);
    return contents;
  }

  /**
   * Create the actual package file
   * @param {string} projectPath - Path to the project directory
   * @param {string} outputPath - Path for the output .lahat file
   * @param {Object} manifest - Package manifest
   * @param {Object} options - Packaging options
   * @returns {Promise<Object>} Package information
   */
  async _createPackage(projectPath, outputPath, manifest, options) {
    return new Promise((resolve, reject) => {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      fs.mkdir(outputDir, { recursive: true }).then(() => {
        
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
          zlib: { level: this.options.compressionLevel }
        });

        let filesAdded = 0;
        let totalSize = 0;

        // Handle archive events
        archive.on('entry', (entry) => {
          if (entry.type === 'file') {
            filesAdded++;
            totalSize += entry.stats.size;
            this.emit('packaging:progress', {
              filesAdded,
              currentFile: entry.name,
              fileSize: entry.stats.size
            });
          }
        });

        archive.on('error', (err) => {
          reject(new Error(`Archive creation failed: ${err.message}`));
        });

        output.on('close', () => {
          const packageInfo = {
            filePath: outputPath,
            fileName: path.basename(outputPath),
            fileSize: archive.pointer(),
            filesIncluded: filesAdded,
            uncompressedSize: totalSize,
            compressionRatio: totalSize > 0 ? (archive.pointer() / totalSize) : 0,
            manifest,
            created: new Date().toISOString()
          };

          resolve(packageInfo);
        });

        output.on('error', (err) => {
          reject(new Error(`Output stream error: ${err.message}`));
        });

        // Pipe archive data to the file
        archive.pipe(output);

        // Add manifest file
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

        // Add project files
        this._addProjectFiles(archive, projectPath).then(() => {
          // Finalize the archive
          archive.finalize();
        }).catch(reject);

      }).catch(reject);
    });
  }

  /**
   * Add project files to archive
   * @param {Object} archive - Archiver instance
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<void>}
   */
  async _addProjectFiles(archive, projectPath) {
    const addDirectory = async (dirPath, archivePath = '') => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const archiveFilePath = archivePath ? path.join(archivePath, entry.name) : entry.name;
        
        // Check if file should be excluded
        if (this._shouldExcludeFile(archiveFilePath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          await addDirectory(fullPath, archiveFilePath);
        } else if (entry.isFile()) {
          archive.file(fullPath, { name: archiveFilePath });
        }
      }
    };
    
    await addDirectory(projectPath);
  }

  /**
   * Check if file should be excluded
   * @param {string} filePath - File path to check
   * @returns {boolean} Whether file should be excluded
   */
  _shouldExcludeFile(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Check exclude patterns
    for (const pattern of this.options.excludePatterns) {
      const regex = this._globToRegex(pattern);
      if (regex.test(normalizedPath)) {
        return true;
      }
    }
    
    // Check dot files
    if (!this.options.includeDotFiles && path.basename(filePath).startsWith('.')) {
      return true;
    }
    
    return false;
  }

  /**
   * Convert glob pattern to regex
   * @param {string} pattern - Glob pattern
   * @returns {RegExp} Regular expression
   */
  _globToRegex(pattern) {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      .replace(/\./g, '\\.');
    
    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  _formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}