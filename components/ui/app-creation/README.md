# App Creation Components

This directory contains the modular web components for the app creation flow, split from the original monolithic `renderers/app-creation.js` file.

## Components

### `step-one.js` - AppCreationStepOne
- Initial user input step
- Handles the "What would you like?" input field
- Validates input and dispatches `step-one-next` event

### `step-two.js` - AppCreationStepTwo  
- Title and description generation step
- Shows user input and generated app concept
- Handles streaming updates from AI generation
- Allows editing of title/description
- Dispatches `step-two-next` event

### `step-three.js` - AppCreationStepThree
- Logo generation step
- Shows app summary and logo preview
- Handles OpenAI API availability checking
- Manages logo generation, retry, and skip functionality
- Dispatches `step-three-back` and `generate-app` events

### `generation-status.js` - GenerationStatus
- Loading indicator component
- Shows spinner and status messages during generation
- Can be shown/hidden and message updated dynamically

### `app-creation-controller.js` - AppCreationController
- Main orchestrator component
- Manages step progression and state
- Handles communication between steps
- Manages progress indicator
- Coordinates API calls for generation

### `index.js`
- Barrel export file for easy importing
- Registers all components when imported

## Usage

Import all components:
```javascript
import '../components/ui/app-creation/index.js';
```

Or import individual components:
```javascript
import { AppCreationController } from '../components/ui/app-creation/app-creation-controller.js';
```

## Architecture

- Each component is a self-contained web component with shadow DOM
- Components communicate via custom events that bubble up
- The controller manages overall state and coordinates between steps
- Error handling uses the existing error components from `components/core/error-handling/`
- All styling is encapsulated within each component's shadow DOM

## Migration Notes

This refactoring maintains 100% functional compatibility with the original monolithic implementation while providing:
- Better code organization and maintainability
- Easier testing of individual components
- Reusable components for other parts of the application
- Cleaner separation of concerns
