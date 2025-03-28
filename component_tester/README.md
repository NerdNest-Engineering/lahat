# Component Tester with Ollama Integration

A tool for testing UI components in isolation. This tester allows you to:

1. Upload a JavaScript component file
2. Analyze the component using Ollama LLM models
3. Dynamically generate a UI form to test the component with different inputs
4. See a live preview of the component with your test data

## Requirements

- Node.js (v14+)
- npm
- Ollama running locally

## Setup

1. Install Ollama from [https://ollama.ai/](https://ollama.ai/)
2. Run Ollama and pull a model:
   ```
   ollama pull llama3
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open http://localhost:3000 in your browser

## Usage

1. Navigate to the tool in your browser
2. Either upload a component file or enter the path to an existing component
3. Click "Analyze Component" or "Load Component"
4. The component will be analyzed by Ollama LLM
5. Use the generated form to test different component properties
6. Click "Update Component" to see changes reflected in the preview

## Configuration

You can change the Ollama model used for analysis by modifying the `DEFAULT_MODEL` variable in `server.js`. Default is 'llama3'.

## Features

- Deep component analysis using Ollama LLMs
- Extracts attributes, events, methods, and descriptions
- Dynamic form generation based on component attributes
- Live component preview
- Support for Web Components
