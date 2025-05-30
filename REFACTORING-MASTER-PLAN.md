# Lahat Refactoring Master Plan v3.0
## MCP-Native Mini App Platform

Based on the refined vision of Lahat as an MCP-enabled mini app platform, here's the updated master plan focused on immediate deliverable value:

## Vision

Lahat transforms from a simple app generator into a **modular MCP-enabled application platform** where:

- **Mini apps are Node.js projects** with clean runtime isolation
- **MCP servers provide discoverable capabilities** to enhance app functionality  
- **Simple .lahat packaging** enables easy sharing and distribution
- **Scaffolding creates ready-to-code projects** for external IDE development
- **Modular architecture** supports future enhancements like Git-native workflows and P2P distribution

## Core Workflow (Current Focus)

### 1. App Scaffolding (Lahat's Role)
```bash
# User clicks "New App" in Lahat
→ Creates bare-bones Node.js project structure
→ Pre-configured with Lahat APIs and MCP integration
→ Opens in user's preferred IDE (VS Code, etc.)
```

### 2. Development (Claude Code/Cline's Role)
```bash
# Developer uses AI coding assistant
→ "Build a weather dashboard that uses MCP servers"
→ Claude Code builds actual functionality using Lahat APIs
→ Leverages MCP discovery and capability matching
→ Standard Node.js development workflow
```

### 3. Distribution (Back to Lahat)
```bash
# When ready to share
→ Export as .lahat file (Node.js project package)
→ Share via any medium (file, URL, etc.)
→ Others install with one-click
→ Apps run in isolated Lahat runtime environment
```

## Phase 1: Core Platform Foundation (Weeks 1-3)

### 1.1 Node.js Runtime Island
```
src/
├── runtime/
│   ├── LahatRuntime.js          # Node.js app execution environment
│   ├── api/
│   │   ├── @lahat/runtime/      # NPM package for mini apps
│   │   ├── LahatAPI.js          # Core platform APIs
│   │   └── StorageAPI.js        # Persistent storage
│   └── sandbox/
│       ├── NodeSandbox.js       # Secure Node.js execution
│       └── PermissionManager.js # Capability-based security
```

### 1.2 App Scaffolding Island
```
src/
├── scaffolding/
│   ├── ProjectGenerator.js      # Creates bare-bones Node.js projects
│   ├── templates/
│   │   ├── minimal/             # Basic Node.js setup
│   │   ├── ui-focused/          # UI-heavy template
│   │   └── mcp-enabled/         # MCP integration template
│   └── integration/
│       └── IDELauncher.js       # Open in user's preferred IDE
```

### 1.3 Development Runtime Island
```
src/
├── dev-runtime/
│   ├── HotReload.js            # Live updates during development
│   ├── DevAPI.js               # Development-specific APIs
│   ├── FileWatcher.js          # Watch file changes, trigger reloads
│   ├── MockMCP.js              # Mock MCP servers for testing
│   └── DevTools.js             # Debug mini apps
```

## Phase 2: MCP Integration Layer (Weeks 2-3)

### 2.1 MCP Host Registry Island
```
src/
├── mcp/
│   ├── MCPRegistry.js          # Server discovery & management
│   ├── ServerManager.js        # MCP server lifecycle
│   ├── CapabilityMatcher.js    # Match apps to server capabilities
│   ├── ServerProxy.js          # Proxy requests to MCP servers
│   └── protocols/
│       ├── StandardMCP.js      # Standard MCP protocol
│       └── LahatMCP.js         # Lahat-specific extensions
```

### 2.2 App Distribution Island
```
src/
├── distribution/
│   ├── LahatPackager.js        # Create .lahat packages (Node.js projects)
│   ├── AppInstaller.js         # Install apps from .lahat files
│   ├── ProjectManager.js       # Manage installed apps
│   └── UpdateManager.js        # Handle app updates
```

## Phase 3: Platform Maturity (Weeks 4-5)

### 3.1 Lahat-as-MCP-Server Island
```
src/
├── mcp-server/
│   ├── LahatMCPServer.js       # Expose Lahat as MCP server
│   ├── capabilities/
│   │   ├── AppLauncher.js      # Launch apps remotely
│   │   ├── AppInstaller.js     # Install .lahat files remotely
│   │   └── ProjectOperations.js # Project management capabilities
│   └── discovery/
│       └── ServiceAdvertiser.js # Advertise capabilities to network
```

### 3.2 UI Migration to DaisyUI Island
```
src/
├── ui/
│   ├── components/
│   │   ├── AppCard.js          # App display cards
│   │   ├── MCPServerList.js    # MCP server browser
│   │   ├── ProjectBrowser.js   # Local project management
│   │   └── StatusIndicator.js  # App and server status
│   └── layouts/
│       ├── AppBrowser.js       # Main app discovery interface
│       └── DevWorkspace.js     # Development environment
```

## Future Vision: Advanced Features

### Git-Native Distribution (Future)
```
src/
├── hypercore-git/              # P2P Git-based distribution
├── collaboration/              # Real-time collaborative editing
└── ecosystem/                  # Decentralized app discovery
```

*Note: Git-native workflows, P2P distribution via Hypercore, and real-time collaboration represent future enhancements that build on the solid MCP platform foundation.*

## Implementation Strategy

### Week 1: Core Runtime Foundation
- Implement basic Node.js runtime for mini apps
- Create project scaffolding (without Git)
- Set up hot reload for development workflow
- Create minimal base template

### Week 2: MCP Integration
- Implement MCP server registry and management
- Create MCP API for mini apps
- Build capability matching system
- Test MCP server integration

### Week 3: App Distribution
- Create simple .lahat packaging (Node.js projects only)
- Build app installation system
- Implement project management features
- Test app sharing workflow

### Week 4: Platform Services
- Expose Lahat capabilities as MCP server
- Implement remote app launching
- Create cross-instance communication
- Test network effects

### Week 5: UI/UX Polish
- Complete DaisyUI migration
- Optimize performance
- Create comprehensive documentation
- Prepare for user testing

### Future Phases: Advanced Features
- **Git-Native Workflows**: Full development history preservation
- **P2P Distribution**: Hypercore-based decentralized sharing
- **Real-time Collaboration**: Multi-user editing capabilities
- **Ecosystem Discovery**: Decentralized app marketplace

## Key Architectural Decisions

### 1. Mini App Structure (Current)
```javascript
// Every mini app is a Node.js project
my-app/
├── package.json             # Node.js dependencies
├── lahat.config.js         # Lahat platform config
├── main.js                 # App entry point
└── src/                    # App source code

// When exported as .lahat:
// - ZIP file contains Node.js project
// - Simple sharing and installation
// - Clean runtime isolation
```

### 2. Base Template Structure (Current)
```javascript
// Generated by Lahat when user clicks "New App"
my-mini-app/
├── package.json            # Basic Node.js setup
├── lahat.config.js         # Lahat integration config
├── main.js                 # Entry point (minimal)
├── README.md               # Development instructions
└── src/
    ├── index.html          # Basic UI scaffold
    ├── style.css           # Empty stylesheet
    └── app.js              # Empty main logic

// lahat.config.js
export default {
  name: "My Mini App",
  version: "1.0.0",
  permissions: [
    "lahat:storage",           # Access to persistent storage
    "lahat:mcp:*"             # Access to all MCP servers
  ],
  mcpRequirements: [
    "ai-text-generation",      # Requires AI capability
    "vector-database"          # Requires vector DB
  ],
  entrypoint: "./main.js"
};
```

### 3. Distribution Model (Current)
```javascript
const distributionFlow = {
  development: "Standard Node.js development",
  packaging: ".lahat file with Node.js project",
  sharing: "Traditional file sharing (file, URL, etc.)",
  installation: "Extract and run in Lahat runtime",
  updates: "Simple project replacement",
  capabilities: "MCP server integration for enhanced functionality"
};
```

### 4. Future Distribution Model (Git-Native)
```javascript
const futureDistributionFlow = {
  development: "Git for version control",
  packaging: ".lahat file with .git included",
  sharing: "Hypercore P2P + traditional file sharing",
  installation: "Extract with Git history intact", 
  forking: "Standard Git branching",
  collaboration: "Hypercore for real-time sync + Git for persistence"
};
```

## Testing Strategy

### Multi-Layer Testing Architecture

#### 1. Unit Testing Layer
```
tests/
├── unit/
│   ├── runtime/
│   │   ├── LahatRuntime.test.js     # Core runtime functionality
│   │   ├── GitManager.test.js       # Git operations
│   │   └── NodeSandbox.test.js      # Sandboxing security
│   ├── mcp/
│   │   ├── MCPRegistry.test.js      # MCP server management
│   │   ├── CapabilityMatcher.test.js # Capability matching logic
│   │   └── ServerProxy.test.js      # MCP proxy functionality
│   └── distribution/
│       ├── LahatPackager.test.js    # .lahat file creation
│       ├── AppInstaller.test.js     # App installation
│       └── ProjectManager.test.js   # Project management
```

#### 2. Integration Testing Layer
```
tests/
├── integration/
│   ├── standalone-runners/          # Each island as standalone Node app
│   │   ├── runtime-runner.js        # Test runtime in isolation
│   │   ├── mcp-runner.js           # Test MCP system standalone
│   │   └── distribution-runner.js   # Test packaging/installation
│   ├── workflows/
│   │   ├── app-lifecycle.test.js    # Create → Develop → Package → Install
│   │   ├── mcp-integration.test.js  # MCP server interactions
│   │   └── app-sharing.test.js      # App distribution workflows
│   └── api/
│       ├── lahat-api.test.js        # @lahat/runtime API testing
│       └── storage-api.test.js      # Persistent storage API
```

#### 3. End-to-End Testing Layer
```
tests/
├── e2e/
│   ├── full-platform/
│   │   ├── app-creation.test.js     # Complete app creation flow
│   │   ├── sharing-workflow.test.js # End-to-end sharing
│   │   └── mcp-integration.test.js  # Full MCP workflow testing
│   ├── ui/
│   │   ├── app-browser.test.js      # UI component testing
│   │   └── dev-workspace.test.js    # Development interface
│   └── performance/
│       ├── startup-time.test.js     # App creation performance
│       ├── mcp-latency.test.js      # MCP server response times
│       └── memory-usage.test.js     # Resource consumption
```

### Standalone Testing Infrastructure

#### Island Runners (For Independent Testing)
```javascript
// tests/integration/standalone-runners/runtime-runner.js
import { LahatRuntime } from '../../src/runtime/LahatRuntime.js';
import { createTestApp } from '../fixtures/test-apps.js';

export class RuntimeTestRunner {
  constructor() {
    this.runtime = new LahatRuntime({
      mode: 'test',
      sandboxed: true,
      mockMCP: true
    });
  }

  async testAppExecution() {
    const testApp = await createTestApp('minimal');
    const result = await this.runtime.executeApp(testApp);
    return result;
  }

  async testGitOperations() {
    const testRepo = await this.runtime.createTestRepo();
    const operations = ['commit', 'branch', 'merge'];
    
    for (const op of operations) {
      await this.runtime.gitManager.performOperation(op, testRepo);
    }
  }
}

// Run as standalone: node tests/integration/standalone-runners/runtime-runner.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new RuntimeTestRunner();
  await runner.runAllTests();
}
```

#### Test Configuration
```javascript
// tests/config/test-environments.js
export const testEnvironments = {
  unit: {
    mocks: ['filesystem', 'network', 'electron'],
    isolation: true,
    timeout: 5000
  },
  
  integration: {
    mocks: ['electron'], // Only mock Electron, use real FS/network
    isolation: false,
    timeout: 30000,
    standaloneMode: true // Can run each island independently
  },
  
  e2e: {
    mocks: [],
    isolation: false,
    timeout: 120000,
    realElectron: true,
    networkTesting: true
  }
};
```

### Test Fixtures and Mocks

#### Mock MCP Servers
```javascript
// tests/fixtures/mock-mcp-servers.js
export class MockMCPServer {
  constructor(capabilities) {
    this.capabilities = capabilities;
    this.requests = [];
  }

  async handleRequest(request) {
    this.requests.push(request);
    return this.generateMockResponse(request);
  }

  // Simulate different MCP server behaviors
  static createAIServer() {
    return new MockMCPServer(['text-generation', 'image-analysis']);
  }

  static createDatabaseServer() {
    return new MockMCPServer(['vector-search', 'document-storage']);
  }
}
```

#### Test App Fixtures
```javascript
// tests/fixtures/test-apps.js
export const testApps = {
  minimal: {
    name: 'Test Minimal App',
    files: {
      'main.js': 'console.log("Hello from test app");',
      'package.json': '{"name": "test-app", "version": "1.0.0"}',
      'lahat.config.js': 'export default { name: "Test App" };'
    }
  },
  
  mcpEnabled: {
    name: 'Test MCP App',
    mcpRequirements: ['ai-text-generation'],
    files: {
      'main.js': 'import { LahatAPI } from "@lahat/runtime"; ...',
      // ... more complex app structure
    }
  },
  
  collaborative: {
    name: 'Test P2P App',
    p2pEnabled: true,
    files: {
      // ... P2P-enabled app structure
    }
  }
};
```

### Testing Commands

#### Package.json Scripts
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "vitest run tests/unit/",
    "test:integration": "vitest run tests/integration/",
    "test:e2e": "playwright test tests/e2e/",
    
    "test:island:runtime": "node tests/integration/standalone-runners/runtime-runner.js",
    "test:island:mcp": "node tests/integration/standalone-runners/mcp-runner.js",
    "test:island:distribution": "node tests/integration/standalone-runners/distribution-runner.js",
    
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:performance": "vitest run tests/e2e/performance/",
    
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix"
  }
}
```

### Continuous Integration Testing

#### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        island: [runtime, mcp, distribution]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:island:${{ matrix.island }}

  e2e-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:e2e
```

### Test Development Workflow

#### Test-Driven Development for Islands
```bash
# Develop each island with TDD approach
1. Write failing unit tests for island functionality
2. Implement island to pass unit tests
3. Write integration tests for island as standalone
4. Test island independently: npm run test:island:runtime
5. Write integration tests with other islands
6. Write E2E tests for complete workflows
```

#### Test Data Management
```javascript
// tests/fixtures/test-data-manager.js
export class TestDataManager {
  static async setupTestEnvironment() {
    // Create isolated test directories
    // Set up mock MCP servers
    // Initialize test P2P network
    // Prepare test .lahat files
  }

  static async cleanupTestEnvironment() {
    // Remove test files
    // Shut down mock servers
    // Clean up P2P connections
  }
}
```

This comprehensive testing strategy ensures:
- **Each island can be tested independently** as a standalone Node.js application
- **Multiple testing layers** provide thorough coverage
- **Mock systems** allow testing without external dependencies
- **Real integration testing** validates actual workflows
- **Performance testing** ensures scalability
- **Cross-platform testing** guarantees compatibility

## Migration Strategy

### Backwards Compatibility
- Maintain support for existing .lahat files during transition
- Provide migration tools for current apps to new Git-based format
- Preserve existing user data and settings

### Gradual Rollout
- Islands can be developed and deployed independently
- Feature flags for new capabilities during development
- Progressive enhancement of existing features

### Risk Mitigation
- Comprehensive testing at each phase
- Rollback plans for each major change
- User communication and migration guides
- Beta testing with power users

## Success Metrics

### Technical Metrics
- App creation time (target: < 30 seconds for scaffold)
- Installation success rate (target: > 95%)
- P2P discovery performance (target: < 5 seconds)
- Collaboration sync latency (target: < 500ms)

### Ecosystem Metrics
- Number of active apps in network
- Fork rate (healthy forking indicates platform utility)
- Cross-pollination between forks
- MCP server adoption and usage

### User Experience Metrics
- Time from idea to running app (with AI assistance)
- Success rate of app sharing and installation
- User retention and engagement
- Developer satisfaction scores

This plan transforms Lahat into a **decentralized application platform** that leverages Git's proven collaboration model while adding P2P distribution and MCP integration. It creates a new paradigm for building, sharing, and collaborating on mini applications.