// Component Tester - Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const componentFileInput = document.getElementById('component-file');
    const analyzeBtn = document.getElementById('analyze-btn');
    const updateBtn = document.getElementById('update-btn');
    const analysisSection = document.getElementById('analysis-section');
    const componentDetails = document.getElementById('component-details');
    const testInterface = document.getElementById('test-interface');
    const componentForm = document.getElementById('component-form');
    const componentPreview = document.getElementById('component-preview');

    // API URL - change this if your server runs on a different port
    const API_URL = 'http://localhost:3000/api';

    // Global state
    let currentComponent = null;
    let componentCode = '';

    // Event Listeners
    analyzeBtn.addEventListener('click', handleAnalyzeComponent);
    updateBtn.addEventListener('click', updateComponentPreview);

    // Handle component file upload and analysis
    async function handleAnalyzeComponent() {
        const file = componentFileInput.files[0];
        if (!file) {
            alert('Please select a component file to analyze.');
            return;
        }

        try {
            componentCode = await readFileContent(file);
            await analyzeComponentWithLLM(componentCode, file.name);
        } catch (error) {
            console.error('Error analyzing component:', error);
            showError('Failed to analyze component: ' + error.message);
        }
    }

    // Read file content from upload
    function readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    // Analyze component using Ollama LLM via the server
    async function analyzeComponentWithLLM(code, filename) {
        // Show loading state
        componentDetails.innerHTML = '<p>Analyzing component with Ollama LLM...</p>';
        analysisSection.style.display = 'block';
        
        try {
            // Call server API
            const response = await fetch(`${API_URL}/analyze-component`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, filename })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze component');
            }
            
            const data = await response.json();
            const componentInfo = data.componentInfo;
            
            // Display analysis results
            displayComponentAnalysis(componentInfo);
            
            // Generate test form
            generateTestForm(componentInfo);
            
            // Show test interface
            testInterface.style.display = 'flex';
            
            // Initialize the preview
            initializeComponentPreview(componentInfo);
        } catch (error) {
            console.error('Error in component analysis:', error);
            componentDetails.innerHTML = `<p class="error">Analysis failed: ${error.message}</p>`;
        }
    }

    // Display component analysis results
    function displayComponentAnalysis(componentInfo) {
        componentDetails.innerHTML = `
            <h3>${componentInfo.name}</h3>
            <p><strong>Type:</strong> ${componentInfo.type}</p>
            <p><strong>Description:</strong> ${componentInfo.description}</p>
            
            <h4>Attributes (${componentInfo.attributes?.length || 0})</h4>
            ${componentInfo.attributes?.length > 0 
                ? `<ul>${componentInfo.attributes.map(attr => 
                    `<li><strong>${attr.name}</strong> - ${attr.description} (${attr.type})</li>`).join('')}</ul>` 
                : '<p>No attributes detected</p>'}
            
            <h4>Events (${componentInfo.events?.length || 0})</h4>
            ${componentInfo.events?.length > 0 
                ? `<ul>${componentInfo.events.map(event => 
                    `<li><strong>${event.name}</strong> - ${event.description}</li>`).join('')}</ul>` 
                : '<p>No events detected</p>'}
                
            <h4>Methods (${componentInfo.methods?.length || 0})</h4>
            ${componentInfo.methods?.length > 0 
                ? `<ul>${componentInfo.methods.map(method => 
                    `<li><strong>${method.name}</strong> - ${method.description}</li>`).join('')}</ul>` 
                : '<p>No methods detected</p>'}
        `;
    }

    // Generate test form based on component properties
    function generateTestForm(componentInfo) {
        // Clear previous form
        componentForm.innerHTML = '';
        
        // Use attributes for form generation
        let attributes = [];
        if (componentInfo.attributes?.length > 0) {
            attributes = componentInfo.attributes;
        } else if (componentInfo.properties?.length > 0) {
            attributes = componentInfo.properties;
        } else {
            // Fallback if no attributes detected
            componentForm.innerHTML = '<p>No attributes detected for this component.</p>';
            return;
        }
        
        // Add form fields for each attribute
        attributes.forEach(attr => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.setAttribute('for', `attr-${attr.name}`);
            label.textContent = attr.name;
            
            let input;
            let inputType = 'text';
            
            if (attr.type?.toLowerCase().includes('date')) {
                inputType = 'date';
            } else if (attr.type?.toLowerCase().includes('number')) {
                inputType = 'number';
            } else if (attr.type?.toLowerCase().includes('boolean')) {
                inputType = 'select';
            }
            
            if (inputType === 'date') {
                input = document.createElement('input');
                input.type = 'date';
                input.value = new Date().toISOString().split('T')[0];
            } else if (inputType === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.value = '0';
            } else if (inputType === 'select') {
                input = document.createElement('select');
                ['true', 'false'].forEach(val => {
                    const option = document.createElement('option');
                    option.value = val;
                    option.textContent = val;
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = attr.example || '';
            }
            
            input.id = `attr-${attr.name}`;
            input.name = attr.name;
            input.setAttribute('data-attr-name', attr.name);
            
            // Add required attribute if necessary
            if (attr.required) {
                input.required = true;
                label.innerHTML += ' <span class="required">*</span>';
            }
            
            // Add description as tooltip
            if (attr.description) {
                input.title = attr.description;
                label.title = attr.description;
            }
            
            formGroup.appendChild(label);
            formGroup.appendChild(input);
            componentForm.appendChild(formGroup);
        });
    }

    // Initialize component preview
    function initializeComponentPreview(componentInfo) {
        // Create a script element to load the component
        const script = document.createElement('script');
        script.type = 'module';
        
        // Create a blob URL for the component code
        const blob = new Blob([componentCode], { type: 'text/javascript' });
        script.src = URL.createObjectURL(blob);
        
        // Clear previous preview
        componentPreview.innerHTML = '';
        
        // Create a div for the component
        const componentContainer = document.createElement('div');
        componentContainer.id = 'component-container';
        componentPreview.appendChild(componentContainer);
        
        // Add the script to load the component
        document.head.appendChild(script);
        
        // Set up to create component after script loads
        script.onload = () => {
            // Determine the component tag name (convert CamelCase to kebab-case)
            let tagName = componentInfo.name
                .replace(/([a-z])([A-Z])/g, '$1-$2')
                .toLowerCase();
            
            // If the custom element is already defined, use it
            if (!customElements.get(tagName)) {
                // Try alternative tag name detection methods
                // Check if the component defines a custom element
                const defineMatch = componentCode.match(/customElements\.define\(['"]([^'"]+)['"]/);
                if (defineMatch && defineMatch[1]) {
                    tagName = defineMatch[1];
                } else {
                    // Fallback to div if we can't determine the tag
                    tagName = 'div';
                }
            }
            
            // Create the component element
            const componentElement = document.createElement(tagName);
            componentContainer.appendChild(componentElement);
            
            // Update the component with form values
            updateComponentPreview();
        };
    }

    // Update component preview with form values
    function updateComponentPreview() {
        // Find the component in the preview
        const containerEl = document.getElementById('component-container');
        if (!containerEl || !containerEl.firstChild) {
            console.error('Component preview not initialized yet');
            return;
        }
        
        const componentEl = containerEl.firstChild;
        
        // Get form values and set as attributes
        const inputs = componentForm.querySelectorAll('[data-attr-name]');
        inputs.forEach(input => {
            const attrName = input.getAttribute('data-attr-name');
            let value;
            
            // Get appropriate value based on input type
            if (input.type === 'number') {
                value = Number(input.value);
            } else if (input.tagName.toLowerCase() === 'select') {
                value = input.value;
            } else if (input.type === 'date') {
                value = input.value; // Keep date as string
            } else {
                value = input.value;
            }
            
            if (value !== null && value !== undefined && value !== '') {
                componentEl.setAttribute(attrName, String(value));
            } else {
                componentEl.removeAttribute(attrName);
            }
        });
    }

    // Helper function to show error messages
    function showError(message) {
        componentDetails.innerHTML = `<p class="error">${message}</p>`;
        analysisSection.style.display = 'block';
    }
});
