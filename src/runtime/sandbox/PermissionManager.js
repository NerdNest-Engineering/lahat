/**
 * Permission Manager - Capability-based security for mini apps
 * Controls access to system resources and APIs
 */

export class PermissionManager {
  constructor() {
    this.availablePermissions = new Set([
      'lahat:storage',
      'lahat:mcp:*',
      'lahat:mcp:ai-text-generation',
      'lahat:mcp:vector-database',
      'lahat:mcp:web-search',
      'lahat:filesystem:read',
      'lahat:filesystem:write',
      'lahat:network:http',
      'lahat:network:websocket'
    ]);
    
    this.permissionGroups = {
      'lahat:mcp:*': [
        'lahat:mcp:ai-text-generation',
        'lahat:mcp:vector-database',
        'lahat:mcp:web-search'
      ]
    };
  }

  /**
   * Validate app permissions against available permissions
   * @param {Object} appConfig - App configuration with permissions
   * @returns {Promise<boolean>} Validation result
   */
  async validateAppPermissions(appConfig) {
    const requestedPermissions = appConfig.permissions || [];
    
    for (const permission of requestedPermissions) {
      if (!this._isPermissionValid(permission)) {
        throw new Error(`Invalid permission requested: ${permission}`);
      }
    }
    
    return true;
  }

  /**
   * Check if a permission is valid
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether permission is valid
   */
  _isPermissionValid(permission) {
    // Check direct permission
    if (this.availablePermissions.has(permission)) {
      return true;
    }
    
    // Check wildcard permissions
    for (const availablePermission of this.availablePermissions) {
      if (availablePermission.includes('*')) {
        const pattern = availablePermission.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(permission)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Expand wildcard permissions to specific permissions
   * @param {Array<string>} permissions - Permissions to expand
   * @returns {Array<string>} Expanded permissions
   */
  expandPermissions(permissions) {
    const expanded = new Set();
    
    for (const permission of permissions) {
      if (this.permissionGroups[permission]) {
        // Add all permissions in the group
        for (const groupPermission of this.permissionGroups[permission]) {
          expanded.add(groupPermission);
        }
      } else {
        expanded.add(permission);
      }
    }
    
    return Array.from(expanded);
  }

  /**
   * Check if app has specific permission
   * @param {Object} appContext - App execution context
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether app has permission
   */
  hasPermission(appContext, permission) {
    const appPermissions = appContext.permissions || [];
    const expandedPermissions = this.expandPermissions(appPermissions);
    
    return expandedPermissions.includes(permission) || 
           expandedPermissions.includes('lahat:*') ||
           expandedPermissions.some(p => {
             if (p.includes('*')) {
               const pattern = p.replace('*', '.*');
               const regex = new RegExp(`^${pattern}$`);
               return regex.test(permission);
             }
             return false;
           });
  }

  /**
   * Get all available permissions
   * @returns {Array<string>} Available permissions
   */
  getAvailablePermissions() {
    return Array.from(this.availablePermissions);
  }

  /**
   * Add new permission to available set
   * @param {string} permission - Permission to add
   */
  addPermission(permission) {
    this.availablePermissions.add(permission);
  }

  /**
   * Remove permission from available set
   * @param {string} permission - Permission to remove
   */
  removePermission(permission) {
    this.availablePermissions.delete(permission);
  }
}