/**
 * Import Command Palette Component
 * Self-contained command palette for app import functionality
 */

export class ImportCommandPalette {
  constructor() {
    this.commands = [];
    this.element = null;
    this.inputElement = null;
    this.listElement = null;
    this.visible = false;
    this.activeIndex = 0;
    this.filterText = '';
    this.filteredCommands = [];
    
    this.initialize();
  }
  
  /**
   * Initialize the command palette
   */
  initialize() {
    // Create the command palette element
    this.element = document.createElement('div');
    this.element.className = 'import-command-palette hidden';
    
    // Add styles
    this.element.innerHTML = `
      <style>
        .import-command-palette {
          position: fixed;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          max-width: 90%;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          z-index: 2000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .import-command-palette.hidden {
          display: none;
        }
        
        .import-command-palette-input {
          padding: 12px 16px;
          font-size: 16px;
          border: none;
          border-bottom: 1px solid #e0e0e0;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }
        
        .import-command-palette-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .import-command-palette-item {
          padding: 10px 16px;
          cursor: pointer;
          transition: background-color 0.1s;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .import-command-palette-item:hover,
        .import-command-palette-item.active {
          background: #f8f9fa;
        }
        
        .import-command-palette-item .command-title {
          font-weight: 500;
          color: #202124;
        }
        
        .import-command-palette-item .command-description {
          font-size: 12px;
          color: #5f6368;
          margin-top: 2px;
        }
      </style>
      
      <div class="import-command-palette-content">
        <input class="import-command-palette-input" placeholder="Type to search import commands..." spellcheck="false" />
        <div class="import-command-palette-list"></div>
      </div>
    `;
    
    // Get references to elements
    this.inputElement = this.element.querySelector('.import-command-palette-input');
    this.listElement = this.element.querySelector('.import-command-palette-list');
    
    // Add the command palette to the document
    document.body.appendChild(this.element);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Register default import commands
    this.registerDefaultCommands();
  }
  
  /**
   * Register default import commands
   */
  registerDefaultCommands() {
    this.addCommand(
      'import-app', 
      'Import App', 
      'Import a .lahat or .zip app package',
      async () => {
        try {
          const result = await window.electronAPI.importMiniApp();
          if (result.success) {
            this.showNotification(`App "${result.name}" imported successfully!`, 'success');
            // Refresh app list if available
            if (window.loadMiniApps) {
              await window.loadMiniApps();
            }
            // Dispatch custom event for other components to listen
            window.dispatchEvent(new CustomEvent('app-imported', { 
              detail: { result } 
            }));
          } else {
            this.showNotification(result.error || 'Import failed', 'error');
          }
        } catch (error) {
          console.error('Error importing app:', error);
          this.showNotification('Failed to import app: ' + error.message, 'error');
        }
      }
    );
    
    this.addCommand(
      'import-from-url',
      'Import from URL',
      'Import an app package from a URL',
      async () => {
        const url = prompt('Enter the URL of the app package:');
        if (url) {
          try {
            // This would need to be implemented in the backend
            this.showNotification('URL import not yet implemented', 'info');
          } catch (error) {
            this.showNotification('Failed to import from URL: ' + error.message, 'error');
          }
        }
      }
    );
  }
  
  /**
   * Set up event listeners for the command palette
   */
  setupEventListeners() {
    // Input event listener
    this.inputElement.addEventListener('input', () => {
      this.filterText = this.inputElement.value.toLowerCase();
      this.filterCommands();
      this.renderCommands();
      this.activeIndex = 0;
      this.updateActiveItem();
    });
    
    // Keydown event listener
    this.inputElement.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.activeIndex = Math.min(this.activeIndex + 1, this.filteredCommands.length - 1);
          this.updateActiveItem();
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.activeIndex = Math.max(this.activeIndex - 1, 0);
          this.updateActiveItem();
          break;
        case 'Enter':
          event.preventDefault();
          this.executeCommand(this.activeIndex);
          break;
        case 'Escape':
          event.preventDefault();
          this.hide();
          break;
      }
    });
    
    // Click outside to close
    document.addEventListener('click', (event) => {
      if (this.visible && !this.element.contains(event.target)) {
        this.hide();
      }
    });
    
    // Global keyboard shortcut (Cmd/Ctrl + Shift + I for Import)
    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        this.toggle();
      }
    });
  }
  
  /**
   * Show the command palette
   */
  show() {
    this.visible = true;
    this.element.classList.remove('hidden');
    this.inputElement.value = '';
    this.filterText = '';
    this.filterCommands();
    this.renderCommands();
    this.activeIndex = 0;
    this.updateActiveItem();
    this.inputElement.focus();
  }
  
  /**
   * Hide the command palette
   */
  hide() {
    this.visible = false;
    this.element.classList.add('hidden');
  }
  
  /**
   * Toggle the command palette visibility
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Add a command to the palette
   * @param {string} id - Command ID
   * @param {string} label - Command label
   * @param {string} description - Command description
   * @param {Function} handler - Command handler function
   * @param {Function} [condition] - Optional condition function that returns true if the command should be shown
   */
  addCommand(id, label, description, handler, condition = () => true) {
    this.commands.push({
      id,
      label,
      description,
      handler,
      condition
    });
  }
  
  /**
   * Filter commands based on the input text and conditions
   */
  filterCommands() {
    this.filteredCommands = this.commands.filter(command => {
      // Check if the command should be shown based on its condition
      if (!command.condition()) {
        return false;
      }
      
      // If there's no filter text, show all commands
      if (!this.filterText) {
        return true;
      }
      
      // Check if the command label or description contains the filter text
      return command.label.toLowerCase().includes(this.filterText) ||
             command.description.toLowerCase().includes(this.filterText);
    });
  }
  
  /**
   * Render the filtered commands
   */
  renderCommands() {
    this.listElement.innerHTML = '';
    
    if (this.filteredCommands.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'import-command-palette-item';
      noResults.innerHTML = `
        <div class="command-title">No commands found</div>
        <div class="command-description">Try adjusting your search terms</div>
      `;
      this.listElement.appendChild(noResults);
      return;
    }
    
    this.filteredCommands.forEach((command, index) => {
      const item = document.createElement('div');
      item.className = 'import-command-palette-item';
      item.dataset.index = index;
      item.innerHTML = `
        <div class="command-title">${this.escapeHtml(command.label)}</div>
        <div class="command-description">${this.escapeHtml(command.description)}</div>
      `;
      
      item.addEventListener('click', () => {
        this.executeCommand(index);
      });
      
      item.addEventListener('mouseenter', () => {
        this.activeIndex = index;
        this.updateActiveItem();
      });
      
      this.listElement.appendChild(item);
    });
    
    // Update the active item
    this.updateActiveItem();
  }
  
  /**
   * Update the active item in the list
   */
  updateActiveItem() {
    // Remove active class from all items
    const items = this.listElement.querySelectorAll('.import-command-palette-item');
    items.forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to the active item
    if (items.length > 0 && this.activeIndex >= 0 && this.activeIndex < items.length) {
      items[this.activeIndex].classList.add('active');
      
      // Scroll to the active item if needed
      const activeItem = items[this.activeIndex];
      const listRect = this.listElement.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      
      if (itemRect.bottom > listRect.bottom) {
        this.listElement.scrollTop += itemRect.bottom - listRect.bottom;
      } else if (itemRect.top < listRect.top) {
        this.listElement.scrollTop -= listRect.top - itemRect.top;
      }
    }
  }
  
  /**
   * Execute a command
   * @param {number} index - Index of the command to execute
   */
  executeCommand(index) {
    if (index >= 0 && index < this.filteredCommands.length) {
      const command = this.filteredCommands[index];
      this.hide();
      command.handler();
    }
  }
  
  /**
   * Show a notification message
   * @param {string} message - Message to display
   * @param {string} type - Notification type (success, error, info)
   */
  showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      z-index: 3000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  
  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create a singleton instance for the import command palette
export const importCommandPalette = new ImportCommandPalette();
export default importCommandPalette;