const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron');
const path = require('path');
const Datastore = require('nedb');
const fs = require('fs');

nativeTheme.themeSource = 'light';
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

// create a global referenx to the window object
let mainWindow;
let db;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // create or load existing database
  db = new Datastore({
    filename: './database.db',
    timestampData: true,
    autoload: true,
  });
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// define the database "API" here using ipc listeners
// send all documents to client
ipcMain.on('findAll', () => {
  db.find({})
    .sort({ createdAt: -1 })
    .exec((err, docs) => {
      mainWindow.webContents.send('foundAll', docs);
    });
});

// export db to JSON
ipcMain.on('export', () => {
  db.find({})
    .sort({ createdAt: -1 })
    .exec((err, docs) => {
      if (err) throw new Error(err);
      dialog
        .showSaveDialog(mainWindow, {
          title: 'Export Database',
          defaultPath: `${app.getPath('home')}/Desktop/svelte-turk-export.json`,
          buttonLabel: 'Save',
          message: 'Where do you want to save the exported file?',
          showsTagField: false,
          properties: ['createDirectory', 'showOverwriteConfirmation'],
        })
        .then((result) => {
          if (result.filePath) {
            const writePath = result.filePath.endsWith('.json')
              ? result.filePath
              : `${result.filePath}.json`;
            fs.writeFile(writePath, JSON.stringify(docs), 'utf8', (errt) => {
              if (errt) throw new Error(errt);
              console.log('Database exported to database_export.json');
            });
          } else {
            console.log('Save dialog cancelled');
          }
        });
    });
  mainWindow.webContents.send('exported');
});

// Insert document
ipcMain.on('insert', (e, item) => {
  db.insert(item, (err) => {
    if (err) throw new Error(err);
  });
  mainWindow.webContents.send('inserted', item);
});

// Delete all docs in db; really only for testing
ipcMain.on('clearAll', () => {
  db.remove({}, { multi: true }, (err) => {
    if (err) throw new Error(err);
    mainWindow.webContents.send('clearedAll');
  });
});
