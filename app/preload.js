const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api',
{
   openFileDialog: () => {
      return ipcRenderer.invoke('open-file');
   },
   readFile: (path) => {
      return ipcRenderer.invoke('read-file', path);
   }
});