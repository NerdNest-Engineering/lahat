# Plan: Create `step-container` Base Component

## 1. Objective

*   Develop a new reusable Web Component named `step-container`.
*   This component will provide a consistent visual structure (border, padding, shadow) for content within each step of the app creation process.
*   It will use slots for the header, main content, and navigation, allowing step-specific components to inject their unique parts.
*   The `step-container` will be generic and have no knowledge of the specific step components that use it, ensuring reusability and separation of concerns.

## 2. New File

*   Create: `src/app-creator/components/base/step-container.js`

## 3. `step-container.js` - Implementation Details

*   It will be a class `StepContainer` extending `HTMLElement`.
*   It will use its own Shadow DOM.
*   **HTML Structure (inside `step-container.js`'s shadow DOM):**
    ```html
    <div class="container">
      <div class="header-slot-container">
        <slot name="header"></slot>
      </div>
      <div class="content-slot-container">
        <slot name="content"></slot>
      </div>
      <div class="navigation-slot-container">
        <slot name="navigation"></slot>
      </div>
    </div>
    ```
*   **CSS Styles (scoped within `step-container.js`):**
    *   `.container`: Will define `border`, `border-radius`, `box-shadow`, and `overflow: hidden;`. It will utilize existing CSS variables like `var(--border-color)`, `var(--border-radius)`, and `var(--shadow)`.
    *   `.header-slot-container`: Minimal styling, primarily a placeholder.
    *   `.content-slot-container`: Will have `padding: 20px;`.
    *   `.navigation-slot-container`: Will have general padding (e.g., `padding: 0 20px 20px 20px;`) to provide breathing room for slotted navigation elements.

## 4. Refactor `src/app-creator/components/steps/app-creation-step-one.js`

*   Import the new `../base/step-container.js`.
*   The main layout within its shadow DOM will change from `<div class="step-container">...</div>` to use the new `<step-container>...</step-container>`.
*   The existing `<step-header>` component will be placed into the `header` slot: `<step-header slot="header"></step-header>`.
*   The current step-specific content (like `.prompt-container`, `.prompt-examples`) will be wrapped in a `div` and placed into the `content` slot: `<div slot="content">...</div>`.
*   The existing `<step-navigation>` component will be placed into the `navigation` slot: `<step-navigation slot="navigation"></step-navigation>`.
    *   The `margin-top: 30px;` (or similar styling) for the navigation area will continue to be managed by `app-creation-step-one.js` (e.g., by styling the slotted `<step-navigation>` element or a wrapper `div` it places within the slot).
*   The CSS rules for `.step-container` and `.step-content` will be removed from `app-creation-step-one.js` as these visual aspects are now handled by `step-container.js`.
*   The `:host` styles in `app-creation-step-one.js` (for `display: block;` and `margin-bottom: 20px;`) will remain, as they control the component's own block-level layout and spacing relative to other steps.
*   The `fadeIn` animation and its targeting rule (`:host(.active) step-container`) will remain in `app-creation-step-one.js` to animate the step when it becomes active, targeting the new `<step-container>` tag.

## 5. Composition Diagram

```mermaid
graph TD
    subgraph AppCreationStepOne [app-creation-step-one.js]
        direction LR
        ShadowDOM_StepOne["Shadow DOM"]
    end

    subgraph StepContainer [step-container.js]
        direction LR
        ShadowDOM_Container["Shadow DOM"] -- contains --> ContainerDiv[".container"]
        ContainerDiv --- SlotHeader["slot name='header'"]
        ContainerDiv --- SlotContent["slot name='content'"]
        ContainerDiv --- SlotNavigation["slot name='navigation'"]
    end

    ShadowDOM_StepOne -- uses --> StepContainerInstance["<step-container>"]

    StepHeaderComponent["<step-header>"] -- "slotted into" --> SlotHeader
    StepSpecificContent["<div> (prompt, examples, etc.)"] -- "slotted into" --> SlotContent
    StepNavigationComponent["<step-navigation>"] -- "slotted into" --> SlotNavigation

    AppCreationStepOne -- "Composes" --> StepContainerInstance
    StepContainerInstance -- "Projects content via slots from" --> AppCreationStepOne