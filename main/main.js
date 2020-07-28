const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron');
const path = require('path');
const Datastore = require('nedb');
const fs = require('fs');

// Hot reload just the renderer (i.e. svelte changes)
// Changes to this file require restarting the electron process
require('electron-reload')(path.join(__dirname, '..', 'renderer'));

nativeTheme.themeSource = 'light';
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

// create a global reference to the window object
let mainWindow;
// Create a object to hold all the dbs for easier referencing
const db = {};
// try to load aws credentials
let awsCredentials = {
  accessKeyId: process.env.AWS_SECRET_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_KEY_ID,
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // create or load existing databases
  db.hits = new Datastore({
    filename: path.join(__dirname, 'db', 'hits.db'),
    timestampData: true,
    autoload: true,
  });
  db.assts = new Datastore({
    filename: path.join(__dirname, 'db', 'assts.db'),
    timestampData: true,
    autoload: true,
  });
  db.workers = new Datastore({
    filename: path.join(__dirname, 'db', 'workers.db'),
    timestampData: true,
    autoload: true,
  });

  if (awsCredentials.accessKeyId && awsCredentials.secretAccessKey) {
    console.log('AWS credentials loaded from environment variables!');
    console.log(awsCredentials);
  } else {
    fs.readFile(`${app.getPath('home')}/.awscredentials.json`, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          dialog
            .showMessageBox({
              type: 'error',
              title: 'File not found',
              message:
                'No environment variables or config file were found for your AWS Credentials! Please configure them and restart the app',
            })
            .then(() => {
              app.exit(0);
              process.abort();
            });
        } else {
          throw err;
        }
      } else {
        awsCredentials = JSON.parse(data);
        console.log('AWS credentials loaded from file!');
        console.log(awsCredentials);
      }
    });
  }
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
// Send aws credentials
ipcMain.on('getCredentials', () => {
  mainWindow.webContents.send('credentials', awsCredentials);
});

// Count records in each db
ipcMain.on('countDocs', () => {
  const out = {};
  for (const dbName in db) {
    // eslint-disable-next-line
    db[dbName].count({}, (err, count) => {
      if (err) {
        mainWindow.webContents.send('countedDocs', err);
      } else {
        out[dbName] = count;
      }
    });
  }
  mainWindow.webContents.send('countedDocs', out);
});

// send all documents to client
ipcMain.on('findAll', (dbName) => {
  db[dbName]
    .find({})
    .sort({ createdAt: -1 })
    .exec((err, docs) => {
      mainWindow.webContents.send('foundAll', docs);
    });
});

// TODO: package all databases together
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
ipcMain.on('insert', (dbName, item) => {
  db[dbName].insert(item, (err) => {
    if (err) throw new Error(err);
  });
  mainWindow.webContents.send('inserted', item);
});
