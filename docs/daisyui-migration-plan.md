# Lahat UI Modernization: DaisyUI v5 Migration Plan

## Overview

This document outlines the comprehensive migration plan to transform Lahat from its current basic UI to a modern, sleek interface using DaisyUI v5 while maintaining future-proofing through a custom component wrapper system.

## Project Goals

- **Modernize UI**: Transform from basic styling to professional, modern interface
- **Future-Proof Architecture**: Create Lahat wrapper components to avoid vendor lock-in
- **System Integration**: Automatic theme matching with macOS/Windows/Linux system preferences
- **Maintain Functionality**: Preserve all existing features during migration
- **Performance**: Ensure no degradation in app performance

## Architecture Strategy

### Component Abstraction Layer
```
┌─────────────────────────────────────┐
│           Lahat Components          │  ← Our API (never changes)
│  <lahat-button>, <lahat-card>, etc. │
├─────────────────────────────────────┤
│           DaisyUI v5                │  ← Implementation (swappable)
│     Tailwind CSS 4 + Components     │
├─────────────────────────────────────┤
│          Browser/Electron           │
└─────────────────────────────────────┘
```

### Theme System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  System Theme   │───▶│ Lahat Theme      │───▶│   DaisyUI       │
│  (OS Preference)│    │ Controller       │    │   Themes        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ User Preference  │
                       │ (localStorage)   │
                       └──────────────────┘
```

## Phase Breakdown

### Phase 0: Foundation & Planning (Week 1)
**Goal**: Establish the foundation for the migration

#### 0.1 Design System Specification
- [ ] Define Lahat component API specifications
- [ ] Create component interface documentation
- [ ] Establish naming conventions and patterns
- [ ] Design theme system architecture

#### 0.2 Development Environment Setup
- [ ] Install Tailwind CSS 4
- [ ] Install DaisyUI v5
- [ ] Configure build system for CSS processing
- [ ] Set up development tooling

**Deliverables**:
- Component API specification document
- Development environment ready
- Build system configured

---

### Phase 1: Core Infrastructure (Week 2)
**Goal**: Build the Lahat Design System foundation

#### 1.1 Base Component System
Create the core wrapper components:

```javascript
// components/design-system/base/lahat-component.js
export class LahatComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  // Common functionality for all Lahat components
  applyTheme(theme) { /* ... */ }
  handleSystemThemeChange() { /* ... */ }
}
```

#### 1.2 Theme Controller Implementation
```javascript
// components/design-system/lahat-theme-controller.js
export class LahatThemeController extends LahatComponent {
  constructor() {
    super();
    this.systemTheme = this.detectSystemTheme();
    this.userTheme = localStorage.getItem('lahat-theme');
    this.setupSystemThemeListener();
  }
  
  detectSystemTheme() {
    // Electron nativeTheme integration
    // CSS prefers-color-scheme fallback
  }
}
```

#### 1.3 Core Components
- [ ] `<lahat-button>` - Button wrapper
- [ ] `<lahat-card>` - Card wrapper  
- [ ] `<lahat-input>` - Input wrapper
- [ ] `<lahat-modal>` - Modal wrapper
- [ ] `<lahat-navbar>` - Navigation wrapper

**DaisyUI v5 Integration Pattern**:
```javascript
// Example: lahat-button.js
export class LahatButton extends LahatComponent {
  render() {
    return `
      <button class="btn ${this.variant} ${this.size}">
        <slot></slot>
      </button>
    `;
  }
  
  get variant() {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost'
    };
    return variants[this.getAttribute('variant')] || 'btn-primary';
  }
}
```

**Deliverables**:
- Core Lahat component system
- Theme controller with system detection
- Basic wrapper components

---

### Phase 2: DaisyUI v5 Integration (Week 3)
**Goal**: Implement DaisyUI v5 as the backing system

#### 2.1 DaisyUI v5 Configuration
```css
/* styles/daisyui-config.css */
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark, cupcake, cyberpunk, synthwave;
  root: ":root";
  prefix: "lahat-";
  logs: false;
}
```

#### 2.2 System Theme Integration
```javascript
// Electron main process integration
const { nativeTheme } = require('electron');

nativeTheme.on('updated', () => {
  // Send theme change to renderer
  mainWindow.webContents.send('system-theme-changed', {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    themeSource: nativeTheme.themeSource
  });
});
```

#### 2.3 Component Implementation
Update each wrapper component to use DaisyUI v5 classes:

```javascript
// lahat-button.js - Updated with DaisyUI v5
export class LahatButton extends LahatComponent {
  static get observedAttributes() {
    return ['variant', 'size', 'loading', 'disabled'];
  }
  
  render() {
    const classes = [
      'lahat-btn', // Our prefix
      this.getVariantClass(),
      this.getSizeClass(),
      this.loading ? 'lahat-btn-loading' : '',
      this.disabled ? 'lahat-btn-disabled' : ''
    ].filter(Boolean).join(' ');
    
    return `
      <style>
        :host {
          display: inline-block;
        }
        .lahat-btn {
          @apply btn; /* DaisyUI v5 base class */
        }
        .lahat-btn-primary { @apply btn-primary; }
        .lahat-btn-secondary { @apply btn-secondary; }
        /* ... other variants */
      </style>
      <button class="${classes}" ?disabled="${this.disabled}">
        ${this.loading ? '<span class="loading loading-spinner"></span>' : ''}
        <slot></slot>
      </button>
    `;
  }
}
```

**Deliverables**:
- DaisyUI v5 fully integrated
- All wrapper components using DaisyUI classes
- System theme detection working

---

### Phase 3: UI Component Migration (Week 4-5)
**Goal**: Migrate existing UI to use Lahat components

#### 3.1 Header/Navigation Migration
**Before** (current):
```html
<div class="app-controls-header">
  <h2>Lahat <span class="tagalog-text">ᜎᜑᜆ᜔</span></h2>
  <div class="app-controls">
    <button id="api-settings-button" class="secondary">API Settings</button>
    <button id="create-app-button" class="primary">Create New App</button>
    <!-- ... -->
  </div>
</div>
```

**After** (with Lahat components):
```html
<lahat-navbar>
  <lahat-navbar-brand>
    <lahat-text variant="heading">Lahat <span class="tagalog-text">ᜎᜑᜆ᜔</span></lahat-text>
  </lahat-navbar-brand>
  
  <lahat-navbar-end>
    <lahat-search placeholder="Search apps..."></lahat-search>
    <lahat-theme-controller></lahat-theme-controller>
    
    <lahat-button-group>
      <lahat-button variant="ghost" id="api-settings-button">API Settings</lahat-button>
      <lahat-button variant="primary" id="create-app-button">Create New App</lahat-button>
      <lahat-button variant="secondary" id="import-app-button">Import App</lahat-button>
      <lahat-button variant="ghost" id="refresh-apps-button">Refresh</lahat-button>
      <lahat-button variant="ghost" id="open-app-directory-button">Open Directory</lahat-button>
    </lahat-button-group>
  </lahat-navbar-end>
</lahat-navbar>
```

#### 3.2 App Card Migration
**Before**:
```javascript
// In app-card.js
_getStyles() {
  return `
    .app-card {
      background: var(--light-gray);
      border-radius: var(--border-radius);
      padding: 15px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    /* ... */
  `;
}
```

**After**:
```javascript
// Updated app-card.js
_getTemplate() {
  return `
    <lahat-card hoverable clickable>
      <lahat-card-body>
        <lahat-card-title>${this.appData.name}</lahat-card-title>
        <lahat-text variant="description">${this.appData.description}</lahat-text>
        <lahat-card-actions>
          <lahat-button variant="primary" size="sm">Open</lahat-button>
          <lahat-button variant="ghost" size="sm">Delete</lahat-button>
        </lahat-card-actions>
      </lahat-card-body>
    </lahat-card>
  `;
}
```

#### 3.3 Modal System Migration
```javascript
// New lahat-modal.js
export class LahatModal extends LahatComponent {
  render() {
    return `
      <style>
        .lahat-modal { @apply modal; }
        .lahat-modal-box { @apply modal-box; }
        .lahat-modal-backdrop { @apply modal-backdrop; }
      </style>
      
      <div class="lahat-modal ${this.open ? 'modal-open' : ''}">
        <div class="lahat-modal-box">
          <lahat-modal-header>
            <slot name="header"></slot>
            <lahat-button variant="ghost" size="sm" class="modal-close">✕</lahat-button>
          </lahat-modal-header>
          
          <lahat-modal-body>
            <slot></slot>
          </lahat-modal-body>
          
          <lahat-modal-actions>
            <slot name="actions"></slot>
          </lahat-modal-actions>
        </div>
        <div class="lahat-modal-backdrop"></div>
      </div>
    `;
  }
}
```

**Deliverables**:
- All major UI components migrated
- Consistent design language throughout app
- Improved accessibility and interactions

---

### Phase 4: Advanced Features & Polish (Week 6)
**Goal**: Add advanced features and polish the experience

#### 4.1 Enhanced Theme System
```javascript
// Advanced theme controller with multiple themes
export class LahatThemeController extends LahatComponent {
  constructor() {
    super();
    this.availableThemes = [
      { name: 'light', label: 'Light', icon: '☀️' },
      { name: 'dark', label: 'Dark', icon: '🌙' },
      { name: 'cyberpunk', label: 'Cyberpunk', icon: '🤖' },
      { name: 'synthwave', label: 'Synthwave', icon: '🌆' },
      { name: 'cupcake', label: 'Cupcake', icon: '🧁' }
    ];
  }
  
  render() {
    return `
      <lahat-dropdown>
        <lahat-button variant="ghost" slot="trigger">
          <span class="theme-icon">${this.getCurrentThemeIcon()}</span>
          Theme
        </lahat-button>
        
        <lahat-dropdown-content>
          ${this.availableThemes.map(theme => `
            <lahat-dropdown-item 
              value="${theme.name}"
              ?selected="${this.currentTheme === theme.name}">
              ${theme.icon} ${theme.label}
            </lahat-dropdown-item>
          `).join('')}
        </lahat-dropdown-content>
      </lahat-dropdown>
    `;
  }
}
```

#### 4.2 Loading States & Micro-interactions
```javascript
// Enhanced loading states
export class LahatButton extends LahatComponent {
  async handleClick() {
    if (this.loading) return;
    
    this.loading = true;
    this.render();
    
    try {
      await this.action();
    } finally {
      this.loading = false;
      this.render();
    }
  }
  
  render() {
    return `
      <button class="lahat-btn ${this.getClasses()}" 
              ?disabled="${this.disabled || this.loading}">
        ${this.loading ? `
          <lahat-loading-spinner size="sm"></lahat-loading-spinner>
        ` : ''}
        <slot></slot>
      </button>
    `;
  }
}
```

#### 4.3 Accessibility Enhancements
- ARIA labels and descriptions
- Keyboard navigation
- Screen reader support
- High contrast mode support
- Reduced motion preferences

#### 4.4 Performance Optimizations
- Component lazy loading
- CSS-in-JS optimization
- Bundle size analysis
- Memory leak prevention

**Deliverables**:
- Advanced theme system with multiple options
- Smooth animations and micro-interactions
- Full accessibility compliance
- Performance optimizations

---

### Phase 5: Testing & Refinement (Week 7)
**Goal**: Ensure quality and stability

#### 5.1 Component Testing
```javascript
// Example test for lahat-button
describe('LahatButton', () => {
  it('should render with correct DaisyUI classes', () => {
    const button = document.createElement('lahat-button');
    button.setAttribute('variant', 'primary');
    document.body.appendChild(button);
    
    expect(button.shadowRoot.querySelector('button')).toHaveClass('btn-primary');
  });
  
  it('should handle loading state', async () => {
    const button = document.createElement('lahat-button');
    button.loading = true;
    
    expect(button.shadowRoot.querySelector('.loading')).toBeInTheDocument();
  });
});
```

#### 5.2 Integration Testing
- Theme switching functionality
- System theme detection
- Component interactions
- Electron integration

#### 5.3 Performance Testing
- Bundle size analysis
- Runtime performance
- Memory usage
- Startup time

**Deliverables**:
- Comprehensive test suite
- Performance benchmarks
- Bug fixes and optimizations

---

## Implementation Details

### DaisyUI v5 Specific Patterns

#### Configuration
```css
/* Recommended DaisyUI v5 setup */
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark, cupcake, cyberpunk, synthwave, retro, valentine, halloween, garden, forest, aqua, lofi, pastel, fantasy, wireframe, black, luxury, dracula, cmyk, autumn, business, acid, lemonade, night, coffee, winter, dim, nord, sunset;
  root: ":root";
  include: ; /* Include all components */
  exclude: ; /* Exclude none */
  prefix: "lahat-"; /* Prefix for our components */
  logs: false; /* Disable logs in production */
}
```

#### Theme Controller Pattern
```javascript
// DaisyUI v5 theme controller integration
export class LahatThemeController extends LahatComponent {
  applyTheme(themeName) {
    // DaisyUI v5 method
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Persist user choice
    localStorage.setItem('lahat-theme', themeName);
    
    // Emit theme change event
    this.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: themeName },
      bubbles: true
    }));
  }
  
  initializeTheme() {
    // Priority: User preference > System preference > Default
    const userTheme = localStorage.getItem('lahat-theme');
    const systemTheme = this.getSystemTheme();
    const defaultTheme = 'light';
    
    const theme = userTheme || systemTheme || defaultTheme;
    this.applyTheme(theme);
  }
  
  getSystemTheme() {
    // Electron integration
    if (window.electronAPI) {
      return window.electronAPI.getSystemTheme();
    }
    
    // Fallback to CSS media query
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
```

### Component API Specifications

#### LahatButton
```typescript
interface LahatButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'info' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  wide?: boolean;
  circle?: boolean;
  square?: boolean;
  outline?: boolean;
  glass?: boolean;
}
```

#### LahatCard
```typescript
interface LahatCardProps {
  variant?: 'normal' | 'compact' | 'side';
  bordered?: boolean;
  imageFull?: boolean;
  glass?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
}
```

#### LahatModal
```typescript
interface LahatModalProps {
  open?: boolean;
  backdrop?: boolean;
  responsive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

### System Integration

#### Electron Main Process
```javascript
// main.js - System theme integration
const { nativeTheme, ipcMain } = require('electron');

// Handle theme requests from renderer
ipcMain.handle('get-system-theme', () => {
  return {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    themeSource: nativeTheme.themeSource
  };
});

// Listen for system theme changes
nativeTheme.on('updated', () => {
  mainWindow.webContents.send('system-theme-changed', {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    themeSource: nativeTheme.themeSource
  });
});
```

#### Preload Script
```javascript
// preload.cjs - Expose theme API to renderer
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onSystemThemeChanged: (callback) => {
    ipcRenderer.on('system-theme-changed', callback);
  }
});
```

## Migration Strategy

### Gradual Migration Approach
1. **Parallel Development**: Build Lahat components alongside existing system
2. **Component-by-Component**: Migrate one component at a time
3. **Feature Flags**: Use flags to toggle between old and new components
4. **Rollback Plan**: Keep old components until migration is complete

### Risk Mitigation
- **Backup Strategy**: Git branches for each phase
- **Testing**: Comprehensive testing at each phase
- **User Feedback**: Alpha testing with early adopters
- **Performance Monitoring**: Track performance metrics throughout

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 0 | Week 1 | Foundation & Planning |
| Phase 1 | Week 2 | Core Infrastructure |
| Phase 2 | Week 3 | DaisyUI v5 Integration |
| Phase 3 | Week 4-5 | UI Component Migration |
| Phase 4 | Week 6 | Advanced Features |
| Phase 5 | Week 7 | Testing & Refinement |

**Total Duration**: 7 weeks

## Success Metrics

### User Experience
- [ ] Modern, professional appearance
- [ ] Smooth animations and interactions
- [ ] Consistent design language
- [ ] Automatic system theme matching
- [ ] Improved accessibility

### Technical
- [ ] Zero functionality regression
- [ ] Maintainable component architecture
- [ ] Future-proof design system
- [ ] Performance maintained or improved
- [ ] Comprehensive test coverage

### Business
- [ ] Increased user satisfaction
- [ ] Reduced maintenance overhead
- [ ] Faster feature development
- [ ] Better competitive positioning

## Next Steps

1. **Review and Approve Plan**: Stakeholder review of this migration plan
2. **Resource Allocation**: Assign development resources
3. **Environment Setup**: Prepare development environment
4. **Phase 0 Kickoff**: Begin foundation work

---

*This document will be updated as the migration progresses. Each phase will include detailed implementation notes and lessons learned.*
