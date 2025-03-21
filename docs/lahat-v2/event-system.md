# Event System

## Overview

The Event System in Lahat v2 is a module-specific component that enables communication between components within a single module's renderer process. Each module has its own independent EventBus implementation with no shared code between modules. This approach reduces cognitive load and allows modules to evolve independently.

The Event System implements a publish-subscribe pattern where components can publish events and subscribe to events from other components within the same module. This system is specifically for client-side communication within a module, not for inter-module communication.

> **Note**: For communication between modules or between the main process and renderer processes, Lahat v2 uses Electron's contextBridge for IPC (Inter-Process Communication).

## Key Components

### EventBus

The EventBus is the central communication mechanism that routes events between components. It provides:

- Event registration and deregistration
- Event publishing
- Event subscription
- Event filtering

```
┌─────────────────────────────────────────────┐
│                 EventBus                    │
│                                             │
│  ┌─────────────┐      ┌─────────────────┐   │
│  │ Publishers  │◄────►│   Subscribers   │   │
│  └─────────────┘      └─────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │             Event Registry              ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │             Event Router                ││
│  └─────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

### CustomEvent Proxy

The CustomEvent Proxy is a component that acts as an intermediary between a web component and the EventBus. It:

- Translates events from the web component to the EventBus format
- Filters events based on security policies
- Provides a consistent interface for event communication

```
┌─────────────────────────────────────────────┐
│            CustomEvent Proxy                │
│                                             │
│  ┌─────────────┐      ┌─────────────────┐   │
│  │ WebComponent│◄────►│    EventBus     │   │
│  └─────────────┘      └─────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │             Event Filter                ││
│  └─────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

## Event Flow

The event flow in the Lahat v2 architecture follows these steps:

1. A component publishes an event to the EventBus
2. The EventBus routes the event to all subscribers
3. CustomEvent proxies filter events based on security policies
4. Subscribers receive and process the events

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │
│ Component │────►│ EventBus  │────►│ Component │
│ (Source)  │     │           │     │ (Target)  │
│           │     │           │     │           │
└───────────┘     └───────────┘     └───────────┘
```

## Event Types

The Lahat v2 architecture defines several types of events:

### System Events

System events are used for communication between the core modules of the application:

- `app-selected`: When a user selects an app from the App List
- `app-loaded`: When an app is successfully loaded in the App Manager
- `app-created`: When a new app is created by the App Creator
- `widget-added`: When a widget is added to an app
- `widget-removed`: When a widget is removed from an app

### Component Events

Component events are used for communication between web components:

- `data-changed`: When a component's data changes
- `action-performed`: When a component performs an action
- `state-changed`: When a component's state changes

### User Events

User events are triggered by user interactions:

- `click`: When a user clicks on a component
- `input`: When a user inputs data into a component
- `submit`: When a user submits a form

## Implementation Details

### Directory Structure

Each module has its own implementation of the event system:

```
src/
├── app-list/
│   └── event-system/
│       ├── event-bus.js
│       ├── custom-event-proxy.js
│       ├── event-registry.js
│       └── event-router.js
├── app-creator/
│   └── event-system/
│       ├── event-bus.js
│       ├── custom-event-proxy.js
│       ├── event-registry.js
│       └── event-router.js
└── app-manager/
    └── event-system/
        ├── event-bus.js
        ├── custom-event-proxy.js
        ├── event-registry.js
        └── event-router.js
```

### Key Classes

- **EventBus**: Central communication mechanism
- **CustomEventProxy**: Handles event proxying between components
- **EventRegistry**: Manages event registrations
- **EventRouter**: Routes events between components
- **EventUtils**: Utility functions for working with events

## Security Considerations

The Event System implements several security measures:

- **Event Filtering**: Events are filtered based on security policies
- **Event Validation**: Events are validated before being processed
- **Event Isolation**: Events are isolated to their respective components
- **Event Logging**: Events are logged for auditing purposes

## Migration from v1

Each module will implement its own event system based on the functionality in `v1/components/core/event-bus.js`. The migration involves:

1. Creating module-specific implementations of the event system
2. Enhancing the event routing capabilities
3. Adding security features
4. Implementing event filtering and validation
