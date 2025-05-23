import { app, BrowserWindow } from 'electron';

// Track progress window
let progressWindow = null;

/**
 * Create and show update progress window
 */
function createProgressWindow() {
  if (progressWindow) {
    return progressWindow;
  }

  progressWindow = new BrowserWindow({
    width: 400,
    height: 200,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    alwaysOnTop: true,
    center: true,
    title: 'Downloading Update',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Create HTML content for the progress window
  const progressHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 160px;
        }
        .container {
          text-align: center;
          width: 100%;
        }
        .title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #333;
        }
        .progress-container {
          width: 100%;
          background-color: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 15px;
        }
        .progress-bar {
          height: 20px;
          background: linear-gradient(90deg, #007AFF, #5AC8FA);
          width: 0%;
          transition: width 0.3s ease;
          border-radius: 10px;
        }
        .progress-text {
          font-size: 14px;
          color: #666;
          margin-top: 10px;
        }
        .status-text {
          font-size: 12px;
          color: #888;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="title">Downloading Update</div>
        <div class="progress-container">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        <div class="progress-text" id="progressText">0%</div>
        <div class="status-text" id="statusText">Preparing download...</div>
      </div>
    </body>
    </html>
  `;

  progressWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(progressHTML)}`);

  progressWindow.on('closed', () => {
    progressWindow = null;
    app.quit();
  });

  return progressWindow;
}

/**
 * Update progress window with current download progress
 */
function updateProgress(percent, bytesPerSecond, total, transferred) {
  if (!progressWindow) return;

  const progressBar = `document.getElementById('progressBar').style.width = '${percent}%'`;
  const progressText = `document.getElementById('progressText').textContent = '${percent.toFixed(1)}%'`;
  
  let statusText = `Downloading...`;
  if (bytesPerSecond && total) {
    const speedMB = (bytesPerSecond / 1024 / 1024).toFixed(1);
    const totalMB = (total / 1024 / 1024).toFixed(1);
    const transferredMB = (transferred / 1024 / 1024).toFixed(1);
    statusText = `${transferredMB}MB / ${totalMB}MB (${speedMB} MB/s)`;
  }
  const statusUpdate = `document.getElementById('statusText').textContent = '${statusText}'`;

  progressWindow.webContents.executeJavaScript(`
    ${progressBar};
    ${progressText};
    ${statusUpdate};
  `).catch(err => {
    console.error('Error updating progress window:', err);
  });
}

/**
 * Simulate download progress
 */
function simulateDownload() {
  const totalSize = 98 * 1024 * 1024; // 98MB
  let transferred = 0;
  let percent = 0;
  
  const interval = setInterval(() => {
    // Simulate variable download speed
    const speed = (2 + Math.random() * 8) * 1024 * 1024; // 2-10 MB/s
    const increment = speed * 0.1; // Update every 100ms
    
    transferred += increment;
    percent = (transferred / totalSize) * 100;
    
    if (percent >= 100) {
      percent = 100;
      transferred = totalSize;
      clearInterval(interval);
      
      // Show completion
      updateProgress(percent, speed, totalSize, transferred);
      
      // Close after 2 seconds
      setTimeout(() => {
        if (progressWindow) {
          progressWindow.close();
        }
      }, 2000);
    } else {
      updateProgress(percent, speed, totalSize, transferred);
    }
  }, 100);
}

app.whenReady().then(() => {
  console.log('Creating progress window demo...');
  createProgressWindow();
  
  // Start simulation after window is ready
  setTimeout(() => {
    simulateDownload();
  }, 1000);
});

app.on('window-all-closed', () => {
  app.quit();
});
