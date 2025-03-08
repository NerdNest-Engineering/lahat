# Lahat

<div align="center">
  <img src="assets/icons/lahat.png" alt="Lahat Logo" width="150"/>
  <h3>Build desktop apps with natural language</h3>
</div>

*Lahat* (Tagalog for "all" or "everything") is an Electron application that integrates with Claude to generate mini desktop applications based on natural language prompts.

## 📥 Installation

### Easy Install (Recommended)

1. **Download the latest release**:
   - Go to the [Releases page](https://github.com/Dorky-Robot/lahat/releases/latest)
   - Download the appropriate file for your platform:
     - **macOS**: `Lahat-x.x.x-arm64.dmg` or `Lahat-x.x.x-mac.zip`
     - **Windows**: `Lahat-Setup-x.x.x.exe` or `Lahat-x.x.x-win.zip`
     - **Linux**: `Lahat-x.x.x.AppImage`, `Lahat-x.x.x.deb`, or `Lahat-x.x.x.rpm`

2. **Install**:
   - **macOS**: Open the `.dmg` file and drag Lahat to your Applications folder
   - **Windows**: Run the `.exe` installer and follow the prompts
   - **Linux**: Run the AppImage or install the .deb/.rpm package

### Development Setup

If you're a developer and want to run from source:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the application: `npm start`

## ✨ Features

- **Natural Language App Generation**: Describe the app you want, and Claude will generate a self-contained HTML/CSS/JS implementation
- **App Management**: Save, open, update, and delete your generated mini apps
- **Iterative Refinement**: Continue the conversation with Claude to refine and improve your apps
- **Export Functionality**: Export your mini apps as standalone HTML files

## 🚀 Getting Started

### First-time Setup

1. Launch Lahat - you'll be prompted to enter your Claude API key
2. Get your API key from [Anthropic's website](https://console.anthropic.com/)
3. Enter your key and click "Save API Key" to store it securely
4. You're ready to create apps!

### Creating Your First App

<img src="https://github.com/Dorky-Robot/lahat/assets/screenshots/app-creation.png" alt="App Creation Screenshot" width="600"/>

1. Enter a name for your app
2. Describe what you want it to do, for example:
   ```
   Create a pomodoro timer with a clean design that has:
   - 25/5 minute work/break intervals
   - Start, pause, and reset buttons
   - Sound notification when timer completes
   - A circular progress indicator
   ```
3. Click "Generate Mini App" and wait for Claude to work its magic
4. Your app will open automatically when ready!

### Managing Your Apps

- All your apps appear in the main dashboard
- Click on any app to:
  - **Open**: Launch the app in a new window
  - **Update**: Add new features or fix issues
  - **Export**: Save as a standalone HTML file
  - **Delete**: Remove the app

### Updating Apps

Simply describe what changes you want, and Claude will update your app while preserving your data and preferences.

## 🔒 Security & Privacy

- Your API key is stored securely on your device
- All apps run in sandboxed windows for security
- No network requests are allowed in generated apps
- Strong Content Security Policy (CSP) enforced

## 🛠 Troubleshooting

- **App won't generate?** Check your API key and internet connection
- **App doesn't work as expected?** Try updating with more specific instructions
- **Other issues?** Check our [GitHub Issues](https://github.com/Dorky-Robot/lahat/issues)

## 🔄 Automatic Updates

Lahat will automatically check for updates when you start the app. When a new version is available:

1. You'll see a notification
2. Click "Install and Restart" to update immediately
3. The app will restart with the latest version

## 🗺 Roadmap

- **Local LLM Support**: Integration with Ollama and other local models
- **Enhanced Customization**: More appearance and behavior options
- **Templates Library**: Pre-made templates for common app types
- **Collaborative Features**: Share and collaborate on mini apps
- **AI Improvements**: Smarter app generation with better tools

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](https://github.com/Dorky-Robot/lahat/blob/main/CONTRIBUTING.md) to get started.

## 📝 License

Apache License 2.0 - See [LICENSE](https://github.com/Dorky-Robot/lahat/blob/main/LICENSE.md) for details.

---

<div align="center">
  <img src="assets/icons/lahat.png" alt="Lahat Logo" width="100"/>
  <p>Made with ❤️ by Dorky Robot</p>
  <p>
    <a href="https://github.com/Dorky-Robot/lahat/releases/latest">Download Latest Release</a> •
    <a href="https://github.com/Dorky-Robot/lahat/issues">Report Bug</a> •
    <a href="https://github.com/Dorky-Robot/lahat/issues">Request Feature</a>
  </p>
</div>
