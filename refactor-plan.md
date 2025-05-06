# Refactoring Plan: App Creation Steps (Composition Model)

This plan outlines the refactoring of the app creation step components to use a composition model instead of inheritance, promoting better separation of concerns and flexibility.

## Core Principles

*   **Composition over Inheritance:** Step-specific components will extend `HTMLElement` directly, not a shared base step component.
*   **Separation of Concerns:**
    *   **Wrapper Component (`app-creation-step`):** Provides the common visual frame (header, footer, navigation, slot).
    *   **Step Components (`app-creation-step-one`, etc.):** Contain only the UI and logic unique to that step.
    *   **Controller (`AppCreationController`):** Orchestrates the flow, manages which step is displayed, and mediates communication.
*   **Shared Logic:** Reusable functionality will be extracted into utility modules/functions and imported as needed.

## Component Responsibilities

### 1. Step Components (e.g., `app-creation-step-one.js`)

*   **Inheritance:** `extends HTMLElement`
*   **Template:** Contains *only* step-specific UI elements (inputs, examples, etc.). No common header/footer/nav.
*   **State:** Manages internal state relevant to the step's task (e.g., input validity).
*   **Events Dispatched:**
    *   `step-validity-change`: `CustomEvent('step-validity-change', { detail: { isValid: boolean } })` - Fired whenever the step's input becomes valid/invalid for proceeding.
    *   *(Optional)* `step-data-ready`: `CustomEvent('step-data-ready', { detail: { output: any } })` - Fired when data is ready to be collected by the controller (could be tied to validity or a specific action).
*   **Methods:**
    *   *(Optional)* `getOutputData()`: Called by the controller to retrieve the step's result before navigating next.
    *   *(Optional)* `initializeData(data)`: Called by the controller when activating the step if it needs data from a previous step.
    *   *(Optional)* `handleInProgressChunk(chunk)` / `handleCompletedChunk(chunk)`: If the step needs to display streaming data from IPC.
*   **Removed:** No `super()` call to a base step. No methods like `setActive`, `setStepNumber`, `setStepTitle`.

### 2. Wrapper Component (`app-creation-step.js`)

*   **Inheritance:** `extends HTMLElement`
*   **Template:** Contains the common frame:
    *   Header (displays step number, title, status icon)
    *   `<slot>` element to host the active step component.
    *   Footer/Navigation (Back and Next buttons).
*   **State:** Manages the visual state of the frame elements (button enabled/disabled, title text, etc.).
*   **Events Dispatched:**
    *   `step-back`: Fired when the Back button is clicked.
    *   `step-next`: Fired when the Next button is clicked.
*   **Methods (Called by Controller):**
    *   `setStepNumber(number)`
    *   `setStepTitle(string)`
    *   `setStatus(string)`
    *   `setCompleted(boolean)`
    *   `showBackButton(boolean)`
    *   `enableNextButton(boolean)`
    *   `reset()`: Resets the wrapper's visual state.

### 3. Controller (`AppCreationController.js`)

*   **References:**
    *   Holds a reference to the single wrapper instance (e.g., `this.stepContainer`).
    *   Holds a reference to the *currently slotted* step component (e.g., `this.currentStepElement`).
*   **State:** Tracks the current logical step number (`this.currentStep`).
*   **Event Handling:**
    *   Listens for `step-back` / `step-next` from the `stepContainer`.
    *   Listens for `step-validity-change` from the `currentStepElement`.
*   **Core Logic (`_activateStep`):**
    *   Removes the old `currentStepElement` from the slot and its listeners.
    *   Creates the new step component instance based on the target step number.
    *   Calls `initializeData` on the new step if necessary.
    *   Adds the new step to the `stepContainer`'s slot.
    *   Updates `currentStepElement`.
    *   Adds listeners to the new `currentStepElement`.
    *   Calls methods on `stepContainer` to update the frame's appearance (title, step number, button states).
*   **Navigation Logic (`_handleStepNext`, `_handleStepBack`):**
    *   Triggered by wrapper events.
    *   `_handleStepNext`: Calls `getOutputData()` (or similar) on `currentStepElement`, performs necessary actions (API calls), then calls `_activateStep` for the next step, passing data if needed.
    *   `_handleStepBack`: Calls `_activateStep` for the previous step.
*   **Validity Handling:** When `step-validity-change` is received from `currentStepElement`, calls `stepContainer.enableNextButton(event.detail.isValid)`.
*   **IPC Handling:** Routes incoming data chunks (e.g., title/description generation, app generation) to the `currentStepElement` if it has the appropriate handler methods.

## Implementation Steps

1.  Modify `app-creation-step-one.js` (and subsequently other steps) according to the "Step Components" responsibilities.
2.  Modify `app-creation-step.js` according to the "Wrapper Component" responsibilities (likely minor changes, mostly ensuring methods are robust).
3.  Refactor `AppCreationController.js` significantly according to the "Controller" responsibilities.
4.  Update the main HTML (`app-creator.html`) to ensure only the wrapper (`<app-creation-step>`) is present initially, and the controller dynamically adds the first step component into its slot.
5.  Create utility modules for any shared logic identified during refactoring.

## Mermaid Diagram

```mermaid
graph TD
    subgraph Controller["AppCreationController"]
        direction LR
        StepContainerRef["Ref to Wrapper (stepContainer)"]
        CurrentStepRef["Ref to Current Slotted Step (currentStepElement)"]
        ListenWrapper["Listens for step-back/next on Wrapper"]
        ListenCurrentStep["Listens for step-validity-change on Current Step"]
        ActivateStep["_activateStep(num, data)\n- Creates/Swaps Step in Slot\n- Adds/Removes Listeners\n- Calls Methods on Wrapper"]
        HandleNav["Handles step-back/next:\n- Gets data from Current Step\n- Calls API?\n- Calls _activateStep"]
        HandleValidity["Handles step-validity-change:\n- Calls enableNextButton on Wrapper"]
    end

    subgraph Wrapper["app-creation-step"]
        Slot["<slot></slot>"]
        Header["Header (Number, Title)"]
        Nav["Navigation (Back, Next)"]
        MethodsWrapper["Methods (setTitle, enableNext, etc.)"]
        DispatchWrapper["Dispatches step-back, step-next"]
    end

    subgraph StepComponent["app-creation-step-one\n(extends HTMLElement)"]
        UI["Step-Specific UI"]
        Logic["Internal Logic (Validation)"]
        DispatchStep["Dispatches step-validity-change"]
        GetDataMethod["Optional: getOutputData()"]
        InitDataMethod["Optional: initializeData(data)"]
    end

    Controller -- Manages --> Wrapper
    Controller -- Manages/Swaps --> StepComponent
    Wrapper -- Contains via Slot --> StepComponent
    StepComponent -- step-validity-change --> Controller
    Wrapper -- step-back/next --> Controller
    Controller -- Method Calls --> Wrapper