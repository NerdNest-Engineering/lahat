/**
 * App Packager - Package mini apps into .lahat files
 * TODO: Implement full packaging functionality
 */

import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';

export class AppPackager {
  constructor(options = {}) {
    this.options = {
      outputDir: path.join(process.cwd(), 'packages'),
      compression: 'normal',
      includeMetadata: true,
      ...options
    };
  }

  /**
   * Package an app into a .lahat file
   * @param {string} appPath - Path to the app directory
   * @param {Object} options - Packaging options
   * @returns {Promise<string>} Path to the packaged .lahat file
   */
  async packageApp(appPath, options = {}) {
    const appName = path.basename(appPath);
    const outputName = options.outputName || appName;
    const packagePath = path.join(this.options.outputDir, `${outputName}.lahat`);

    // Ensure output directory exists
    await fs.mkdir(this.options.outputDir, { recursive: true });

    // Create ZIP archive
    const output = await fs.open(packagePath, 'w');
    const archive = archiver('zip', {
      zlib: { level: options.compression === 'fast' ? 1 : 6 }
    });

    archive.pipe(output.createWriteStream());

    // Add all files from the app directory
    archive.directory(appPath, false);

    // Add metadata if requested
    if (this.options.includeMetadata) {
      const metadata = await this._generateMetadata(appPath, options);
      archive.append(JSON.stringify(metadata, null, 2), { name: '.lahat-metadata.json' });
    }

    await archive.finalize();
    await output.close();

    return packagePath;
  }

  /**
   * Get package metadata
   * @param {string} packagePath - Path to .lahat package
   * @returns {Promise<Object>} Package metadata
   */
  async getPackageMetadata(packagePath) {
    // TODO: Extract metadata from package
    const stats = await fs.stat(packagePath);
    return {
      name: path.basename(packagePath, '.lahat'),
      size: stats.size,
      packagedAt: stats.birthtime.toISOString(),
      version: '1.0.0',
      author: 'Unknown',
      tags: [],
      license: 'MIT'
    };
  }

  /**
   * Generate package metadata
   * @param {string} appPath - App path
   * @param {Object} options - Packaging options
   * @returns {Promise<Object>} Metadata
   */
  async _generateMetadata(appPath, options) {
    const packageJsonPath = path.join(appPath, 'package.json');
    let packageJson = {};
    
    try {
      const content = await fs.readFile(packageJsonPath, 'utf8');
      packageJson = JSON.parse(content);
    } catch (error) {
      // Ignore if package.json doesn't exist
    }

    return {
      name: packageJson.name || path.basename(appPath),
      version: options.version || packageJson.version || '1.0.0',
      description: packageJson.description || '',
      author: options.author || packageJson.author || 'Unknown',
      license: options.license || packageJson.license || 'MIT',
      tags: options.tags || [],
      packagedAt: new Date().toISOString(),
      lahatVersion: '3.0.0'
    };
  }
}