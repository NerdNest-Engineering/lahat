# Lahat

*Lahat* (Tagalog for "all" or "everything") is an Electron application that integrates with Claude to generate mini desktop applications based on natural language prompts.

## Features

- **Natural Language App Generation**: Describe the app you want, and Claude will generate a self-contained HTML/CSS/JS implementation
- **App Management**: Save, open, update, and delete your generated mini apps
- **Iterative Refinement**: Continue the conversation with Claude to refine and improve your apps
- **Export Functionality**: Export your mini apps as standalone HTML files

## Getting Started

### Prerequisites

- Node.js and npm
- An Anthropic API key for Claude

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the application:
   ```
   npm start
   ```
   
   For development mode with DevTools:
   ```
   npm run dev
   ```

### Setup

1. When you first launch the application, you'll need to enter your Claude API key
2. Click "Save API Key" to store your key securely
3. Once your API key is set, you can start generating mini apps

## Usage

### Generating a Mini App

1. Enter a name for your app in the "App Name" field
2. Describe the app you want in the "Describe Your App" textarea
   - Be as specific as possible about functionality, design, and behavior
   - Example: "Create a pomodoro timer app with start, pause, and reset buttons. It should have a clean, modern design with a circular progress indicator."
3. Click "Generate Mini App"
4. Wait for Claude to generate your app (this may take a few moments)
5. The app will automatically open in a new window when generation is complete

### Managing Your Apps

- View all your generated apps in the "Your Mini Apps" section
- Click on an app card to view details and options:
  - **Open App**: Launch the app in a new window
  - **Update App**: Provide additional instructions to refine the app
  - **Export App**: Save the app as a standalone HTML file
  - **Delete App**: Remove the app from your collection

### Updating an App

1. Click on an app in your list
2. Click "Update App"
3. Describe the changes you want to make
   - Example: "Add a settings button that allows changing the timer duration"
4. Click "Submit Update"
5. The updated app will automatically open when generation is complete

## Security Notes

- All generated apps run in sandboxed browser windows for security
- No external dependencies or network requests are allowed in generated apps
- Content Security Policy (CSP) is applied to all generated apps

## Troubleshooting

- If app generation fails, check your API key and internet connection
- If a generated app doesn't work as expected, try updating it with more specific instructions
- For any issues, check the console logs in development mode (npm run dev)

## Roadmap

Future development plans for Lahat include:

- **Local LLM Support**: Integration with local LLM solutions (e.g., Ollama, llama.cpp) as alternatives to Claude
- **Enhanced Customization**: More options for customizing the appearance and behavior of generated apps
- **Templates & Examples**: Library of template prompts and example apps to help users get started
- **Collaborative Features**: Sharing and collaborative development of mini apps

## Contributing

Contributions to Lahat are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

Please make sure your code follows the existing style and includes appropriate tests.

## License

ISC
