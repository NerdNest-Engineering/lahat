import Anthropic from '@anthropic-ai/sdk';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import extract from 'extract-zip';
import logoGenerator from './modules/utils/logoGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ClaudeClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.readOnlyMode = !apiKey;
    
    // Only initialize Anthropic client if we have an API key
    if (apiKey) {
      this.anthropic = new Anthropic({
        apiKey: this.apiKey || process.env.ANTHROPIC_API_KEY
      });
    }
    
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
9. CRITICAL: You MUST include a transparent draggable region at the top of the window for the Electron app. Add this to your HTML body as the first element: <div style="height: 38px; width: 100%; position: fixed; top: 0; left: 0; -webkit-app-region: drag; z-index: 1000;"></div>
10. Make sure your content has enough top padding (at least 38px) to account for the draggable region.

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
    body {
      padding-top: 38px; /* Add padding for the drag region */
    }
  </style>
</head>
<body>
  <div style="height: 38px; width: 100%; position: fixed; top: 0; left: 0; -webkit-app-region: drag; z-index: 1000;"></div>
  <!-- HTML content here -->
  <script>
    // JavaScript code here
  </script>
</body>
</html>`;

    this.appStoragePath = path.join(app.getPath('userData'), 'generated-apps');
    this.ensureAppStorageDirectory();
    this.migrateExistingApps();
  }

  // Migrate existing apps to the new folder structure
  async migrateExistingApps() {
    try {
      console.log('Checking for apps to migrate...');
      const files = await fs.readdir(this.appStoragePath);
      const metaFiles = files.filter(file => file.endsWith('.meta.json'));
      
      if (metaFiles.length === 0) {
        console.log('No apps to migrate');
        return;
      }
      
      console.log(`Found ${metaFiles.length} apps to migrate`);
      
      for (const metaFile of metaFiles) {
        try {
          const metaPath = path.join(this.appStoragePath, metaFile);
          const metaContent = await fs.readFile(metaPath, 'utf-8');
          let metadata;
          
          try {
            metadata = JSON.parse(metaContent);
          } catch (error) {
            console.error(`Error parsing metadata file ${metaFile}:`, error);
            continue;
          }
          
          // Create a folder for this app
          const baseFilename = metaFile.replace('.meta.json', '');
          const folderName = baseFilename;
          const folderPath = path.join(this.appStoragePath, folderName);
          
          console.log(`Migrating app to folder: ${folderPath}`);
          
          // Create the folder
          await fs.mkdir(folderPath, { recursive: true });
          
          // Create assets folder
          await fs.mkdir(path.join(folderPath, 'assets'), { recursive: true });
          
          // Move all versions to the new folder
          if (metadata.versions && Array.isArray(metadata.versions)) {
            for (let i = 0; i < metadata.versions.length; i++) {
              const version = metadata.versions[i];
              const oldPath = path.join(this.appStoragePath, version.filePath);
              
              // For the first version, save as index.html
              // For other versions, save as vX.html
              const newFilename = i === 0 ? 'index.html' : `v${i + 1}.html`;
              const newPath = path.join(folderPath, newFilename);
              
              try {
                // Read the file content
                const content = await fs.readFile(oldPath, 'utf-8');
                
                // Write to the new location
                await fs.writeFile(newPath, content);
                
                // Update the file path in metadata
                version.filePath = newFilename;
                
                // Delete the old file
                await fs.unlink(oldPath).catch(() => {});
              } catch (error) {
                console.error(`Error moving file ${oldPath}:`, error);
              }
            }
          }
          
          // Save the updated metadata to the new location
          await fs.writeFile(
            path.join(folderPath, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
          );
          
          // Delete the old metadata file
          await fs.unlink(metaPath).catch(() => {});
          
          console.log(`Successfully migrated app: ${metadata.name}`);
        } catch (error) {
          console.error(`Error migrating app ${metaFile}:`, error);
        }
      }
      
      console.log('Migration complete');
    } catch (error) {
      console.error('Error migrating apps:', error);
    }
  }

  async ensureAppStorageDirectory() {
    try {
      await fs.mkdir(this.appStoragePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create app storage directory:', error);
    }
  }

  async generateApp(prompt, conversationId = null) {
    // Check if in read-only mode
    if (this.readOnlyMode) {
      throw new Error('Cannot generate app: API key not set. Please set your Claude API key in settings.');
    }
    
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
        model: 'claude-opus-4-20250514',
        max_tokens: 64000,
        system: this.systemPrompt,
        messages,
        stream: true
      });

      return response;
    } catch (error) {
      console.error('Claude API Error details:', error);
      throw new Error(`Claude API Error: ${error.message}`);
    }
  }

  async saveGeneratedApp(appName, htmlContent, prompt, conversationId = null, logoData = null) {
    // Check if in read-only mode
    if (this.readOnlyMode) {
      throw new Error('Cannot save generated app: API key not set. Please set your Claude API key in settings.');
    }
    
    // Create a safe folder name from the app name
    const safeAppName = appName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const folderName = `${safeAppName}_${timestamp}`;
    const folderPath = path.join(this.appStoragePath, folderName);
    
    console.log('Saving generated app to folder:', folderPath);
    
    try {
      // Create the app folder
      await fs.mkdir(folderPath, { recursive: true });
      
      // Create assets folder
      await fs.mkdir(path.join(folderPath, 'assets'), { recursive: true });
      
      // Save the HTML content as index.html
      const htmlFilePath = path.join(folderPath, 'index.html');
      await fs.writeFile(htmlFilePath, htmlContent);
      
      // Generate logo if OpenAI is available and no logo data provided
      let logoInfo = null;
      if (!logoData && logoGenerator.isAvailable()) {
        try {
          console.log('Generating logo for app:', appName);
          const logoResult = await logoGenerator.generateAppLogo(appName, prompt, folderPath);
          if (logoResult.success) {
            logoInfo = logoResult.logo;
            console.log('Logo generated successfully:', logoInfo.filePath);
          } else {
            console.warn('Logo generation failed:', logoResult.error);
          }
        } catch (error) {
          console.warn('Logo generation error:', error.message);
        }
      } else if (logoData) {
        logoInfo = logoData;
      }
      
      // Create metadata
      const metadata = {
        name: appName,
        created: new Date().toISOString(),
        prompt,
        conversationId: conversationId || `conv_${timestamp}`,
        logo: logoInfo,
        versions: [
          {
            timestamp,
            filePath: 'index.html' // Relative path within the folder
          }
        ]
      };
      
      // Save metadata
      const metadataPath = path.join(folderPath, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      return {
        folderName,
        filePath: htmlFilePath,
        folderPath,
        metadata,
        logoGenerated: logoInfo !== null
      };
    } catch (error) {
      throw new Error(`Failed to save generated app: ${error.message}`);
    }
  }

  async loadConversation(conversationId) {
    try {
      // Get all folders in the app storage directory
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metaContent);
          
          if (metadata.conversationId === conversationId) {
            // Reconstruct conversation from metadata
            const messages = [
              { role: 'user', content: metadata.prompt },
              { 
                role: 'assistant', 
                content: await fs.readFile(
                  path.join(this.appStoragePath, folder, metadata.versions[0].filePath), 
                  'utf-8'
                ) 
              }
            ];
            
            // Add any additional messages from iterations
            for (let i = 1; i < metadata.versions.length; i++) {
              if (metadata.versions[i].prompt) {
                messages.push({ role: 'user', content: metadata.versions[i].prompt });
                messages.push({ 
                  role: 'assistant', 
                  content: await fs.readFile(
                    path.join(this.appStoragePath, folder, metadata.versions[i].filePath), 
                    'utf-8'
                  )
                });
              }
            }
            
            return messages;
          }
        } catch (error) {
          // Skip folders without valid metadata
          continue;
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
      // Get all folders in the app storage directory
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      const apps = [];
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metaContent);
          
          // Get the latest version file path
          const latestVersion = metadata.versions[metadata.versions.length - 1];
          const latestFilePath = path.join(this.appStoragePath, folder, latestVersion.filePath);
          
          // Get logo path if available
          let logoPath = null;
          if (metadata.logo && metadata.logo.filePath) {
            logoPath = path.join(this.appStoragePath, folder, metadata.logo.filePath);
          }
          
          apps.push({
            id: metadata.conversationId,
            name: metadata.name,
            created: metadata.created,
            filePath: latestFilePath,
            folderPath: path.join(this.appStoragePath, folder),
            versions: metadata.versions.length,
            logo: metadata.logo,
            logoPath
          });
        } catch (error) {
          // Skip folders without valid metadata
          continue;
        }
      }
      
      // Sort by creation date (newest first)
      return apps.sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      console.error('Failed to list generated apps:', error);
      return [];
    }
  }

  async updateGeneratedApp(conversationId, prompt, htmlContent) {
    // Check if in read-only mode
    if (this.readOnlyMode) {
      throw new Error('Cannot update app: API key not set. Please set your Claude API key in settings.');
    }
    
    try {
      // Get all folders in the app storage directory
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metaContent);
          
          if (metadata.conversationId === conversationId) {
            // Create a new version
            const timestamp = Date.now();
            const versionNumber = metadata.versions.length + 1;
            const versionFilename = `v${versionNumber}.html`;
            const versionPath = path.join(this.appStoragePath, folder, versionFilename);
            
            console.log('Updating app, saving to:', versionPath);
            
            // Save the new version
            await fs.writeFile(versionPath, htmlContent);
            
            // Update metadata
            metadata.versions.push({
              timestamp,
              filePath: versionFilename,
              prompt
            });
            
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            
            return {
              conversationId,
              filePath: versionPath,
              folderPath: path.join(this.appStoragePath, folder),
              versionNumber
            };
          }
        } catch (error) {
          // Skip folders without valid metadata
          continue;
        }
      }
      
      throw new Error(`App with conversation ID ${conversationId} not found`);
    } catch (error) {
      throw new Error(`Failed to update generated app: ${error.message}`);
    }
  }

  async deleteGeneratedApp(conversationId) {
    // Check if in read-only mode
    if (this.readOnlyMode) {
      throw new Error('Cannot delete app: API key not set. Please set your Claude API key in settings.');
    }
    
    try {
      // Get all folders in the app storage directory
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metaContent);
          
          if (metadata.conversationId === conversationId) {
            // Delete the entire folder
            const folderPath = path.join(this.appStoragePath, folder);
            
            // Get all files in the folder
            const folderFiles = await fs.readdir(folderPath);
            
            // Delete each file
            for (const file of folderFiles) {
              await fs.unlink(path.join(folderPath, file)).catch(() => {});
            }
            
            // Delete any subdirectories
            const subItems = await fs.readdir(folderPath, { withFileTypes: true });
            const subDirs = subItems.filter(item => item.isDirectory()).map(item => item.name);
            
            for (const subDir of subDirs) {
              const subDirPath = path.join(folderPath, subDir);
              const subFiles = await fs.readdir(subDirPath);
              
              // Delete files in subdirectory
              for (const file of subFiles) {
                await fs.unlink(path.join(subDirPath, file)).catch(() => {});
              }
              
              // Remove subdirectory
              await fs.rmdir(subDirPath).catch(() => {});
            }
            
            // Remove the main folder
            await fs.rmdir(folderPath).catch(() => {});
            
            return true;
          }
        } catch (error) {
          // Skip folders without valid metadata
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete generated app:', error);
      return false;
    }
  }
  
  /**
   * Export a mini app as a zip package
   * @param {string} conversationId - ID of the mini app to export
   * @param {string} outputPath - Path to save the zip file (optional)
   * @returns {Promise<Object>} - Result object with success flag and file path
   */
  async exportMiniAppAsPackage(conversationId, outputPath = null) {
    try {
      // Find the app folder
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      let appFolder = null;
      let metadata = null;
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const parsedMetadata = JSON.parse(metaContent);
          
          if (parsedMetadata.conversationId === conversationId) {
            appFolder = folder;
            metadata = parsedMetadata;
            break;
          }
        } catch (error) {
          // Skip folders without valid metadata
          continue;
        }
      }
      
      if (!appFolder || !metadata) {
        throw new Error(`App with conversation ID ${conversationId} not found`);
      }
      
      // Create a safe filename for the zip
      const safeAppName = metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      // If outputPath is provided, use it directly, otherwise create a default path with the app name
      const zipFilename = outputPath || path.join(app.getPath('downloads'), `${safeAppName}.zip`);
      
      // Create a zip file
      const output = createWriteStream(zipFilename);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });
      
      // Pipe the archive to the output file
      archive.pipe(output);
      
      // Add the entire app folder to the zip
      const folderPath = path.join(this.appStoragePath, appFolder);
      archive.directory(folderPath, false);
      
      // Finalize the archive
      await archive.finalize();
      
      return {
        success: true,
        filePath: zipFilename
      };
    } catch (error) {
      console.error('Failed to export mini app as package:', error);
      return {
        success: false,
        error: `Failed to export mini app: ${error.message}`
      };
    }
  }
  
  /**
   * Import a mini app from a zip package
   * @param {string} zipFilePath - Path to the zip file
   * @returns {Promise<Object>} - Result object with success flag and app info
   */
  async importMiniAppPackage(zipFilePath) {
    try {
      // Create a temporary directory for extraction
      const tempDir = path.join(app.getPath('temp'), `import_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      
      // Extract the zip file
      await extract(zipFilePath, { dir: tempDir });
      
      // Check for metadata.json
      const metadataPath = path.join(tempDir, 'metadata.json');
      
      try {
        await fs.access(metadataPath);
      } catch (error) {
        throw new Error('Invalid mini app package: metadata.json not found');
      }
      
      // Read and validate metadata
      const metaContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metaContent);
      
      if (!metadata.name || !metadata.conversationId || !metadata.versions || !Array.isArray(metadata.versions)) {
        throw new Error('Invalid metadata format in package');
      }
      
      // Create a new folder in the app storage directory
      const safeAppName = metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = Date.now();
      const folderName = `${safeAppName}_${timestamp}`;
      const folderPath = path.join(this.appStoragePath, folderName);
      
      // Create the folder
      await fs.mkdir(folderPath, { recursive: true });
      
      // Create assets folder
      await fs.mkdir(path.join(folderPath, 'assets'), { recursive: true });
      
      // Copy all files from temp directory to the new folder
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        if (file === 'assets') {
          // Handle assets directory separately
          const assetFiles = await fs.readdir(path.join(tempDir, 'assets'));
          for (const assetFile of assetFiles) {
            const srcPath = path.join(tempDir, 'assets', assetFile);
            const destPath = path.join(folderPath, 'assets', assetFile);
            await fs.copyFile(srcPath, destPath);
          }
        } else {
          const srcPath = path.join(tempDir, file);
          const destPath = path.join(folderPath, file);
          
          // Check if it's a directory
          const stat = await fs.stat(srcPath);
          if (stat.isDirectory() && file !== 'assets') {
            // Create the directory
            await fs.mkdir(destPath, { recursive: true });
            
            // Copy all files in the directory
            const subFiles = await fs.readdir(srcPath);
            for (const subFile of subFiles) {
              const subSrcPath = path.join(srcPath, subFile);
              const subDestPath = path.join(destPath, subFile);
              await fs.copyFile(subSrcPath, subDestPath);
            }
          } else if (stat.isFile()) {
            // Copy the file
            await fs.copyFile(srcPath, destPath);
          }
        }
      }
      
      // Update the metadata with a new conversation ID to avoid conflicts
      metadata.conversationId = `conv_imported_${timestamp}`;
      
      // Save the updated metadata
      await fs.writeFile(
        path.join(folderPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Clean up temp directory
      await this.deleteDirectory(tempDir);
      
      return {
        success: true,
        appId: metadata.conversationId,
        name: metadata.name,
        filePath: path.join(folderPath, 'index.html'),
        folderPath
      };
    } catch (error) {
      console.error('Failed to import mini app package:', error);
      return {
        success: false,
        error: `Failed to import mini app: ${error.message}`
      };
    }
  }
  
  /**
   * Helper method to recursively delete a directory
   * @param {string} dirPath - Path to the directory
   */
  async deleteDirectory(dirPath) {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          await this.deleteDirectory(itemPath);
        } else {
          await fs.unlink(itemPath).catch(() => {});
        }
      }
      
      await fs.rmdir(dirPath).catch(() => {});
    } catch (error) {
      console.error(`Error deleting directory ${dirPath}:`, error);
    }
  }
}

export default ClaudeClient;
