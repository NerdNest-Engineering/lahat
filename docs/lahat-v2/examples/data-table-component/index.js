/**
 * Data Table Component
 * A self-contained web component that displays tabular data with sorting and filtering capabilities.
 * This component follows the Lahat v2 architecture where components are completely independent
 * and unaware of Lahat, with all assets inlined.
 */

export class DataTableComponent extends HTMLElement {
  /**
   * Create a new DataTableComponent instance
   */
  constructor() {
    super();
    
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Initialize state
    this._data = [];
    this._columns = [];
    this._sortColumn = null;
    this._sortDirection = 'asc';
    this._filter = '';
    this._selectedRows = new Set();
    
    // Render the component
    this.render();
  }
  
  /**
   * Define which attributes to observe
   */
  static get observedAttributes() {
    return ['columns', 'sortable', 'filterable', 'selectable'];
  }
  
  /**
   * Handle attribute changes
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'columns':
        try {
          this._columns = JSON.parse(newValue);
          this.render();
        } catch (error) {
          console.error('Invalid columns format:', error);
        }
        break;
      case 'sortable':
        this._sortable = newValue !== 'false';
        this.render();
        break;
      case 'filterable':
        this._filterable = newValue !== 'false';
        this.render();
        break;
      case 'selectable':
        this._selectable = newValue !== 'false';
        this.render();
        break;
    }
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Add event listeners
    this.setupEventListeners();
    
    // Emit connected event
    this.dispatchEvent(new CustomEvent('component-connected', {
      bubbles: true,
      composed: true,
      detail: { id: this.id }
    }));
  }
  
  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    // Remove event listeners
    this.removeEventListeners();
    
    // Emit disconnected event
    this.dispatchEvent(new CustomEvent('component-disconnected', {
      bubbles: true,
      composed: true,
      detail: { id: this.id }
    }));
  }
  
  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Get elements
    const filterInput = this.shadowRoot.querySelector('.filter-input');
    const tableHeaders = this.shadowRoot.querySelectorAll('th[data-sortable="true"]');
    const tableBody = this.shadowRoot.querySelector('tbody');
    
    // Add filter input listener
    if (filterInput) {
      filterInput.addEventListener('input', this.handleFilterInput.bind(this));
    }
    
    // Add sort header listeners
    if (tableHeaders) {
      tableHeaders.forEach(header => {
        header.addEventListener('click', this.handleSortClick.bind(this));
      });
    }
    
    // Add row selection listeners
    if (tableBody && this._selectable) {
      tableBody.addEventListener('click', this.handleRowClick.bind(this));
    }
  }
  
  /**
   * Remove event listeners
   * @private
   */
  removeEventListeners() {
    // Get elements
    const filterInput = this.shadowRoot.querySelector('.filter-input');
    const tableHeaders = this.shadowRoot.querySelectorAll('th[data-sortable="true"]');
    const tableBody = this.shadowRoot.querySelector('tbody');
    
    // Remove filter input listener
    if (filterInput) {
      filterInput.removeEventListener('input', this.handleFilterInput.bind(this));
    }
    
    // Remove sort header listeners
    if (tableHeaders) {
      tableHeaders.forEach(header => {
        header.removeEventListener('click', this.handleSortClick.bind(this));
      });
    }
    
    // Remove row selection listeners
    if (tableBody && this._selectable) {
      tableBody.removeEventListener('click', this.handleRowClick.bind(this));
    }
  }
  
  /**
   * Handle filter input
   * @param {Event} event - Input event
   * @private
   */
  handleFilterInput(event) {
    this._filter = event.target.value.toLowerCase();
    this.render();
    
    // Emit filter-changed event
    this.dispatchEvent(new CustomEvent('filter-changed', {
      bubbles: true,
      composed: true,
      detail: { filter: this._filter }
    }));
  }
  
  /**
   * Handle sort header click
   * @param {Event} event - Click event
   * @private
   */
  handleSortClick(event) {
    const column = event.target.dataset.column;
    
    // Toggle sort direction if same column
    if (this._sortColumn === column) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = column;
      this._sortDirection = 'asc';
    }
    
    this.render();
    
    // Emit sort-changed event
    this.dispatchEvent(new CustomEvent('sort-changed', {
      bubbles: true,
      composed: true,
      detail: {
        column: this._sortColumn,
        direction: this._sortDirection
      }
    }));
  }
  
  /**
   * Handle row click for selection
   * @param {Event} event - Click event
   * @private
   */
  handleRowClick(event) {
    if (!this._selectable) return;
    
    const row = event.target.closest('tr');
    if (!row) return;
    
    const rowId = row.dataset.id;
    if (!rowId) return;
    
    // Toggle selection
    if (this._selectedRows.has(rowId)) {
      this._selectedRows.delete(rowId);
      row.classList.remove('selected');
    } else {
      this._selectedRows.add(rowId);
      row.classList.add('selected');
    }
    
    // Emit selection-changed event
    this.dispatchEvent(new CustomEvent('selection-changed', {
      bubbles: true,
      composed: true,
      detail: {
        selectedIds: Array.from(this._selectedRows)
      }
    }));
  }
  
  /**
   * Set the data for the table
   * @param {Array} data - Array of data objects
   */
  setData(data) {
    this._data = Array.isArray(data) ? data : [];
    this._selectedRows.clear();
    this.render();
    
    // Emit data-updated event
    this.dispatchEvent(new CustomEvent('data-updated', {
      bubbles: true,
      composed: true,
      detail: {
        rows: this._data.length,
        timestamp: new Date().toISOString()
      }
    }));
  }
  
  /**
   * Set the columns for the table
   * @param {Array} columns - Array of column objects
   */
  setColumns(columns) {
    this._columns = Array.isArray(columns) ? columns : [];
    this.render();
  }
  
  /**
   * Get the filtered and sorted data
   * @returns {Array} - Filtered and sorted data
   * @private
   */
  getProcessedData() {
    // Filter data
    let processedData = this._data;
    
    if (this._filter) {
      processedData = processedData.filter(item => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(this._filter)
        );
      });
    }
    
    // Sort data
    if (this._sortColumn) {
      processedData = [...processedData].sort((a, b) => {
        const aValue = a[this._sortColumn];
        const bValue = b[this._sortColumn];
        
        // Handle different data types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return this._sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Default string comparison
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        
        if (this._sortDirection === 'asc') {
          return aString.localeCompare(bString);
        } else {
          return bString.localeCompare(aString);
        }
      });
    }
    
    return processedData;
  }
  
  /**
   * Render the component
   * @private
   */
  render() {
    // Get processed data
    const processedData = this.getProcessedData();
    
    // Create table HTML
    const tableHTML = `
      <div class="data-table-container">
        ${this._filterable ? `
          <div class="filter-container">
            <input type="text" class="filter-input" placeholder="Filter..." value="${this._filter}">
            <button class="clear-filter-button">
              <!-- Inline SVG for clear icon -->
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        ` : ''}
        
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                ${this._columns.map(column => `
                  <th 
                    data-column="${column.id}" 
                    data-sortable="${this._sortable && column.sortable !== false}"
                    class="${this._sortColumn === column.id ? 'sorted ' + this._sortDirection : ''}"
                  >
                    ${column.label || column.id}
                    ${this._sortable && column.sortable !== false ? `
                      <span class="sort-icon">
                        <!-- Inline SVG for sort icon -->
                        <svg width="12" height="12" viewBox="0 0 24 24">
                          <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                        </svg>
                      </span>
                    ` : ''}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${processedData.length > 0 ? processedData.map(row => `
                <tr data-id="${row.id}" class="${this._selectedRows.has(row.id) ? 'selected' : ''}">
                  ${this._columns.map(column => `
                    <td>${row[column.id] !== undefined ? row[column.id] : ''}</td>
                  `).join('')}
                </tr>
              `).join('') : `
                <tr class="empty-row">
                  <td colspan="${this._columns.length}">No data available</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        
        <div class="table-footer">
          <div class="row-count">${processedData.length} rows</div>
        </div>
      </div>
    `;
    
    // Define the CSS styles
    const styles = `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #333;
      }
      
      .data-table-container {
        display: flex;
        flex-direction: column;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .filter-container {
        display: flex;
        padding: 8px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .filter-input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .clear-filter-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        color: #999;
      }
      
      .clear-filter-button:hover {
        color: #333;
      }
      
      .table-wrapper {
        overflow-x: auto;
        max-height: 400px;
        overflow-y: auto;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: auto;
      }
      
      th, td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
      }
      
      th {
        background-color: #f9f9f9;
        font-weight: 600;
        user-select: none;
        position: sticky;
        top: 0;
        z-index: 1;
      }
      
      th[data-sortable="true"] {
        cursor: pointer;
      }
      
      th[data-sortable="true"]:hover {
        background-color: #eaeaea;
      }
      
      th.sorted {
        background-color: #e6f7ff;
      }
      
      .sort-icon {
        display: inline-block;
        vertical-align: middle;
        margin-left: 4px;
      }
      
      th.sorted.asc .sort-icon svg {
        transform: rotate(180deg);
      }
      
      tr:hover {
        background-color: #f5f5f5;
      }
      
      tr.selected {
        background-color: #e6f7ff;
      }
      
      tr.empty-row td {
        text-align: center;
        padding: 24px;
        color: #999;
      }
      
      .table-footer {
        display: flex;
        justify-content: space-between;
        padding: 8px 16px;
        background-color: #f9f9f9;
        border-top: 1px solid #e0e0e0;
      }
      
      .row-count {
        font-size: 14px;
        color: #666;
      }
      
      /* Responsive styles */
      @media (max-width: 600px) {
        th, td {
          padding: 8px;
        }
        
        .filter-container {
          padding: 8px;
        }
      }
    `;
    
    // Set the shadow DOM content
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${tableHTML}
    `;
    
    // Add event listeners
    this.setupEventListeners();
  }
}

// Register the component
customElements.define('data-table-component', DataTableComponent);
