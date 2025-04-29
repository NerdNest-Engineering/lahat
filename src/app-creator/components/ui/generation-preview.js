/**
 * Generation Preview Component
 * Displays the generated code and generation progress
 */

/**
 * Generation Preview Component
 * Displays the generated code and generation progress
 */
export class GenerationPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          margin-top: 20px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: var(--border-radius, 8px);
          overflow: hidden;
        }
        
        .preview-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background-color: #f5f5f5;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
        
        .preview-title {
          font-weight: 600;
          font-size: 16px;
        }
        
        .preview-actions {
          display: flex;
          gap: 10px;
        }
        
        .preview-content {
          flex: 1;
          overflow: auto;
          padding: 15px;
          background-color: #f8f9fa;
          font-family: monospace;
          white-space: pre-wrap;
          line-height: 1.5;
          max-height: 400px;
        }
        
        .preview-content code {
          display: block;
        }
        
        .preview-footer {
          padding: 10px 15px;
          background-color: #f5f5f5;
          border-top: 1px solid var(--border-color, #e0e0e0);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .generation-status {
          font-size: 14px;
          color: #5f6368;
        }
        
        .generation-progress {
          height: 4px;
          background-color: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
          width: 100%;
          margin-top: 5px;
        }
        
        .generation-progress-bar {
          height: 100%;
          background-color: var(--primary-color, #4285f4);
          width: 0%;
          transition: width 0.3s ease;
        }
        
        .copy-button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--primary-color, #4285f4);
          font-size: 14px;
          padding: 5px 10px;
          border-radius: var(--border-radius, 8px);
        }
        
        .copy-button:hover {
          background-color: rgba(66, 133, 244, 0.1);
        }
        
        .success-message {
          color: var(--success-color, #34a853);
          font-size: 14px;
          margin-left: 10px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .success-message.visible {
          opacity: 1;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        :host(.visible) {
          display: block;
          animation: fadeIn 0.3s ease-out;
        }
        
        .code-block {
          margin-bottom: 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .code-header {
          background-color: #eee;
          padding: 8px 12px;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
        }
        
        .code-content {
          padding: 12px;
          background-color: #fff;
          overflow-x: auto;
        }
        
        .component-separator {
          margin: 20px 0;
          border-top: 1px dashed #ccc;
          position: relative;
        }
        
        .component-separator::before {
          content: "Next Component";
          position: absolute;
          top: -10px;
          left: 20px;
          background-color: #f8f9fa;
          padding: 0 10px;
          font-size: 12px;
          color: #666;
        }
      </style>
      
      <div class="preview-container">
        <div class="preview-header">
          <div class="preview-title">Generation Preview</div>
          <div class="preview-actions">
            <button class="copy-button">Copy Code</button>
            <span class="success-message">Copied!</span>
          </div>
        </div>
        
        <div class="preview-content"></div>
        
        <div class="preview-footer">
          <div class="generation-status">
            <div class="status-text">Generating...</div>
            <div class="generation-progress">
              <div class="generation-progress-bar"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Initialize properties
    this._content = '';
    this._status = 'idle';
    this._progress = 0;
    
    // Set up event listeners
    this.shadowRoot.querySelector('.copy-button').addEventListener('click', this._handleCopyClick.bind(this));
  }
  
  /**
   * Show the preview
   */
  show() {
    this.classList.add('visible');
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('preview-shown', {
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Hide the preview
   */
  hide() {
    this.classList.remove('visible');
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('preview-hidden', {
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Reset the preview
   */
  reset() {
    this._content = '';
    this._status = 'idle';
    this._progress = 0;
    
    // Update the UI
    this.shadowRoot.querySelector('.preview-content').innerHTML = '';
    this.shadowRoot.querySelector('.status-text').textContent = 'Generating...';
    this.shadowRoot.querySelector('.generation-progress-bar').style.width = '0%';
  }
  
  /**
   * Handle generation progress
   * @param {string} content - The new content to append
   * @param {number} progress - The generation progress (0-100)
   */
  handleGenerationProgress(content, progress = null) {
    // Append the new content
    this._content += content;
    
    // Update the progress if provided
    if (progress !== null) {
      this._progress = progress;
      this.shadowRoot.querySelector('.generation-progress-bar').style.width = `${progress}%`;
    }
    
    // Update the UI
    this._updatePreviewContent();
    
    // Update the status
    this._status = 'generating';
    this.shadowRoot.querySelector('.status-text').textContent = 'Generating...';
  }
  
  /**
   * Handle generation complete
   */
  handleGenerationComplete() {
    // Update the status
    this._status = 'complete';
    this.shadowRoot.querySelector('.status-text').textContent = 'Generation complete';
    this.shadowRoot.querySelector('.generation-progress-bar').style.width = '100%';
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('generation-complete', {
      bubbles: true,
      composed: true,
      detail: { content: this._content }
    }));
  }
  
  /**
   * Handle copy button click
   * @private
   */
  _handleCopyClick() {
    // Copy the content to the clipboard
    navigator.clipboard.writeText(this._content)
      .then(() => {
        // Show success message
        const successMessage = this.shadowRoot.querySelector('.success-message');
        successMessage.classList.add('visible');
        
        // Hide success message after 2 seconds
        setTimeout(() => {
          successMessage.classList.remove('visible');
        }, 2000);
      })
      .catch(error => {
        console.error('Failed to copy content:', error);
      });
  }
  
  /**
   * Update the preview content
   * @private
   */
  _updatePreviewContent() {
    const previewContent = this.shadowRoot.querySelector('.preview-content');
    
    // Format the content with syntax highlighting
    // This is a simple implementation - in a real app, you might use a library like highlight.js
    const formattedContent = this._formatContent(this._content);
    
    // Update the content
    previewContent.innerHTML = formattedContent;
    
    // Scroll to the bottom
    previewContent.scrollTop = previewContent.scrollHeight;
  }
  
  /**
   * Format the content with syntax highlighting
   * @param {string} content - The content to format
   * @returns {string} - The formatted content
   * @private
   */
  _formatContent(content) {
    // Split the content into components if it contains component separators
    if (content.includes('// COMPONENT:')) {
      const components = content.split('// COMPONENT:');
      
      // Format each component
      return components.map((component, index) => {
        if (index === 0 && component.trim() === '') {
          return '';
        }
        
        // Extract the component name from the first line
        const lines = component.split('\n');
        const componentName = index === 0 ? 'Main Component' : lines[0].trim();
        
        // Format the component content
        const componentContent = index === 0 ? component : lines.slice(1).join('\n');
        
        return `
          <div class="code-block">
            <div class="code-header">${componentName}</div>
            <div class="code-content">
              <code>${this._highlightSyntax(componentContent)}</code>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // If there are no component separators, just highlight the syntax
    return `<code>${this._highlightSyntax(content)}</code>`;
  }
  
  /**
   * Highlight syntax in the content
   * @param {string} content - The content to highlight
   * @returns {string} - The highlighted content
   * @private
   */
  _highlightSyntax(content) {
    // This is a simple implementation - in a real app, you might use a library like highlight.js
    // Replace < and > with their HTML entities to prevent HTML injection
    let highlighted = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Highlight keywords
    const keywords = [
      'class', 'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
      'import', 'export', 'from', 'extends', 'super', 'this', 'new', 'try', 'catch', 'finally',
      'async', 'await', 'static', 'get', 'set'
    ];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span style="color: #0033b3;">${keyword}</span>`);
    });
    
    // Highlight strings
    highlighted = highlighted
      .replace(/('.*?')/g, '<span style="color: #008000;">$1</span>')
      .replace(/(".*?")/g, '<span style="color: #008000;">$1</span>')
      .replace(/(`.*?`)/g, '<span style="color: #008000;">$1</span>');
    
    // Highlight comments
    highlighted = highlighted
      .replace(/(\/\/.*)/g, '<span style="color: #808080;">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #808080;">$1</span>');
    
    // Highlight numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color: #0000ff;">$1</span>');
    
    return highlighted;
  }
}
