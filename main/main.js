const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron');
const path = require('path');
const Datastore = require('nedb-promises');
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
  db.hits = Datastore.create({
    filename: path.join(__dirname, 'db', 'hits.db'),
    timestampData: true,
    autoload: true,
  });
  db.assts = Datastore.create({
    filename: path.join(__dirname, 'db', 'assts.db'),
    timestampData: true,
    autoload: true,
  });
  db.workers = Datastore.create({
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

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// define the database "API" here using ipc listeners
// Send aws credentials
ipcMain.handle('getCredentials', async (ev) => awsCredentials);
// ipcMain.on('getCredentials', () => {
//   mainWindow.webContents.send('credentials', awsCredentials);
// });

// Count records in each db
ipcMain.handle('countDocs', async (ev) => {
  const out = {};
  for (const dbName in db) {
    try {
      out[dbName] = await db[dbName].count({});
    } catch (err) {
      console.error(err);
    }
  }
  return out;
});

// Add HIT to db after it's created in mturk
ipcMain.handle('insertHIT', async (ev, hit) => {
  let text;
  let type;
  try {
    await db.hits.insert(hit);
    text = 'HIT added successfully';
    type = 'success';
  } catch (err) {
    console.error(err);
    text = err;
    type = 'error';
  }
  return {
    text,
    type,
  };
});

// Export all dbs to JSON
ipcMain.handle('export', async () => {
  let text;
  let type;
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Export Database',
      defaultPath: `${app.getPath('home')}/Desktop/`,
      buttonLabel: 'Save',
      message: 'Where do you want to save the exported databases?',
      showsTagField: false,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (!result.canceled) {
      for (const dbName in db) {
        let docs = await db[dbName].find({}).sort({ createdAt: -1 });
        let writePath = path.join(result.filePaths[0], `${dbName}.json`);
        let saveResult = await fs.promises.writeFile(writePath, JSON.stringify(docs));
      }
      text = 'Export succesful!';
      type = 'success';
    } else {
      text = 'Export cancelled';
      type = 'notification';
    }
  } catch (err) {
    console.error(err);
    text = err;
    type = 'error';
  }
  return {
    text,
    type,
  };
});
