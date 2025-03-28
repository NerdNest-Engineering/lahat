const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Ollama API configuration
const OLLAMA_API_URL = 'http://localhost:11434/api';
const DEFAULT_MODEL = 'deepseek-r1:70b'; // Change to your preferred model

// Endpoint to analyze component using Ollama
app.post('/api/analyze-component', async (req, res) => {
    try {
        const { code, filename } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Component code is required' });
        }
        
        console.log(`Analyzing component: ${filename} (${code.length} characters)`);
        
        // Create a prompt for the LLM
        const prompt = createAnalysisPrompt(code, filename);
        console.log('Sending prompt to Ollama...');
        
        // Call Ollama
        const analysisResult = await callOllamaModel(prompt);
        console.log('Received response from Ollama');
        
        // Process the LLM output to extract structured component information
        console.log('Processing LLM output...');
        const componentInfo = processLlmOutput(analysisResult, filename);
        console.log('Analysis complete:', JSON.stringify(componentInfo, null, 2));
        
        res.json({ componentInfo });
    } catch (error) {
        console.error('Error analyzing component:', error);
        res.status(500).json({ 
            error: 'Failed to analyze component', 
            details: error.message 
        });
    }
});

// Helper function to create a structured prompt for the LLM
function createAnalysisPrompt(code, filename) {
    return `
  You are a developer tool assistant. Given a custom web component class (such as a class extending \`HTMLElement\`), analyze its code and extract all public setters or attribute setters (i.e., anything that sets internal state and updates the DOM or state accordingly). For each one, identify:
  
  1. Property name (e.g., \`title\`)
  2. Data type (e.g., \`string\`, \`Date\`, \`number\`, \`boolean\`)
  3. Setter type:
     - \`attribute\` (uses \`setAttribute\`)
     - \`property\` (uses a setter method directly)
  4. Field type for UI:
     - Text input
     - Date picker
     - Number input
     - Toggle (checkbox)
     - Textarea
     - File input
     - Dropdown (if enum-like behavior is inferred)
  5. Whether it is required (based on \`observedAttributes\`, default values, or docstrings)
  
  Use this data to generate a JSON schema that can be used to create a GUI for testing the component.
  
  Here is the component source code from file \`${filename}\`:
  
  \`\`\`js
  ${code}
  \`\`\`
  `;
  }

// Function to call Ollama API
async function callOllamaModel(prompt, model = DEFAULT_MODEL) {
    try {
        const response = await axios.post(`${OLLAMA_API_URL}/generate`, {
            model,
            prompt,
            stream: false
        });
        
        return response.data.response;
    } catch (error) {
        console.error('Error calling Ollama:', error);
        throw new Error(`Ollama API error: ${error.message}`);
    }
}

// Process LLM output to get structured component info
function processLlmOutput(llmOutput, filename) {
    try {
        // Extract JSON from the LLM output
        const jsonMatch = llmOutput.match(/```json\s*([\s\S]*?)\s*```/) || 
                          llmOutput.match(/\{[\s\S]*\}/);
        
        let jsonStr = jsonMatch ? jsonMatch[0] : llmOutput;
        
        // Clean up any markdown code block syntax
        jsonStr = jsonStr.replace(/```json\s*|\s*```/g, '');
        
        // Parse the JSON
        const componentInfo = JSON.parse(jsonStr);
        
        // Add filename
        componentInfo.filename = filename;
        
        return componentInfo;
    } catch (error) {
        console.error('Error parsing LLM output:', error);
        
        // Fallback to basic component info if parsing fails
        return {
            name: 'Unknown Component',
            type: 'unknown',
            description: 'Failed to parse component analysis',
            attributes: [],
            events: [],
            methods: [],
            filename
        };
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Component Tester server running on http://localhost:${PORT}`);
});
