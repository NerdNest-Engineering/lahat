/**
 * Command Palette Component
 * A VSCode-style command palette that appears when the user presses cmd+p
 */

export class CommandPalette {
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
    this.element.className = 'command-palette hidden';
    
    // Create the input element
    this.inputElement = document.createElement('input');
    this.inputElement.className = 'command-palette-input';
    this.inputElement.placeholder = 'Type a command...';
    this.inputElement.setAttribute('spellcheck', 'false');
    
    // Create the list element
    this.listElement = document.createElement('div');
    this.listElement.className = 'command-palette-list';
    
    // Add elements to the command palette
    this.element.appendChild(this.inputElement);
    this.element.appendChild(this.listElement);
    
    // Add the command palette to the document
    document.body.appendChild(this.element);
    
    // Set up event listeners
    this.setupEventListeners();
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
   * Add a command to the palette
   * @param {string} id - Command ID
   * @param {string} label - Command label
   * @param {Function} handler - Command handler function
   * @param {Function} [condition] - Optional condition function that returns true if the command should be shown
   */
  addCommand(id, label, handler, condition = () => true) {
    this.commands.push({
      id,
      label,
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
      
      // Check if the command label contains the filter text
      return command.label.toLowerCase().includes(this.filterText);
    });
  }
  
  /**
   * Render the filtered commands
   */
  renderCommands() {
    this.listElement.innerHTML = '';
    
    this.filteredCommands.forEach((command, index) => {
      const item = document.createElement('div');
      item.className = 'command-palette-item';
      item.textContent = command.label;
      item.dataset.index = index;
      
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
    const items = this.listElement.querySelectorAll('.command-palette-item');
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
}

// Create a singleton instance
const commandPalette = new CommandPalette();
export default commandPalette;
