import { BaseComponent } from '../../core/base-component.js';
import '../cards/app-card.js';

/**
 * AppList component
 * Displays a list of app cards and handles the "no apps" message
 */
export class AppList extends BaseComponent {
  constructor() {
    super();
    
    const styles = `
      :host {
        display: block;
        margin: 20px 0;
      }
      
      .no-apps-message {
        background: #f8f9fa;
        border-radius: var(--border-radius, 8px);
        padding: 20px;
        text-align: center;
        color: #5f6368;
      }
      
      .no-apps-message.hidden {
        display: none;
      }
      
      .app-list-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
    `;
    
    const html = `
      <div class="no-apps-message">
        <p>You don't have any mini apps yet.</p>
        <p>Click the "Create App" button to get started!</p>
      </div>
      <div class="app-list-container"></div>
    `;
    
    this.render(html, styles);
    
    // Store references to DOM elements
    this._noAppsMessage = this.shadowRoot.querySelector('.no-apps-message');
    this._appListContainer = this.shadowRoot.querySelector('.app-list-container');
  }
  
  /**
   * Set the list of apps to display
   * @param {Array} apps - Array of app objects
   */
  setApps(apps) {
    // Clear the app list
    this._appListContainer.innerHTML = '';
    
    if (apps && apps.length > 0) {
      // Hide the "no apps" message
      this._noAppsMessage.classList.add('hidden');
      
      // Create app cards
      apps.forEach(app => {
        const appCard = document.createElement('app-card');
        appCard.setAppData(app);
        this._appListContainer.appendChild(appCard);
      });
    } else {
      // Show the "no apps" message
      this._noAppsMessage.classList.remove('hidden');
    }
  }
}

// Register the custom element
customElements.define('app-list', AppList);
