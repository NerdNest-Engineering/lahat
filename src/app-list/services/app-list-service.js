/**
 * Service for managing the list of available apps
 */
import { filterAppsByQuery, sortApps, groupApps, getUniqueValues } from '../utils/app-filter.js';

export class AppListService {
  constructor() {
    this.apps = [];
  }
  
  /**
   * Load the list of available apps
   * @returns {Promise<Array>} A promise that resolves to the list of apps
   */
  async loadApps() {
    try {
      // In the future, this will use IPC to get apps from the main process
      // For now, we'll use mock data for testing
      this.apps = [
        {
          id: 'app1',
          title: 'Memory Canvas',
          description: 'Interactive canvas for memory exercises',
          created: new Date('2025-03-17T12:33:00'),
          version: '1',
          path: '/Users/felixflores/Library/Application Support/lahat/generated-apps/memory_canvas_1742229231328/index.html'
        },
        {
          id: 'app2',
          title: 'Elegant Action Button',
          description: 'Customizable action button component',
          created: new Date('2025-03-17T01:03:00'),
          version: '1',
          path: '/Users/felixflores/Library/Application Support/lahat/generated-apps/elegant_action_button_1742187814529/index.html'
        },
        {
          id: 'app3',
          title: 'Swift Scribe',
          description: 'Fast note-taking application',
          created: new Date('2025-03-16T08:01:00'),
          version: '1',
          path: '/Users/felixflores/Library/Application Support/lahat/generated-apps/swift_scribe_1742169675669/index.html'
        }
      ];
      
      return this.apps;
    } catch (error) {
      console.error('Error loading apps:', error);
      throw error;
    }
  }
  
  /**
   * Get the list of available apps
   * @returns {Array} The list of apps
   */
  getApps() {
    return this.apps;
  }
  
  /**
   * Filter the list of apps based on a search query
   * @param {string} query - The search query
   * @returns {Array} The filtered list of apps
   */
  filterApps(query) {
    return filterAppsByQuery(this.apps, query);
  }
  
  /**
   * Sort the list of apps
   * @param {string} sortBy - The property to sort by (default: 'lastModified')
   * @param {boolean} ascending - Whether to sort in ascending order (default: false)
   * @returns {Array} The sorted list of apps
   */
  sortApps(sortBy = 'lastModified', ascending = false) {
    return sortApps(this.apps, sortBy, ascending);
  }
  
  /**
   * Group apps by a specific property
   * @param {string} groupBy - The property to group by
   * @returns {Object} An object with groups as keys and arrays of apps as values
   */
  groupApps(groupBy) {
    return groupApps(this.apps, groupBy);
  }
  
  /**
   * Get a list of unique values for a specific property across all apps
   * @param {string} property - The property to get unique values for
   * @returns {Array} An array of unique values
   */
  getUniqueValues(property) {
    return getUniqueValues(this.apps, property);
  }
  
  /**
   * Get an app by its ID
   * @param {string} appId - The ID of the app to get
   * @returns {Object|null} The app with the specified ID, or null if not found
   */
  getAppById(appId) {
    return this.apps.find(app => app.id === appId) || null;
  }
}
