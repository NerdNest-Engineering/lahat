/**
 * App List Module
 * 
 * This module serves as the main entry point to the Lahat application.
 * It displays a list of available mini apps and provides navigation
 * controls to access other parts of the application.
 */

// Export components
export { AppListContainer } from './components/app-list-container.js';
export { AppCard } from './components/app-card.js';
export { NavigationControls } from './components/navigation-controls.js';

// Export services
export { AppListService } from './services/app-list-service.js';

// Main initialization
import './app-list.js';
