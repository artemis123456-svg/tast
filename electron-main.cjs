/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

// Create logs directory in AppData for Windows Support and debugging
const userDataPath = app.getPath('userData');
process.env.TAST_TPV_DATA_DIR = userDataPath;

const logDir = path.join(userDataPath, 'Logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'tpv-desktop.log');

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${message}\n`;
  console.log(logMsg.trim());
  fs.appendFileSync(logFile, logMsg, 'utf-8');
}

logToFile('Iniciando TPV Desktop...');

// Start local Express server as a child process (or fallback direct require)
function startLocalServer() {
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');
  logToFile(`Buscando servidor Express en: ${serverPath}`);

  if (fs.existsSync(serverPath)) {
    try {
      // Set production flags and override default paths
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.TAST_TPV_DATA_DIR = userDataPath;
      logToFile(`Estableciendo directorio de datos TAST_TPV_DATA_DIR en: ${userDataPath}`);
      
      // Use fork to isolate the Node server and avoid blocking the Electron main thread
      serverProcess = fork(serverPath, [], {
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      });

      serverProcess.stdout.on('data', (data) => {
        logToFile(`[Express STDOUT]: ${data.toString().trim()}`);
      });

      serverProcess.stderr.on('data', (data) => {
        logToFile(`[Express STDERR]: ${data.toString().trim()}`);
      });

      serverProcess.on('error', (err) => {
        logToFile(`[Express Error]: ${err.message}`);
      });

      serverProcess.on('exit', (code) => {
        logToFile(`[Express] Servidor finalizado con código: ${code}`);
      });

      logToFile('Proceso de servidor Express levantado mediante Fork exitosamente.');
    } catch (e) {
      logToFile(`Error al levantar servidor mediante fork: ${e.message}. Probando fallback directo.`);
      try {
        require(serverPath);
      } catch (err2) {
        logToFile(`Error crítico en fallback directo: ${err2.message}`);
      }
    }
  } else {
    logToFile('ADVERTENCIA: No se encontró dist/server.cjs. Asegúrese de compilar la aplicación con "npm run build" antes de empaquetar.');
  }
}

function createWindow() {
  // Detect screen resolution automatically
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  logToFile(`Resolución de pantalla detectada: ${width}x${height}`);

  mainWindow = new BrowserWindow({
    width: Math.min(width, 1440),
    height: Math.min(height, 900),
    fullscreen: true, // Auto-configured full screen for commercial TPV/Kiosks
    frame: false, // Clean frameless look for terminal layout
    kiosk: true, // Locks user into POS mode to prevent unauthorized window exits
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js') // Preload bridge if desktop integrations are needed
    },
    icon: path.join(__dirname, 'public', 'favicon.ico')
  });

  // Load local self-hosted server url (production server runs on port 3000)
  mainWindow.loadURL('http://localhost:3000').catch((err) => {
    logToFile(`Error al cargar URL del TPV: ${err.message}. Re-intentando en 3 segundos...`);
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 3000);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Ensure single instance lock for database consistency
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logToFile('Instancia duplicada detectada. Saliendo de la aplicación.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    startLocalServer();
    
    // Give local server 1.5s to bind to port 3000 before opening window
    setTimeout(createWindow, 1500);
  });
}

app.on('window-all-closed', function () {
  logToFile('Todas las ventanas cerradas. Deteniendo procesos...');
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Autostart configuration command handlers
ipcMain.handle('get-autostart-status', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('set-autostart-status', (event, enable) => {
  logToFile(`Configurando inicio automático con Windows: ${enable}`);
  app.setLoginItemSettings({
    openAtLogin: enable,
    path: app.getPath('exe')
  });
  return true;
});

ipcMain.handle('get-log-file-path', () => {
  return logFile;
});
