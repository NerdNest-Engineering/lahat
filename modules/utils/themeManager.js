import { nativeTheme, ipcMain, BrowserWindow } from 'electron';
import store from '../../store.js';
import { ErrorHandler } from './errorHandler.js';

/**
 * Theme Manager - Handles theme detection, switching, and synchronization
 */
class ThemeManager {
  /**
   * Initialize the theme manager
   */
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the theme manager, set up listeners
   */
  initialize() {
    if (this.initialized) return;
    
    try {
      // Set up listener for system theme changes
      nativeTheme.on('updated', () => {
        this.handleSystemThemeChange();
      });
      
      this.initialized = true;
      console.log('Theme manager initialized');
    } catch (error) {
      ErrorHandler.logError('ThemeManager.initialize', error);
    }
  }

  /**
   * Handle system theme changes
   */
  handleSystemThemeChange() {
    try {
      const followSystemTheme = store.get('settings.followSystemTheme', true);
      
      if (followSystemTheme) {
        const systemTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        this.setTheme(systemTheme, false); // Set theme but don't change followSystemTheme setting
      }
    } catch (error) {
      ErrorHandler.logError('ThemeManager.handleSystemThemeChange', error);
    }
  }

  /**
   * Get the current theme
   * @returns {string} The current theme ('light' or 'dark')
   */
  getCurrentTheme() {
    try {
      const followSystemTheme = store.get('settings.followSystemTheme', true);
      
      if (followSystemTheme) {
        return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
      } else {
        return store.get('settings.theme', 'light');
      }
    } catch (error) {
      ErrorHandler.logError('ThemeManager.getCurrentTheme', error);
      return 'light'; // Default to light theme in case of error
    }
  }

  /**
   * Get the theme settings
   * @returns {Object} The theme settings
   */
  getThemeSettings() {
    try {
      return {
        theme: store.get('settings.theme', 'light'),
        followSystemTheme: store.get('settings.followSystemTheme', true)
      };
    } catch (error) {
      ErrorHandler.logError('ThemeManager.getThemeSettings', error);
      return { theme: 'light', followSystemTheme: true }; // Default settings in case of error
    }
  }

  /**
   * Set the theme
   * @param {string} theme - The theme to set ('light' or 'dark')
   * @param {boolean} updateSystemThemeSetting - Whether to update the followSystemTheme setting
   */
  setTheme(theme, updateSystemThemeSetting = true) {
    try {
      // Update store
      store.set('settings.theme', theme);
      
      if (updateSystemThemeSetting) {
        store.set('settings.followSystemTheme', false);
      }
      
      // Broadcast theme change to all windows
      this.broadcastThemeChange();
      
      console.log(`Theme set to ${theme}, followSystemTheme: ${store.get('settings.followSystemTheme')}`);
      
      // Apply to renderer processes immediately without waiting for restart
      this._applyThemeToRenderer();
    } catch (error) {
      ErrorHandler.logError('ThemeManager.setTheme', error);
    }
  }

  /**
   * Toggle system theme following
   * @param {boolean} follow - Whether to follow the system theme
   */
  setFollowSystemTheme(follow) {
    try {
      store.set('settings.followSystemTheme', follow);
      
      if (follow) {
        const systemTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        store.set('settings.theme', systemTheme);
      }
      
      // Broadcast theme change to all windows
      this.broadcastThemeChange();
      
      console.log(`Follow system theme set to ${follow}`);
    } catch (error) {
      ErrorHandler.logError('ThemeManager.setFollowSystemTheme', error);
    }
  }

  /**
   * Apply the theme to renderer processes
   * @private
   */
  _applyThemeToRenderer() {
    try {
      // For each window, inject CSS to apply the theme
      const windows = BrowserWindow.getAllWindows();
      
      const currentTheme = this.getCurrentTheme();
      
      windows.forEach(window => {
        // First, execute script to set data-theme attribute
        window.webContents.executeJavaScript(`
          document.documentElement.setAttribute('data-theme', '${currentTheme}');
          console.log(\`Theme applied via main process: ${currentTheme}\`);
        `).catch(err => {
          console.error('Error applying theme via executeJavaScript:', err);
        });
        
        // Then, send message for renderer to update UI controls
        window.webContents.send('theme-changed', {
          ...this.getThemeSettings(),
          currentTheme
        });
      });
    } catch (error) {
      ErrorHandler.logError('ThemeManager._applyThemeToRenderer', error);
    }
  }
  
  /**
   * Broadcast theme change to all windows
   */
  broadcastThemeChange() {
    try {
      this._applyThemeToRenderer();
    } catch (error) {
      ErrorHandler.logError('ThemeManager.broadcastThemeChange', error);
    }
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

export default themeManager;