// Import any required modules
import { formatDate } from '../components/core/utils.js';

// DOM elements
const appNameElement = document.querySelector('#app-name span');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const versionList = document.getElementById('version-list');

// State variables
let appId = null;
let appName = null;
let isProcessing = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  // Get app details from query params or IPC
  window.electronAPI.onInitAppIteration((event, data) => {
    appId = data.appId;
    appName = data.appName;
    // appFilePath = data.filePath; // Removed unused variable
    // currentHtml = data.html; // Removed unused variable
    
    // Set app name in header
    appNameElement.textContent = appName;
    
    // Load version history
    loadVersionHistory();
  });
  
  // Set up event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Send button click
  sendButton.addEventListener('click', sendMessage);
  
  // Enter key to send
  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
  
  // Listen for version update events
  window.electronAPI.onVersionCreated((event, versionData) => {
    addVersionToList(versionData);
  });
  
  // Listen for iteration response events
  window.electronAPI.onIterationResponse((event, data) => {
    addAiMessage(data.message);
    isProcessing = false;
    
    if (data.success) {
      // Update UI to indicate changes were applied
      addSystemMessage('Changes applied successfully and saved as a new version');
      // Add the new version to the list
      addVersionToList({
        id: data.commitId,
        message: `Iteration: ${messageInput.value.substring(0, 40)}...`, // Use the prompt for message
        date: new Date()
      });
    }
  });
}

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || isProcessing) return;
  
  // Add user message to chat
  addUserMessage(message);
  
  // Store the message before clearing input
  const userPrompt = message;
  
  // Clear input
  messageInput.value = '';
  
  // Set processing state
  isProcessing = true;
  
  // Add a thinking message
  const thinkingMessage = addSystemMessage('Applying changes...');
  
  try {
    // Send to main process for processing
    const result = await window.electronAPI.iterateOnMiniApp({
      appId,
      prompt: userPrompt // Use the stored prompt
    });
    
    // Remove thinking message
    chatMessages.removeChild(thinkingMessage);
    
    if (!result.success) {
      addSystemMessage(`Error: ${result.error}`);
      isProcessing = false;
    }
  } catch (error) {
    // Remove thinking message
    if (thinkingMessage.parentNode === chatMessages) {
      chatMessages.removeChild(thinkingMessage);
    }
    
    // Show error
    addSystemMessage(`Error: ${error.message}`);
    isProcessing = false;
  }
}

function addUserMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.className = 'message user-message';
  messageEl.textContent = text;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addAiMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.className = 'message ai-message';
  messageEl.textContent = text;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.className = 'system-message';
  messageEl.textContent = text;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return messageEl;
}

async function loadVersionHistory() {
  try {
    const versions = await window.electronAPI.getVersionHistory({
      appId
    });
    
    if (versions.success) {
      // Clear current list
      versionList.innerHTML = '';
      
      // Add each version
      versions.commits.forEach((commit, index) => {
        const versionData = {
          id: commit.oid,
          message: commit.commit.message,
          date: new Date(commit.commit.author.timestamp * 1000)
        };
        addVersionToList(versionData, index === 0); // Mark the first one (latest) as active initially
      });
    }
  } catch (error) {
    console.error('Error loading version history:', error);
  }
}

function addVersionToList(version, isActive = false) {
  const versionEl = document.createElement('div');
  versionEl.className = 'version-item';
  if (isActive) {
    versionEl.classList.add('active');
  }
  versionEl.dataset.id = version.id;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'version-message';
  messageEl.textContent = version.message;
  
  const dateEl = document.createElement('div');
  dateEl.className = 'version-date';
  dateEl.textContent = formatDate(version.date);
  
  versionEl.appendChild(messageEl);
  versionEl.appendChild(dateEl);
  
  // Add click event to restore version
  versionEl.addEventListener('click', () => restoreVersion(version.id));
  
  // Add to list (at beginning)
  if (versionList.firstChild) {
    versionList.insertBefore(versionEl, versionList.firstChild);
  } else {
    versionList.appendChild(versionEl);
  }
  
  // If this is a new version, mark it as active and others inactive
  if (!isActive && versionList.children.length > 1) {
     const versionItems = versionList.querySelectorAll('.version-item');
     versionItems.forEach(item => item.classList.remove('active'));
     versionEl.classList.add('active');
  }
}

async function restoreVersion(versionId) {
  try {
    // Confirm with user
    if (!confirm('Are you sure you want to restore this version? Any unsaved changes will be lost.')) {
      return;
    }
    
    // Add system message
    addSystemMessage('Restoring previous version...');
    
    // Call API to restore
    const result = await window.electronAPI.restoreVersion({
      appId,
      commitId: versionId
    });
    
    if (result.success) {
      addSystemMessage('Version restored successfully');
      
      // Update version list UI to show active version
      const versionItems = versionList.querySelectorAll('.version-item');
      versionItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === versionId) {
          item.classList.add('active');
        }
      });
    } else {
      addSystemMessage(`Error restoring version: ${result.error}`);
    }
  } catch (error) {
    addSystemMessage(`Error: ${error.message}`);
  }
}