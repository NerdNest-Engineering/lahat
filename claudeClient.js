import Anthropic from '@anthropic-ai/sdk';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ClaudeClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.anthropic = new Anthropic({
      apiKey: this.apiKey || process.env.ANTHROPIC_API_KEY
    });
    
    this.systemPrompt = `You are an expert web developer specializing in creating self-contained mini applications using HTML, CSS, and JavaScript. When given a description of an application, you will generate a complete, functional implementation that can run in an Electron window.

IMPORTANT GUIDELINES:
1. Your response must be a SINGLE self-contained HTML file that includes all CSS and JavaScript.
2. All CSS must be in a <style> tag in the <head> section.
3. All JavaScript must be in a <script> tag at the end of the <body> section.
4. The application must be fully functional without any external dependencies or network requests.
5. Use modern JavaScript (ES6+) and CSS features.
6. Ensure the UI is clean, intuitive, and responsive.
7. Include appropriate error handling and user feedback.
8. Add comments to explain complex logic or functionality.

RESPONSE FORMAT:
Your response must be a valid HTML document starting with <!DOCTYPE html> and containing all necessary elements. Do not include any explanations or markdown formatting outside the HTML code.

EXAMPLE OUTPUT:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mini Application</title>
  <style>
    /* CSS styles here */
  </style>
</head>
<body>
  <!-- HTML content here -->
  <script>
    // JavaScript code here
  </script>
</body>
</html>`;

    this.appStoragePath = path.join(app.getPath('userData'), 'generated-apps');
    this.ensureAppStorageDirectory();
  }

  async ensureAppStorageDirectory() {
    try {
      await fs.mkdir(this.appStoragePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create app storage directory:', error);
    }
  }

  async generateApp(prompt, conversationId = null) {
    try {
      // Initialize messages with just the user prompt
      const messages = [
        { role: 'user', content: prompt }
      ];

      // If this is a continuation of a conversation, load previous messages
      if (conversationId) {
        const previousMessages = await this.loadConversation(conversationId);
        if (previousMessages && previousMessages.length > 0) {
          // Filter out any system messages from previous conversations
          const filteredMessages = previousMessages.filter(msg => msg.role !== 'system');
          messages.unshift(...filteredMessages);
        }
      }

      const response = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // Updated to latest model
        max_tokens: 64000, // Reduced to maximum allowed for this model
        system: this.systemPrompt, // System prompt as top-level parameter
        messages,
        stream: true
      });

      return response;
    } catch (error) {
      console.error('Claude API Error details:', error);
      throw new Error(`Claude API Error: ${error.message}`);
    }
  }

  async saveGeneratedApp(appName, htmlContent, prompt, conversationId = null) {
    // Create a safe filename from the app name
    const safeAppName = appName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const filename = `${safeAppName}_${timestamp}.html`;
    const filePath = path.join(this.appStoragePath, filename);
    
    // Save the HTML content
    try {
      await fs.writeFile(filePath, htmlContent);
      
      // Save metadata
      const metadataPath = path.join(this.appStoragePath, `${filename}.meta.json`);
      const metadata = {
        name: appName,
        created: new Date().toISOString(),
        prompt,
        conversationId: conversationId || `conv_${timestamp}`,
        versions: [
          {
            timestamp,
            filePath
          }
        ]
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      return {
        filename,
        filePath,
        metadata
      };
    } catch (error) {
      throw new Error(`Failed to save generated app: ${error.message}`);
    }
  }

  async loadConversation(conversationId) {
    try {
      const files = await fs.readdir(this.appStoragePath);
      const metaFiles = files.filter(file => file.endsWith('.meta.json'));
      
      for (const metaFile of metaFiles) {
        const metaPath = path.join(this.appStoragePath, metaFile);
        const metaContent = await fs.readFile(metaPath, 'utf-8');
        const metadata = JSON.parse(metaContent);
        
        if (metadata.conversationId === conversationId) {
          // Reconstruct conversation from metadata
          const messages = [
            { role: 'user', content: metadata.prompt },
            { role: 'assistant', content: await fs.readFile(path.join(this.appStoragePath, metadata.versions[0].filePath), 'utf-8') }
          ];
          
          // Add any additional messages from iterations
          for (let i = 1; i < metadata.versions.length; i++) {
            if (metadata.versions[i].prompt) {
              messages.push({ role: 'user', content: metadata.versions[i].prompt });
              messages.push({ 
                role: 'assistant', 
                content: await fs.readFile(path.join(this.appStoragePath, metadata.versions[i].filePath), 'utf-8')
              });
            }
          }
          
          return messages;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load conversation:', error);
      return null;
    }
  }

  async listGeneratedApps() {
    try {
      const files = await fs.readdir(this.appStoragePath);
      const metaFiles = files.filter(file => file.endsWith('.meta.json'));
      const apps = [];
      
      for (const metaFile of metaFiles) {
        const metaPath = path.join(this.appStoragePath, metaFile);
        const metaContent = await fs.readFile(metaPath, 'utf-8');
        const metadata = JSON.parse(metaContent);
        
        apps.push({
          id: metadata.conversationId,
          name: metadata.name,
          created: metadata.created,
          filePath: path.join(this.appStoragePath, metadata.versions[metadata.versions.length - 1].filePath),
          versions: metadata.versions.length
        });
      }
      
      // Sort by creation date (newest first)
      return apps.sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      console.error('Failed to list generated apps:', error);
      return [];
    }
  }

  async updateGeneratedApp(conversationId, prompt, htmlContent) {
    try {
      const files = await fs.readdir(this.appStoragePath);
      const metaFiles = files.filter(file => file.endsWith('.meta.json'));
      
      for (const metaFile of metaFiles) {
        const metaPath = path.join(this.appStoragePath, metaFile);
        const metaContent = await fs.readFile(metaPath, 'utf-8');
        const metadata = JSON.parse(metaContent);
        
        if (metadata.conversationId === conversationId) {
          // Create a new version
          const timestamp = Date.now();
          const baseFilename = metaFile.replace('.meta.json', '');
          const versionFilename = `${baseFilename}_v${metadata.versions.length + 1}.html`;
          const versionPath = path.join(this.appStoragePath, versionFilename);
          
          // Save the new version
          await fs.writeFile(versionPath, htmlContent);
          
          // Update metadata
          metadata.versions.push({
            timestamp,
            filePath: versionFilename,
            prompt
          });
          
          await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));
          
          return {
            conversationId,
            filePath: versionPath,
            versionNumber: metadata.versions.length
          };
        }
      }
      
      throw new Error(`App with conversation ID ${conversationId} not found`);
    } catch (error) {
      throw new Error(`Failed to update generated app: ${error.message}`);
    }
  }

  async deleteGeneratedApp(conversationId) {
    try {
      const files = await fs.readdir(this.appStoragePath);
      const metaFiles = files.filter(file => file.endsWith('.meta.json'));
      
      for (const metaFile of metaFiles) {
        const metaPath = path.join(this.appStoragePath, metaFile);
        const metaContent = await fs.readFile(metaPath, 'utf-8');
        const metadata = JSON.parse(metaContent);
        
        if (metadata.conversationId === conversationId) {
          // Delete all version files
          for (const version of metadata.versions) {
            const versionPath = path.join(this.appStoragePath, version.filePath);
            await fs.unlink(versionPath).catch(() => {});
          }
          
          // Delete metadata file
          await fs.unlink(metaPath);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete generated app:', error);
      return false;
    }
  }
}

export default ClaudeClient;
