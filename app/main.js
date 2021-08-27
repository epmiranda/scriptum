const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { readFileSync } = require('fs');
const path = require('path');

const dev = !app.isPackaged;

let win;

// Create window
app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      devTools: dev,
      preload: path.resolve(__dirname, './preload.js'),
      contextIsolation: true,
    }
  });

  win.setMenuBarVisibility(false);

  if(dev) {
    win.webContents.openDevTools();
  }

  win.loadFile(path.resolve(__dirname, 'index.html'));
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// API
ipcMain.handle('open-file', () => {
  return dialog.showOpenDialog(win, { properties: ['openFile'] });
})

ipcMain.handle('read-file', (events, ...args) => {
  return readFileSync(args[0]);
})