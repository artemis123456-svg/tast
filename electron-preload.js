/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, selected native functions to the client-side React App
contextBridge.exposeInMainWorld('electronAPI', {
  getAutostartStatus: () => ipcRenderer.invoke('get-autostart-status'),
  setAutostartStatus: (enable) => ipcRenderer.invoke('set-autostart-status', enable),
  getLogFilePath: () => ipcRenderer.invoke('get-log-file-path'),
  isDesktop: true
});
