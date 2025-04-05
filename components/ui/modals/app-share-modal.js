/**
 * AppShareModal component
 * A self-contained web component for sharing apps via email, social media, and QR codes
 */
// QRCode library will be accessed via preload script
class AppShareModal extends HTMLElement {
  constructor() {
    super();

    // Component state
    this._currentApp = null;
    this._elements = {};

    // Create component structure
    this._createElements();
    this._setupEventListeners();
  }

  /**
   * Lifecycle: Component connected to DOM
   */
  connectedCallback() {
    // Add to DOM if not already added
    if (!this.querySelector('.app-share-modal')) {
      this.appendChild(this._elements.container);
      // Initialize element references after appending to DOM
      this._initializeElementReferences();
    }
    // Attempt to generate QR code if app data is already set when connected
    if (this._currentApp) {
        this._generateQRCode(this._generateShareLink(this._currentApp));
    }
  }

  /**
   * Lifecycle: Component disconnected from DOM
   */
  disconnectedCallback() {
    // Clean up any resources if needed
    // Remove the style element from the head to avoid duplicates if reconnected
    if (this._elements.style && this._elements.style.parentNode) {
      this._elements.style.parentNode.removeChild(this._elements.style);
    }
  }

  /**
   * Create all DOM elements for this component
   * @private
   */
  _createElements() {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      app-share-modal .app-share-modal { /* Scope styles to this component */
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        justify-content: center;
        align-items: center;
      }

      app-share-modal .app-share-modal.visible {
        display: flex;
      }

      app-share-modal .modal-content {
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      }

      app-share-modal .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      app-share-modal .modal-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        color: #4285f4;
      }

      app-share-modal .close-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #5f6368;
        padding: 0;
        line-height: 1;
      }

      app-share-modal .modal-body {
        margin-bottom: 20px;
      }

      app-share-modal .share-methods {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }

      app-share-modal .share-method {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 15px;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
        background-color: #f1f3f4;
      }

      app-share-modal .share-method:hover {
        background-color: #e8eaed;
      }

      app-share-modal .share-method svg {
        width: 30px;
        height: 30px;
        margin-bottom: 10px;
      }

      app-share-modal .share-method-title {
        font-weight: 500;
        margin: 0;
        color: #5f6368;
      }

      app-share-modal .qr-code-container {
        display: flex;
        justify-content: center;
        margin: 20px 0;
      }

      app-share-modal .qr-code-container canvas {
        max-width: 200px;
        max-height: 200px;
        border: 1px solid #eee; /* Add a border for visibility */
      }

      app-share-modal .copy-link-container {
        display: flex;
        margin-top: 15px;
      }

      app-share-modal .copy-link-input {
        flex: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 8px 0 0 8px;
        font-size: 14px;
      }

      app-share-modal .copy-button {
        padding: 10px 15px;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 0 8px 8px 0;
        cursor: pointer;
        font-weight: 500;
      }

      app-share-modal .copy-button:hover {
        background-color: #3367d6;
      }
    `;

    // Create modal container
    const container = document.createElement('div');
    container.className = 'app-share-modal';

    // Create modal content
    container.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Share App: <span class="share-app-name"></span></h2>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="share-methods">
            <div class="share-method" data-share-method="email">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5f6368">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <p class="share-method-title">Email</p>
            </div>
            <div class="share-method" data-share-method="twitter">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1DA1F2">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
              </svg>
              <p class="share-method-title">Twitter</p>
            </div>
            <div class="share-method" data-share-method="facebook">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4267B2">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
              </svg>
              <p class="share-method-title">Facebook</p>
            </div>
            <div class="share-method" data-share-method="linkedin">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0077B5">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              <p class="share-method-title">LinkedIn</p>
            </div>
          </div>

          <div class="qr-code-container">
            <canvas class="share-qr-code"></canvas>
          </div>

          <div class="copy-link-container">
            <input type="text" class="share-link" readonly>
            <button class="copy-button">Copy</button>
          </div>
        </div>
      </div>
    `;

    // Store elements for later access
    this._elements = {
      style: styleEl,
      container,
      appName: null,      // Will be set after appending to DOM
      qrCodeCanvas: null, // Will be set after appending to DOM
      shareLinkInput: null, // Will be set after appending to DOM
      copyButton: null    // Will be set after appending to DOM
    };

    // Append style to document head (or component root if preferred)
    document.head.appendChild(styleEl);
  }

  /**
   * Initialize references to DOM elements after appending to DOM
   * @private
   */
  _initializeElementReferences() {
    this._elements.appName = this.querySelector('.share-app-name');
    this._elements.qrCodeCanvas = this.querySelector('.share-qr-code');
    this._elements.shareLinkInput = this.querySelector('.share-link');
    this._elements.copyButton = this.querySelector('.copy-button');
  }

  /**
   * Setup event listeners for component
   * @private
   */
  _setupEventListeners() {
    // Use event delegation for modal events
    this._elements.container.addEventListener('click', (event) => {
      // Close when clicking outside modal content
      if (event.target === this._elements.container) {
        this.close();
      }

      // Close button
      const closeButton = event.target.closest('.close-button');
      if (closeButton) {
        this.close();
      }

      // Share method buttons
      const shareMethodButton = event.target.closest('.share-method');
      if (shareMethodButton) {
        const method = shareMethodButton.dataset.shareMethod;
        if (method === 'email') {
          this._handleEmailShare();
        } else if (['twitter', 'facebook', 'linkedin'].includes(method)) {
          this._handleSocialMediaShare(method);
        }
      }

      // Copy button
      const copyButton = event.target.closest('.copy-button');
      if (copyButton) {
        this._handleCopyLink();
      }
    });
  }


  /**
   * Set the app to share
   * @param {Object} app - App data object
   */
  setApp(app) {
    this._currentApp = app;

    // Ensure element references are initialized
    if (!this._elements.appName) {
      this._initializeElementReferences();
    }

    // Check if elements exist before updating
    if (!this._elements.appName || !this._elements.shareLinkInput) {
        console.error('Share modal elements not found. Cannot set app details.');
        return;
    }

    // Update UI
    this._elements.appName.textContent = app.name || 'Unknown App';

    // Generate share link
    const shareLink = this._generateShareLink(app);
    this._elements.shareLinkInput.value = shareLink;

    // Generate QR code if the library is loaded
    this._generateQRCode(shareLink);
  }

  /**
   * Generate a share link for the app
   * @param {Object} app - App data object
   * @returns {string} - Share link
   * @private
   */
  _generateShareLink(app) {
    // This is a placeholder. In a real implementation, this would generate a proper sharing URL
    // For example, it might link to a web page where others can download the app
    // Using a simple placeholder for now.
    return `lahat://share/${app.id || 'unknown'}`; // Example custom protocol link
  }

  /**
   * Generate QR code for the current share link
   * @param {string} shareLink - The share link to encode
   * @private
   */
  _generateQRCode(shareLink) {
    // Check if the canvas element exists
    if (!this._elements.qrCodeCanvas) {
        console.error('QR code canvas element not found.');
        return;
    }

    try {
      // Clear previous QR code by removing the canvas and creating a new one
      // Ensure the container exists before manipulating it
      const qrContainer = this._elements.qrCodeCanvas.parentNode;
      if (!qrContainer) {
          console.error('QR code container not found.');
          return;
      }
      // Clear previous QR code by removing the canvas and creating a new one
      qrContainer.removeChild(this._elements.qrCodeCanvas);
      const newCanvas = document.createElement('canvas');
      newCanvas.className = 'share-qr-code'; // Keep the class
      qrContainer.appendChild(newCanvas);
      this._elements.qrCodeCanvas = newCanvas; // Update reference

      // Generate QR code using the function exposed via preload script
      window.electronAPI.generateQRCodeToCanvas(
        this._elements.qrCodeCanvas,
        shareLink,
        {
          width: 200,
          margin: 1,
          errorCorrectionLevel: 'H'
        }
      ).then(result => {
        if (result.success) {
          console.log('QR code generated successfully via preload.');
        } else {
          console.error('Error generating QR code via preload:', result.error);
          // Display error message in place of the canvas
          if (this._elements.qrCodeCanvas && this._elements.qrCodeCanvas.parentNode) {
              this._elements.qrCodeCanvas.outerHTML = `<p style="color: red; text-align: center;">Error: ${result.error || 'Could not generate QR code'}</p>`;
          }
        }
      }).catch(error => {
          // Catch potential errors from the invoke itself
          console.error('Error calling generateQRCodeToCanvas:', error);
          if (this._elements.qrCodeCanvas && this._elements.qrCodeCanvas.parentNode) {
              this._elements.qrCodeCanvas.outerHTML = '<p style="color: red; text-align: center;">IPC Error generating QR code</p>';
          }
      });

    } catch (error) {
      // Catch synchronous errors (e.g., if canvas element is invalid before calling API)
      console.error('Error preparing QR code generation:', error);
      if (this._elements.qrCodeCanvas && this._elements.qrCodeCanvas.parentNode) {
          this._elements.qrCodeCanvas.outerHTML = '<p style="color: red; text-align: center;">Setup Error generating QR code</p>';
      }
    }
  }


  /**
   * Open the modal
   */
  open() {
    this._elements.container.classList.add('visible');
    this._dispatchCustomEvent('modal-opened');
  }

  /**
   * Close the modal
   */
  close() {
    this._elements.container.classList.remove('visible');
    this._dispatchCustomEvent('modal-closed');
  }

  /**
   * Handle email sharing
   * @private
   */
  _handleEmailShare() {
    if (!this._currentApp || !this._elements.shareLinkInput) return;

    try {
      const subject = encodeURIComponent(`Check out this Lahat app: ${this._currentApp.name}`);
      const body = encodeURIComponent(`I wanted to share this Lahat app with you: ${this._currentApp.name}\n\nYou can check it out here: ${this._elements.shareLinkInput.value}`);

      // Create mailto link
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;

      // Open default email client
      window.open(mailtoLink);
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert(`Failed to share via email: ${error.message}`);
    }
  }

  /**
   * Handle social media sharing
   * @param {string} platform - Social media platform (twitter, facebook, linkedin)
   * @private
   */
  _handleSocialMediaShare(platform) {
    if (!this._currentApp || !this._elements.shareLinkInput) return;

    try {
      const shareText = encodeURIComponent(`Check out this Lahat app: ${this._currentApp.name}`);
      const shareUrl = encodeURIComponent(this._elements.shareLinkInput.value);

      let shareLink;

      switch (platform) {
        case 'twitter':
          shareLink = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
          break;
        case 'facebook':
          // Facebook requires a publicly accessible URL for the 'u' parameter.
          // If the shareUrl is a custom protocol, this might not work as expected.
          // Consider sharing a link to a landing page instead.
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
          break;
        case 'linkedin':
          // LinkedIn also requires a publicly accessible URL.
          shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Open platform sharing dialog
      window.open(shareLink, '_blank', 'width=600,height=400,noopener,noreferrer');
    } catch (error) {
      console.error(`Error sharing via ${platform}:`, error);
      alert(`Failed to share via ${platform}: ${error.message}`);
    }
  }

  /**
   * Handle copying share link to clipboard
   * @private
   */
  _handleCopyLink() {
    if (!this._elements.shareLinkInput || !this._elements.shareLinkInput.value) return;

    try {
      // Use Clipboard API if available (more modern and secure)
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(this._elements.shareLinkInput.value).then(() => {
          this._showCopyFeedback();
        }).catch(err => {
          console.error('Failed to copy using Clipboard API:', err);
          this._fallbackCopy(); // Fallback to execCommand
        });
      } else {
        this._fallbackCopy(); // Fallback for older browsers or insecure contexts
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert(`Failed to copy: ${error.message}`);
    }
  }

  /**
   * Fallback copy method using execCommand
   * @private
   */
  _fallbackCopy() {
      const input = this._elements.shareLinkInput;
      const isiOSDevice = navigator.userAgent.match(/ipad|iphone/i);

      if (isiOSDevice) {
        // Handling for iOS devices
        const editable = input.contentEditable;
        const readOnly = input.readOnly;
        input.contentEditable = true;
        input.readOnly = false;
        const range = document.createRange();
        range.selectNodeContents(input);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        input.setSelectionRange(0, 999999);
        input.contentEditable = editable;
        input.readOnly = readOnly;
      } else {
        // Standard fallback
        input.select();
      }

      try {
          const successful = document.execCommand('copy');
          if (successful) {
              this._showCopyFeedback();
          } else {
              throw new Error('document.execCommand("copy") failed');
          }
      } catch (err) {
          console.error('Fallback copy failed:', err);
          alert('Failed to copy link.');
      }
      // Deselect text
      if (window.getSelection) {
          window.getSelection().removeAllRanges();
      } else if (document.selection) {
          document.selection.empty();
      }
      input.blur(); // Remove focus
  }


  /**
   * Show visual feedback after copying
   * @private
   */
  _showCopyFeedback() {
    const copyButton = this._elements.copyButton;
    if (!copyButton) return;

    const originalText = copyButton.textContent;
    const originalBg = copyButton.style.backgroundColor;

    copyButton.textContent = 'Copied!';
    copyButton.style.backgroundColor = '#4caf50'; // Green feedback color

    // Reset button after 2 seconds
    setTimeout(() => {
      copyButton.textContent = originalText;
      copyButton.style.backgroundColor = originalBg;
    }, 2000);
  }


  /**
   * Dispatch a custom event
   * @param {string} name - Event name
   * @param {Object} detail - Event detail
   * @private
   */
  _dispatchCustomEvent(name, detail = {}) {
    const event = new CustomEvent(name, {
      bubbles: true,
      composed: false, // Set to false as we are not using Shadow DOM
      detail
    });
    this.dispatchEvent(event);
  }
}

// Register the custom element
// Check if already defined to prevent errors during hot-reloading
if (!customElements.get('app-share-modal')) {
  customElements.define('app-share-modal', AppShareModal);
}