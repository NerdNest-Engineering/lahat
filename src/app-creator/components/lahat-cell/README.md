# LahatCell Component

A self-contained web component for creating recursive cell structures. The LahatCell component is designed to be a fundamental building block for creating flexible, modular UIs with nested layouts.

## Core Design Principles

1. **Pure Container**: LahatCells are purely layout containers with no visual elements or UI controls
2. **Self-Contained**: Single file with no inheritance dependencies
3. **Recursive Nesting**: Cells can contain any number of other cells to any depth
4. **Slot-Based Structure**: Uses slots for declarative and intuitive composition
5. **Flexible Layouts**: Support for different layout patterns (flex row, flex column, grid)
6. **Event Bubbling**: Hierarchical event system for component communication

## Usage

### Basic Usage

```html
<lahat-cell>
  <div>Content goes here</div>
</lahat-cell>
```

### Nested Cells

```html
<lahat-cell layout="flex-column">
  <lahat-cell>
    <div>Header</div>
  </lahat-cell>
  <lahat-cell layout="flex-row">
    <lahat-cell>
      <div>Sidebar</div>
    </lahat-cell>
    <lahat-cell>
      <div>Main Content</div>
    </lahat-cell>
  </lahat-cell>
</lahat-cell>
```

### Layout Types

The LahatCell component supports three layout types:

1. **flex-column** (default): Children are arranged vertically
2. **flex-row**: Children are arranged horizontally
3. **grid**: Children are arranged in a grid

```html
<!-- Column layout (default) -->
<lahat-cell layout="flex-column">
  <!-- Child cells stack vertically -->
</lahat-cell>

<!-- Row layout -->
<lahat-cell layout="flex-row">
  <!-- Child cells arrange horizontally -->
</lahat-cell>

<!-- Grid layout -->
<lahat-cell layout="grid">
  <!-- Child cells arrange in a grid -->
</lahat-cell>
```

## JavaScript API

### Creating Cells Programmatically

```javascript
// Create a new cell
const cell = document.createElement('lahat-cell');

// Add content
cell.innerHTML = '<div>Cell content</div>';

// Set layout
cell.setLayout('flex-row', {
  gap: '10px',
  justifyContent: 'space-between'
});

// Add to a parent cell
const parentCell = document.getElementById('parent-cell');
parentCell.addCell(cell);
```

### Managing Child Cells

```javascript
// Add a cell
parentCell.addCell(childCell);

// Remove a cell by reference
parentCell.removeCell(childCell);

// Remove a cell by ID
parentCell.removeCell('child-cell-id');

// Get a child cell by ID
const child = parentCell.getCell('child-cell-id');

// Get all direct child cells
const children = parentCell.getCells();

// Clear all child cells
parentCell.clearCells();
```

### Setting Layouts

```javascript
// Set a flex row layout
cell.setLayout('flex-row');

// Set a flex column layout
cell.setLayout('flex-column');

// Set a grid layout with options
cell.setLayout('grid', {
  columns: 'repeat(3, 1fr)',
  rows: 'auto',
  gap: '10px'
});

// Set a flex layout with options
cell.setLayout('flex-row', {
  gap: '20px',
  justifyContent: 'center',
  alignItems: 'stretch'
});
```

### Event Handling

```javascript
// Listen for all cell events
cell.addEventListener('cell-event', (event) => {
  const { type, originalSource, data } = event.detail;
  console.log(`Event ${type} from ${originalSource.id}`, data);
});

// Listen for specific event types
cell.addEventListener('lahat-cell-layout-changed', (event) => {
  console.log('Layout changed:', event.detail.data);
});

// Subscribe to specific event types (with unsubscribe function)
const unsubscribe = cell.subscribe('user-action', (detail) => {
  console.log('User action:', detail.data);
});

// Publish an event
cell.publishEvent('user-action', {
  action: 'click',
  timestamp: Date.now()
});

// Later, unsubscribe
unsubscribe();
```

## Attributes

- **layout**: Sets the layout mode (`flex-row`, `flex-column`, `grid`)
- **grid-area**: For use within grid layouts to specify the grid area
- **id**: Standard HTML id attribute (auto-generated if not provided)

## Styling

While LahatCells are designed to be "invisible containers" focusing purely on layout without visual elements, they can be styled when needed:

```css
/* Style all cells */
lahat-cell {
  /* Minimal styling recommended to maintain "pure container" concept */
  padding: 5px;
}

/* Style specific cells */
#header-cell {
  height: 60px;
}

/* Style cells with a specific layout */
lahat-cell[layout="grid"] {
  gap: 15px;
}
```

You can also set styles programmatically:

```javascript
cell.setStyles({
  padding: '10px'
});
```

## Event System

The LahatCell component uses a hierarchical event system where events bubble up from child cells to parent cells. This allows for communication between cells at different levels of the hierarchy.

### Event Types

- **connected**: Cell was connected to DOM
- **disconnected**: Cell was disconnected from DOM
- **children-changed**: Child cells were added/removed
- **layout-changed**: Cell layout was changed
- **Custom events**: Any custom event published with `publishEvent()`

### Event Detail Structure

```javascript
{
  // The cell that originally emitted the event
  originalSource: HTMLElement,
  
  // The immediate source of the event (for bubbled events)
  immediateSource: HTMLElement,
  
  // Array of cells the event has bubbled through
  bubbledThrough: HTMLElement[],
  
  // The event type
  type: String,
  
  // Event-specific data
  data: Object
}
```

## Implementation Architecture

The LahatCell component is implemented as a self-contained web component that extends HTMLElement directly. It uses Shadow DOM for encapsulation and slots for content projection.

```
LahatCell
├── Shadow DOM
│   ├── <style> (internal styles)
│   ├── .lahat-cell (container)
│   │   └── .content (layout container with slot)
│   └── <slot> (for child cells and content)
└── Light DOM
    └── Child LahatCells (slotted content)
```

## Browser Compatibility

The LahatCell component uses standard Web Component APIs:
- Custom Elements v1
- Shadow DOM v1
- HTML Templates

This requires modern browsers with Web Component support:
- Chrome 67+
- Firefox 63+
- Safari 10.1+
- Edge 79+

## Examples

See `lahat-cell-test.html` for complete examples of:
- Basic cell usage
- Layout types
- Nested cells
- Event handling
