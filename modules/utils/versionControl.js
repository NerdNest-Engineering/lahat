import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.cjs'; // Corrected import path for ES modules
import logger from './logger.js';

// Define base path for storing git repositories
const gitBasePath = path.join(app.getPath('userData'), 'git-repos');

/**
 * Initialize or open a git repository for a mini app
 * @param {string} appId - The app ID
 * @param {string} filePath - Path to the app HTML file
 * @returns {Promise<Object>} - Result object with repo info
 */
export async function initRepo(appId, filePath) {
  try {
    // Create a dedicated directory for this app's repo
    const repoDir = path.join(gitBasePath, appId);
    
    // Ensure directories exist
    await fs.mkdir(repoDir, { recursive: true });
    
    // Copy the file to the repo directory if it's not already there
    const fileName = 'index.html'; // Standardize the filename within the repo
    const repoFilePath = path.join(repoDir, fileName);
    
    // Check if the repo file already exists and matches the source file content
    let needsInitialCommit = false;
    try {
      const currentRepoContent = await fs.readFile(repoFilePath, 'utf-8');
      const sourceContent = await fs.readFile(filePath, 'utf-8');
      if (currentRepoContent !== sourceContent) {
         await fs.writeFile(repoFilePath, sourceContent);
         // If content differs, we might need to commit, but let's handle initialization first
      }
    } catch (readError) {
       // If reading repo file fails, it likely doesn't exist, so copy it
       const sourceContent = await fs.readFile(filePath, 'utf-8');
       await fs.writeFile(repoFilePath, sourceContent);
       needsInitialCommit = true; // Needs initial commit if file was just created
    }

    // Initialize git repo if it doesn't exist
    try {
      await git.resolveRef({ fs, dir: repoDir, ref: 'HEAD' }); // Check if repo exists and has commits
    } catch (e) {
      // If resolveRef throws, the repo might be uninitialized or empty
      await git.init({ fs, dir: repoDir });
      needsInitialCommit = true; // Needs initial commit if repo was just initialized
      
      // Set up git config
      await git.setConfig({ fs, dir: repoDir, path: 'user.name', value: 'Lahat App' });
      await git.setConfig({ fs, dir: repoDir, path: 'user.email', value: 'app@lahat.local' });
    }
    
    // Perform initial commit if needed
    if (needsInitialCommit) {
       try {
         await git.add({ fs, dir: repoDir, filepath: fileName });
         await git.commit({
           fs,
           dir: repoDir,
           message: 'Initial version',
           author: {
             name: 'Lahat App',
             email: 'app@lahat.local'
           }
         });
         logger.info('Initialized git repo and created initial commit', { appId }, 'versionControl');
       } catch (commitError) {
          // Ignore "empty commit" errors if the file was already staged and committed
          if (!commitError.message.includes('empty commit')) {
             throw commitError;
          }
       }
    }
    
    return { 
      success: true, 
      repoDir,
      filePath: repoFilePath // Return the path within the git repo
    };
  } catch (error) {
    logger.error('Error initializing git repo', { error: error.message, appId }, 'versionControl');
    return {
      success: false,
      error: `Error initializing git repo: ${error.message}`
    };
  }
}

/**
 * Create a new commit for a change
 * @param {string} appId - The app ID
 * @param {string} content - New content to commit
 * @param {string} message - Commit message
 * @returns {Promise<Object>} - Result object with commit info
 */
export async function commitChange(appId, content, message) {
  try {
    const repoDir = path.join(gitBasePath, appId);
    const filePath = path.join(repoDir, 'index.html');
    
    // Write the new content
    await fs.writeFile(filePath, content);
    
    // Add and commit
    await git.add({ fs, dir: repoDir, filepath: 'index.html' });
    const commitResult = await git.commit({
      fs,
      dir: repoDir,
      message,
      author: {
        name: 'Lahat App',
        email: 'app@lahat.local'
      }
    });
    
    logger.info('Committed change to git repo', { appId, commitId: commitResult }, 'versionControl');
    
    return { 
      success: true, 
      commitId: commitResult, 
      message,
      date: new Date() // The commit itself has a timestamp, but this is simpler for the renderer
    };
  } catch (error) {
     // Handle potential "empty commit" error if content hasn't changed
     if (error.code === 'EmptyCommitError') {
        logger.warn('Attempted to commit unchanged content', { appId }, 'versionControl');
        // Find the latest commit SHA instead
        const headSha = await git.resolveRef({ fs, dir: repoDir, ref: 'HEAD' });
        return {
           success: true,
           commitId: headSha, // Return the existing HEAD commit ID
           message: 'No changes detected',
           date: new Date(),
           noChanges: true // Flag indicating no new commit was made
        };
     }
    logger.error('Error committing change', { error: error.message, appId }, 'versionControl');
    return {
      success: false,
      error: `Error committing change: ${error.message}`
    };
  }
}

/**
 * Get commit history for an app
 * @param {string} appId - The app ID
 * @returns {Promise<Object>} - Result object with commits
 */
export async function getCommitHistory(appId) {
  try {
    const repoDir = path.join(gitBasePath, appId);
    
    // Get log
    const commits = await git.log({
      fs,
      dir: repoDir,
      depth: 50 // Limit to recent commits for performance
    });
    
    return { 
      success: true, 
      commits
    };
  } catch (error) {
     // If the repo doesn't exist or has no commits yet, return empty history
     if (error.code === 'NotFoundError' || error.code === 'ResolveRefError') {
        logger.warn('No commit history found for app', { appId }, 'versionControl');
        return { success: true, commits: [] };
     }
    logger.error('Error getting commit history', { error: error.message, appId }, 'versionControl');
    return {
      success: false,
      error: `Error getting commit history: ${error.message}`,
      commits: []
    };
  }
}

/**
 * Restore a specific version
 * @param {string} appId - The app ID
 * @param {string} commitId - The commit ID to restore
 * @param {string} originalFilePath - The original app file path to update
 * @returns {Promise<Object>} - Result object with content
 */
export async function restoreVersion(appId, commitId, originalFilePath) {
  try {
    const repoDir = path.join(gitBasePath, appId);
    const repoFilePath = path.join(repoDir, 'index.html');
    
    // Checkout file at commit
    // Note: `checkout` modifies the working directory file, it doesn't just return content.
    await git.checkout({
      fs,
      dir: repoDir,
      ref: commitId,
      force: true, // Force checkout even if working dir is dirty (it shouldn't be in this flow)
      filepaths: ['index.html'] // Specify the file to checkout
    });
    
    // Read the content from the checked-out file in the repo
    const content = await fs.readFile(repoFilePath, 'utf-8');
    
    // Also update the original file path used by the miniAppManager
    if (originalFilePath) {
      try {
        await fs.writeFile(originalFilePath, content);
        logger.info('Restored version and updated original file', { appId, commitId }, 'versionControl');
      } catch (writeError) {
         logger.error('Error writing restored content to original file path', { error: writeError.message, appId, originalFilePath }, 'versionControl');
         // Proceed even if writing to original path fails, the repo is restored.
      }
    } else {
       logger.warn('Original file path not provided for restoreVersion', { appId }, 'versionControl');
    }
    
    return { 
      success: true, 
      content, // Return the restored content
      commitId
    };
  } catch (error) {
    logger.error('Error restoring version', { error: error.message, appId, commitId }, 'versionControl');
    return {
      success: false,
      error: `Error restoring version: ${error.message}`
    };
  }
}