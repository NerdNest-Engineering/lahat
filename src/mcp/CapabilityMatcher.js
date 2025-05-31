/**
 * Capability Matcher - Match apps to server capabilities
 * Provides intelligent routing and capability resolution
 */

import { EventEmitter } from 'events';

// Capability categories for intelligent matching
export const CAPABILITY_CATEGORIES = {
  FILE_SYSTEM: ['file-read', 'file-write', 'file-list', 'file-watch', 'file-delete'],
  DATABASE: ['db-query', 'db-execute', 'db-list-tables', 'db-schema'],
  WEB: ['http-get', 'http-post', 'web-scrape', 'url-fetch'],
  AI_TEXT: ['text-generate', 'text-complete', 'text-summarize', 'text-translate'],
  AI_IMAGE: ['image-generate', 'image-analyze', 'image-edit'],
  STORAGE: ['storage-get', 'storage-set', 'storage-list', 'storage-delete'],
  SYSTEM: ['system-exec', 'system-notify', 'system-clipboard'],
  APPS: ['app-launch', 'app-list', 'app-message', 'app-install']
};

export class CapabilityMatcher extends EventEmitter {
  constructor(registry, options = {}) {
    super();
    
    this.registry = registry;
    this.options = {
      preferenceStrategy: 'performance', // 'performance', 'reliability', 'round-robin'
      cacheTimeout: 60000, // 1 minute
      ...options
    };
    
    this.capabilityCache = new Map();
    this.serverMetrics = new Map();
    this.routingRules = new Map();
    this.preferences = new Map();
    
    // Listen to registry events to invalidate cache
    if (this.registry) {
      this.registry.on('server:connected', () => this._clearAllCache());
      this.registry.on('server:disconnected', () => this._clearAllCache());
      this.registry.on('server:registered', () => this._clearAllCache());
      this.registry.on('server:unregistered', () => this._clearAllCache());
    }
  }

  /**
   * Find servers that can handle a capability
   * @param {string} capability - Capability name
   * @param {Object} requirements - Additional requirements
   * @returns {Promise<Array<Object>>} Matching servers with scores
   */
  async findServersForCapability(capability, requirements = {}) {
    try {
      // Check cache first
      const cacheKey = this._generateCacheKey(capability, requirements);
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Find all servers with the capability
      const candidateServers = await this._getCandidateServers(capability);
      
      if (candidateServers.length === 0) {
        return [];
      }

      // Score and rank servers
      const scoredServers = await this._scoreServers(candidateServers, capability, requirements);
      
      // Sort by score (highest first)
      const rankedServers = scoredServers.sort((a, b) => b.score - a.score);

      // Cache the result
      this._setCache(cacheKey, rankedServers);

      this.emit('capability:matched', {
        capability,
        requirements,
        serversFound: rankedServers.length,
        topServer: rankedServers[0]
      });

      return rankedServers;
    } catch (error) {
      this.emit('capability:match:failed', { capability, requirements, error: error.message });
      throw error;
    }
  }

  /**
   * Get the best server for a capability
   * @param {string} capability - Capability name
   * @param {Object} requirements - Additional requirements
   * @returns {Promise<Object|null>} Best matching server
   */
  async getBestServerForCapability(capability, requirements = {}) {
    const servers = await this.findServersForCapability(capability, requirements);
    return servers.length > 0 ? servers[0] : null;
  }

  /**
   * Check if a capability is available
   * @param {string} capability - Capability name
   * @param {Object} requirements - Additional requirements
   * @returns {Promise<boolean>} Whether capability is available
   */
  async isCapabilityAvailable(capability, requirements = {}) {
    const servers = await this.findServersForCapability(capability, requirements);
    return servers.length > 0;
  }

  /**
   * Set routing rule for a capability
   * @param {string} capability - Capability name
   * @param {Object} rule - Routing rule
   */
  setRoutingRule(capability, rule) {
    this.routingRules.set(capability, {
      ...rule,
      created: new Date().toISOString()
    });

    this._clearCapabilityCache(capability);
    this.emit('routing:rule:set', { capability, rule });
  }

  /**
   * Get routing rule for a capability
   * @param {string} capability - Capability name
   * @returns {Object|null} Routing rule
   */
  getRoutingRule(capability) {
    return this.routingRules.get(capability) || null;
  }

  /**
   * Set server preferences
   * @param {Object} preferences - Server preferences
   */
  setServerPreferences(preferences) {
    for (const [serverId, preference] of Object.entries(preferences)) {
      this.preferences.set(serverId, preference);
    }

    this._clearAllCache();
    this.emit('preferences:updated', { preferences });
  }

  /**
   * Get server preference
   * @param {string} serverId - Server ID
   * @returns {Object|null} Server preference
   */
  getServerPreference(serverId) {
    return this.preferences.get(serverId) || null;
  }

  /**
   * Find capabilities by category
   * @param {string} category - Category name (e.g., 'FILE_SYSTEM', 'AI_TEXT')
   * @param {Object} requirements - Additional requirements
   * @returns {Promise<Object>} Available capabilities by category
   */
  async findCapabilitiesByCategory(category, requirements = {}) {
    const categoryCapabilities = CAPABILITY_CATEGORIES[category] || [];
    const availableCapabilities = {};

    for (const capability of categoryCapabilities) {
      const servers = await this.findServersForCapability(capability, requirements);
      if (servers.length > 0) {
        availableCapabilities[capability] = {
          servers: servers.length,
          bestServer: servers[0],
          allServers: servers
        };
      }
    }

    return availableCapabilities;
  }

  /**
   * Get suggested capabilities based on current usage patterns
   * @param {string} appId - App ID for context
   * @returns {Promise<Array<Object>>} Suggested capabilities
   */
  async getSuggestedCapabilities(appId) {
    // This would analyze usage patterns and suggest related capabilities
    // For now, return common capability combinations
    const suggestions = [
      {
        category: 'FILE_SYSTEM',
        capabilities: ['file-read', 'file-write', 'file-list'],
        description: 'Complete file system access',
        useCase: 'File management and processing'
      },
      {
        category: 'AI_TEXT',
        capabilities: ['text-generate', 'text-summarize'],
        description: 'AI text processing',
        useCase: 'Content generation and analysis'
      },
      {
        category: 'WEB',
        capabilities: ['http-get', 'web-scrape'],
        description: 'Web data access',
        useCase: 'Fetching and processing web content'
      }
    ];

    // Filter based on available capabilities
    const availableSuggestions = [];
    for (const suggestion of suggestions) {
      const availableCapabilities = [];
      for (const capability of suggestion.capabilities) {
        const isAvailable = await this.isCapabilityAvailable(capability);
        if (isAvailable) {
          availableCapabilities.push(capability);
        }
      }
      
      if (availableCapabilities.length > 0) {
        availableSuggestions.push({
          ...suggestion,
          availableCapabilities,
          coverage: availableCapabilities.length / suggestion.capabilities.length
        });
      }
    }

    return availableSuggestions.sort((a, b) => b.coverage - a.coverage);
  }

  /**
   * Find servers by pattern matching
   * @param {string} pattern - Search pattern (supports wildcards)
   * @returns {Promise<Array<Object>>} Matching servers with capabilities
   */
  async findServersByPattern(pattern) {
    // Convert pattern to regex
    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
      'i'
    );

    const matchingServers = [];
    
    // This would query the registry for all servers
    // For now, return a mock implementation
    const allServers = []; // Would get from registry
    
    for (const server of allServers) {
      const matches = server.capabilities.filter(cap => regex.test(cap));
      if (matches.length > 0) {
        matchingServers.push({
          ...server,
          matchingCapabilities: matches,
          matchScore: matches.length / server.capabilities.length
        });
      }
    }

    return matchingServers.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Analyze capability compatibility between servers
   * @param {Array<string>} capabilities - Required capabilities
   * @returns {Promise<Object>} Compatibility analysis
   */
  async analyzeCapabilityCompatibility(capabilities) {
    const analysis = {
      totalCapabilities: capabilities.length,
      availableCapabilities: 0,
      missingCapabilities: [],
      serverDistribution: {},
      recommendations: []
    };

    for (const capability of capabilities) {
      const servers = await this.findServersForCapability(capability);
      
      if (servers.length > 0) {
        analysis.availableCapabilities++;
        analysis.serverDistribution[capability] = servers.map(s => s.server.name);
      } else {
        analysis.missingCapabilities.push(capability);
      }
    }

    // Generate recommendations
    if (analysis.missingCapabilities.length > 0) {
      analysis.recommendations.push({
        type: 'missing_capabilities',
        message: `${analysis.missingCapabilities.length} capabilities are not available`,
        capabilities: analysis.missingCapabilities
      });
    }

    const coverage = analysis.availableCapabilities / analysis.totalCapabilities;
    if (coverage < 0.8) {
      analysis.recommendations.push({
        type: 'low_coverage',
        message: `Only ${Math.round(coverage * 100)}% of capabilities are available`,
        suggestion: 'Consider installing additional MCP servers'
      });
    }

    return analysis;
  }

  /**
   * Update server metrics
   * @param {string} serverId - Server ID
   * @param {Object} metrics - Server metrics
   */
  updateServerMetrics(serverId, metrics) {
    const existing = this.serverMetrics.get(serverId) || {};
    
    this.serverMetrics.set(serverId, {
      ...existing,
      ...metrics,
      lastUpdated: new Date().toISOString()
    });

    this._clearAllCache();
    this.emit('metrics:updated', { serverId, metrics });
  }

  /**
   * Get server metrics
   * @param {string} serverId - Server ID
   * @returns {Object|null} Server metrics
   */
  getServerMetrics(serverId) {
    return this.serverMetrics.get(serverId) || null;
  }

  /**
   * Get capability statistics
   * @param {string} capability - Capability name
   * @returns {Promise<Object>} Capability statistics
   */
  async getCapabilityStats(capability) {
    const servers = await this.findServersForCapability(capability);
    
    const stats = {
      capability,
      totalServers: servers.length,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      distribution: {
        excellent: 0, // score >= 0.8
        good: 0,      // score >= 0.6
        fair: 0,      // score >= 0.4
        poor: 0       // score < 0.4
      }
    };

    if (servers.length > 0) {
      const scores = servers.map(s => s.score);
      stats.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      stats.highestScore = Math.max(...scores);
      stats.lowestScore = Math.min(...scores);

      // Calculate distribution
      for (const server of servers) {
        if (server.score >= 0.8) stats.distribution.excellent++;
        else if (server.score >= 0.6) stats.distribution.good++;
        else if (server.score >= 0.4) stats.distribution.fair++;
        else stats.distribution.poor++;
      }
    }

    return stats;
  }

  /**
   * Get all capability mappings
   * @returns {Promise<Object>} Capability mappings
   */
  async getAllCapabilityMappings() {
    // This would typically come from the registry
    // For now, return mock data
    return {
      'ai-text-generation': ['openai-server', 'anthropic-server', 'local-llm'],
      'vector-database': ['pinecone-server', 'weaviate-server', 'local-vector'],
      'web-search': ['serp-api-server', 'google-server'],
      'file-operations': ['lahat-filesystem'],
      'storage': ['lahat-storage'],
      'app-management': ['lahat-apps']
    };
  }

  /**
   * Get candidate servers for a capability
   * @param {string} capability - Capability name
   * @returns {Promise<Array<Object>>} Candidate servers
   */
  async _getCandidateServers(capability) {
    if (!this.registry) {
      return [];
    }

    // Use the registry to find servers with the capability
    const servers = this.registry.getServersByCapability(capability);
    
    // Convert registry server format to capability matcher format
    return servers.map(server => ({
      id: server.id,
      name: server.name,
      type: server.type,
      status: server.status,
      capabilities: server.capabilities,
      metadata: server.metadata,
      server: server // Include full server object for scoring
    }));
  }

  /**
   * Score servers based on various factors
   * @param {Array<Object>} servers - Candidate servers
   * @param {string} capability - Capability name
   * @param {Object} requirements - Additional requirements
   * @returns {Promise<Array<Object>>} Servers with scores
   */
  async _scoreServers(servers, capability, requirements) {
    const scoredServers = [];

    for (const server of servers) {
      const score = await this._calculateServerScore(server, capability, requirements);
      
      scoredServers.push({
        ...server,
        score,
        reasons: this._getScoreReasons(server, capability, requirements, score)
      });
    }

    return scoredServers;
  }

  /**
   * Calculate score for a server
   * @param {Object} server - Server object
   * @param {string} capability - Capability name
   * @param {Object} requirements - Additional requirements
   * @returns {Promise<number>} Score between 0 and 1
   */
  async _calculateServerScore(server, capability, requirements) {
    let score = 0;
    const factors = [];

    // Base score for availability
    if (server.status === 'running') {
      score += 0.3;
      factors.push('running');
    }

    // Server type preference
    if (server.type === 'builtin') {
      score += 0.2; // Built-in servers are more reliable
      factors.push('builtin');
    }

    // Performance metrics
    const metrics = this.serverMetrics.get(server.id);
    if (metrics) {
      // Response time factor (lower is better)
      if (metrics.averageResponseTime) {
        const responseScore = Math.max(0, 1 - (metrics.averageResponseTime / 5000)); // 5s baseline
        score += responseScore * 0.2;
        factors.push(`response-time:${responseScore.toFixed(2)}`);
      }

      // Success rate factor
      if (metrics.successRate) {
        score += metrics.successRate * 0.2;
        factors.push(`success-rate:${metrics.successRate}`);
      }

      // Load factor (lower is better)
      if (metrics.currentLoad) {
        const loadScore = Math.max(0, 1 - metrics.currentLoad);
        score += loadScore * 0.1;
        factors.push(`load:${loadScore.toFixed(2)}`);
      }
    } else {
      // No metrics available, use default scores
      score += 0.3; // Assume decent performance
      factors.push('default-metrics');
    }

    // User preference
    const preference = this.preferences.get(server.id);
    if (preference) {
      score += preference.weight * 0.1;
      factors.push(`preference:${preference.weight}`);
    }

    // Routing rule override
    const rule = this.routingRules.get(capability);
    if (rule && rule.serverPreferences) {
      const serverPref = rule.serverPreferences[server.id];
      if (serverPref) {
        score += serverPref.bonus || 0;
        factors.push(`routing-rule:${serverPref.bonus || 0}`);
      }
    }

    // Requirements matching
    if (requirements.minVersion && server.version) {
      const versionMatch = this._compareVersions(server.version, requirements.minVersion);
      if (versionMatch >= 0) {
        score += 0.1;
        factors.push('version-match');
      } else {
        score -= 0.2;
        factors.push('version-mismatch');
      }
    }

    // Cap score at 1.0
    score = Math.min(1.0, score);

    return score;
  }

  /**
   * Get reasons for server score
   * @param {Object} server - Server object
   * @param {string} capability - Capability name
   * @param {Object} requirements - Requirements
   * @param {number} score - Calculated score
   * @returns {Array<string>} Score reasons
   */
  _getScoreReasons(server, capability, requirements, score) {
    const reasons = [];

    if (server.status === 'running') {
      reasons.push('Server is currently running');
    }

    if (server.type === 'builtin') {
      reasons.push('Built-in server (higher reliability)');
    }

    const metrics = this.serverMetrics.get(server.id);
    if (metrics) {
      if (metrics.averageResponseTime < 1000) {
        reasons.push('Fast response time');
      }
      if (metrics.successRate > 0.95) {
        reasons.push('High success rate');
      }
      if (metrics.currentLoad < 0.5) {
        reasons.push('Low current load');
      }
    }

    const preference = this.preferences.get(server.id);
    if (preference && preference.weight > 0.5) {
      reasons.push('User preferred server');
    }

    // Add capability-specific reasons
    if (capability === 'ai-text-generation' && server.type === 'external') {
      reasons.push('Specialized AI server');
    }

    // Add requirements-specific reasons
    if (requirements.minVersion && server.version) {
      reasons.push('Version requirements met');
    }

    if (score >= 0.8) {
      reasons.push('Excellent overall match');
    } else if (score >= 0.6) {
      reasons.push('Good match');
    } else if (score >= 0.4) {
      reasons.push('Fair match');
    } else {
      reasons.push('Poor match - consider alternatives');
    }

    return reasons;
  }

  /**
   * Compare version strings
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {number} Comparison result (-1, 0, 1)
   */
  _compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  /**
   * Generate cache key
   * @param {string} capability - Capability name
   * @param {Object} requirements - Requirements
   * @returns {string} Cache key
   */
  _generateCacheKey(capability, requirements) {
    const reqString = JSON.stringify(requirements);
    return `${capability}:${reqString}`;
  }

  /**
   * Get from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  _getFromCache(key) {
    const entry = this.capabilityCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.options.cacheTimeout) {
      this.capabilityCache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  _setCache(key, value) {
    this.capabilityCache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for a capability
   * @param {string} capability - Capability name
   */
  _clearCapabilityCache(capability) {
    for (const [key] of this.capabilityCache) {
      if (key.startsWith(`${capability}:`)) {
        this.capabilityCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  _clearAllCache() {
    this.capabilityCache.clear();
  }
}