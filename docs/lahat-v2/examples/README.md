# Lahat v2 Examples

This directory contains example implementations that demonstrate the App Manager's display capabilities and the component architecture in Lahat v2.

## Directory Structure

```
examples/
├── data-table-component/       # Example component implementation
│   ├── index.js                # Self-contained component code
│   └── meta.json               # Component metadata
├── customer-dashboard/         # Example app configuration
│   └── app.yaml                # App configuration in YAML format
└── README.md                   # This file
```

## Data Table Component

The `data-table-component` is an example of a self-contained web component following the Lahat v2 architecture:

- **Completely independent** and unaware of Lahat
- **All styles included** in the Shadow DOM
- **SVG images inlined** directly in the code
- **No external dependencies**
- **Emits standard DOM events** with `bubbles: true` and `composed: true`

### Component Structure

The component consists of two files:

1. **index.js**: The self-contained component code
   - Implements a data table with sorting, filtering, and row selection
   - Uses Shadow DOM for style encapsulation
   - Emits events for data updates, filtering, sorting, and selection

2. **meta.json**: The component metadata
   - Describes the component's capabilities
   - Lists all events the component can emit
   - Documents the component's attributes and methods

### Key Features

- **Self-contained**: All functionality is contained within a single JS file
- **Shadow DOM**: Uses Shadow DOM for style encapsulation
- **Event-based communication**: Communicates through standard DOM events
- **Responsive design**: Adapts to different screen sizes
- **Metadata-driven**: Capabilities are defined in metadata

## Customer Dashboard App

The `customer-dashboard` is an example of an app configuration that uses multiple components, including the data-table-component:

### App Configuration

The app is defined in a YAML file (`app.yaml`) that specifies:

- **App metadata**: Name, version, description, etc.
- **Layout configuration**: Grid layout with responsive breakpoints
- **Component cells**: Configuration for each component in the app
- **Event connections**: How events flow between components
- **Theme configuration**: Visual styling for the app
- **App settings**: General settings for the app

### Key Features

- **Responsive layout**: Automatically adjusts based on screen size
- **Component composition**: Combines multiple components into a cohesive app
- **Event-based communication**: Components communicate through events
- **Declarative configuration**: App structure defined in YAML
- **Theme customization**: Consistent visual styling across components

## How to Use These Examples

These examples demonstrate how the App Manager displays apps to users and how components are structured in Lahat v2. They can be used as:

1. **Reference implementations** for creating new components
2. **Templates** for configuring new apps
3. **Documentation** for understanding the architecture

The examples show how the App Manager:

- Loads components from their folders
- Uses metadata to configure event interception
- Creates a responsive layout based on the app configuration
- Sets up event connections between components
- Applies theme settings to the app

## Implementation Notes

- Components are stored in their own folders with an `index.js` file and a `meta.json` file
- Apps are stored in their own folders with an `app.yaml` file
- All components are loaded from the same origin, eliminating CORS issues
- Components use Shadow DOM for style encapsulation
- Event communication is handled through standard DOM events
- The App Manager uses a responsive grid layout system
