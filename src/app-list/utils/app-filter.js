/**
 * Utility functions for filtering and sorting apps
 */

/**
 * Filter apps based on a search query
 * @param {Array} apps - The list of apps to filter
 * @param {string} query - The search query
 * @returns {Array} The filtered list of apps
 */
export function filterAppsByQuery(apps, query) {
  if (!query || query.trim() === '') {
    return apps;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  return apps.filter(app => 
    app.title.toLowerCase().includes(lowerQuery) || 
    app.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort apps by a specific property
 * @param {Array} apps - The list of apps to sort
 * @param {string} sortBy - The property to sort by (default: 'lastModified')
 * @param {boolean} ascending - Whether to sort in ascending order (default: false)
 * @returns {Array} The sorted list of apps
 */
export function sortApps(apps, sortBy = 'lastModified', ascending = false) {
  return [...apps].sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];
    
    // Handle dates
    if (valueA instanceof Date && valueB instanceof Date) {
      valueA = valueA.getTime();
      valueB = valueB.getTime();
    }
    
    // Handle strings
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return ascending 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    // Handle numbers and other types
    if (valueA < valueB) return ascending ? -1 : 1;
    if (valueA > valueB) return ascending ? 1 : -1;
    return 0;
  });
}

/**
 * Group apps by a specific property
 * @param {Array} apps - The list of apps to group
 * @param {string} groupBy - The property to group by
 * @returns {Object} An object with groups as keys and arrays of apps as values
 */
export function groupApps(apps, groupBy) {
  return apps.reduce((groups, app) => {
    const key = app[groupBy];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(app);
    return groups;
  }, {});
}

/**
 * Get a list of unique values for a specific property across all apps
 * @param {Array} apps - The list of apps
 * @param {string} property - The property to get unique values for
 * @returns {Array} An array of unique values
 */
export function getUniqueValues(apps, property) {
  const values = apps.map(app => app[property]);
  return [...new Set(values)];
}
