/**
 * Widget Security Manifest
 * Manages security hashes for widget JS files
 */

import fs from 'fs/promises';
import path from 'path';
import { generateScriptHash } from './cspUtils.js';

/**
 * Widget Security Manifest
 * Manages security hashes for widget JS files
 */
export class WidgetSecurityManifest {
  constructor(manifestPath) {
    this.manifestPath = manifestPath;
    this.manifest = null;
  }
  
  /**
   * Initialize the manifest
   */
  async initialize() {
    try {
      const data = await fs.readFile(this.manifestPath, 'utf8');
      this.manifest = JSON.parse(data);
    } catch (error) {
      // Create new manifest if it doesn't exist
      this.manifest = { widgets: {} };
      await this.save();
    }
  }
  
  /**
   * Save the manifest
   */
  async save() {
    const dir = path.dirname(this.manifestPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2), 'utf8');
  }
  
  /**
   * Add or update a widget hash
   * @param {string} widgetId - Widget ID
   * @param {string} filePath - Path to widget JS file
   * @returns {Promise<string>} - The generated hash
   */
  async addOrUpdateWidget(widgetId, filePath) {
    // Read the widget file
    const content = await fs.readFile(filePath, 'utf8');
    
    // Generate hash
    const hash = generateScriptHash(content);
    
    // Update manifest
    this.manifest.widgets[widgetId] = {
      filePath,
      hash,
      lastUpdated: new Date().toISOString()
    };
    
    // Save manifest
    await this.save();
    
    return hash;
  }
  
  /**
   * Verify a widget's integrity
   * @param {string} widgetId - Widget ID
   * @param {string} content - Widget JS content
   * @returns {boolean} - True if the widget is valid
   */
  verifyWidget(widgetId, content) {
    const widgetInfo = this.manifest.widgets[widgetId];
    if (!widgetInfo) {
      return false;
    }
    
    const hash = generateScriptHash(content);
    return hash === widgetInfo.hash;
  }
  
  /**
   * Get widget info
   * @param {string} widgetId - Widget ID
   * @returns {Object|null} - Widget info or null if not found
   */
  getWidgetInfo(widgetId) {
    return this.manifest.widgets[widgetId] || null;
  }
  
  /**
   * List all widgets
   * @returns {Object} - Object with widget IDs as keys and widget info as values
   */
  listWidgets() {
    return this.manifest.widgets;
  }
  
  /**
   * Remove a widget
   * @param {string} widgetId - Widget ID
   * @returns {Promise<boolean>} - True if the widget was removed
   */
  async removeWidget(widgetId) {
    if (!this.manifest.widgets[widgetId]) {
      return false;
    }
    
    delete this.manifest.widgets[widgetId];
    await this.save();
    return true;
  }
}

// Create and export a singleton instance
const securityManifest = new WidgetSecurityManifest(
  path.join(process.env.LAHAT_DATA_DIR || '.', 'security', 'widget-manifest.json')
);

export default securityManifest;
