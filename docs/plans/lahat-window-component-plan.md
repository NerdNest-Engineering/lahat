# Plan: Create and Integrate `lahat-window` Component

**Overall Goal:** Refactor the application window to use a reusable `lahat-window` web component that handles the custom title bar, including correct padding for OS controls, to resolve the collision issue with OS window buttons.

**Phase 1: Create the `lahat-window` Component**

1.  **Component File Creation:**
    *   **Path:** `src/components/ui/shell/lahat-window.js`

2.  **Implement `lahat-window.js`:**
    *   Define a class `LahatWindow` extending `HTMLElement`.
    *   **Shadow DOM HTML Structure:**
        ```html
        <div class="lahat-window-container">
          <!-- The titlebar itself will serve as the primary drag region -->
          <div class="titlebar-internal">
            <span id="title-text"></span>
          </div>
          <div class="content-internal">
            <slot></slot> <!-- Default slot for window content -->
          </div>
        </div>
        ```
    *   **Shadow DOM CSS Styling:**
        *   Import global variables if needed (e.g., for `--primary-color`).
        *   `.lahat-window-container`: `display: flex; flex-direction: column; height: 100vh; width: 100vw; overflow: hidden; background-color: var(--background-color, #fff);`
        *   `.titlebar-internal`: `height: 30px; background-color: var(--primary-color, #4285f4); color: white; display: flex; align-items: center; padding: 0 15px 0 75px; /* top right bottom left - 75px left padding for OS controls */ font-weight: 500; -webkit-app-region: drag; position: relative; z-index: 999; flex-shrink: 0;`
        *   `#title-text`: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
        *   `.content-internal`: `flex: 1; overflow-y: auto; position: relative; padding: 20px; /* Default content padding */`
    *   **JavaScript Logic:**
        *   In `constructor`: `this.attachShadow({ mode: 'open' });` and set up initial `this.shadowRoot.innerHTML` with the structure and styles.
        *   In `connectedCallback`: Get references to internal elements (e.g., `this._titleTextElement = this.shadowRoot.querySelector('#title-text');`) and call `this._updateTitle();`.
        *   Implement `attributeChangedCallback(name, oldValue, newValue)`: If `name === 'window-title'`, call `this._updateTitle();`.
        *   Define `static get observedAttributes() { return ['window-title']; }`.
        *   Method to update title: `_updateTitle() { const title = this.getAttribute('window-title') || 'Lahat Window'; if (this._titleTextElement) this._titleTextElement.textContent = title; }`.
    *   Register the custom element: `customElements.define('lahat-window', LahatWindow);`

**Phase 2: Integrate `lahat-window` into App Creator**

3.  **Update `src/app-creator/app-creator.html`:**
    *   Add the import for the new component (adjust path as necessary if `app-creator.html` is not at the root of `src/app-creator/`):
        `<script type="module" src="../../components/ui/shell/lahat-window.js"></script>`
    *   Replace the current window structure:
        **From:**
        ```html
        <div class="drag-region"></div>
        <div class="window">
          <div class="titlebar">Create a Mini App</div>
          <div class="content">
            <!-- ... existing content ... -->
          </div>
        </div>
        ```
        **To:**
        ```html
        <lahat-window window-title="Create a Mini App">
          <!-- All elements previously inside .content div -->
          <app-creation-step-one id="step-1" class="active"></app-creation-step-one>
          <generation-status id="generation-status"></generation-status>
          <generation-preview id="generation-preview"></generation-preview>
          <!-- etc. -->
        </lahat-window>
        ```

4.  **Refactor `src/app-creator/app-creator.css`:**
    *   Remove the CSS rules for `.drag-region`, `.window`, and `.titlebar`.
    *   Remove or adjust the styles for `.content`, as its role is now handled by `.content-internal` within `lahat-window`.
    *   Review `body` styles in `app-creator.css` (like `overflow: hidden;`) to ensure they are still appropriate.

**Mermaid Diagram of the Refactored Structure:**

```mermaid
graph TD
    subgraph AppCreatorPage [src/app-creator/app-creator.html]
        IMPORT_LW[Import lahat-window.js] --> LW_USAGE
        LW_USAGE{"lahat-window window-title="Create a Mini App""}
        APP_SPECIFIC_CONTENT["App Specific Content &#40;steps, status, preview etc.&#41;"]
        LW_USAGE -- slots content into --> APP_SPECIFIC_CONTENT_SLOT_TARGET
    end

    subgraph LahatWindowComponent [src/components/ui/shell/lahat-window.js]
        LW_CLASS_DEF[Class LahatWindow extends HTMLElement]
        LW_SHADOW_DOM[Shadow DOM]
        LW_CLASS_DEF --> LW_SHADOW_DOM
        subgraph LW_SHADOW_DOM
            LW_STYLE_ENCAP["Encapsulated CSS: .titlebar-internal &#40;with 75px left padding, -webkit-app-region: drag&#41;, .content-internal &#40;for slotted content&#41;"]
            LW_HTML_STRUCT["Internal HTML: div.titlebar-internal > span#title-text, div.content-internal > slot"]
        end
        LW_REGISTRATION[customElements.define('lahat-window', LahatWindow)]
        LW_CLASS_DEF --> LW_REGISTRATION
    end

    APP_SPECIFIC_CONTENT --> APP_SPECIFIC_CONTENT_SLOT_TARGET["slot in lahat-window's Shadow DOM"]

    AppCreatorPage -.-> LahatWindowComponent