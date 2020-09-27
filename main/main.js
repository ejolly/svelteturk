const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron');
const path = require('path');
const Datastore = require('nedb-promises');
const fs = require('fs');
const Papa = require('papaparse');
const log = require('electron-log');


// Hot reload just the renderer (i.e. svelte changes)
// Changes to this file require restarting the electron process
require('electron-reload')(path.join(__dirname, '..', 'renderer'));

nativeTheme.themeSource = 'light';

// Setup logging
log.transports.file.resolvePath = (() => path.join(app.getPath('home'), '.svelte-turk.log'));
// Configure the logger to display an electron dialog box with an option to submit an issue on any uncaught errors
log.catchErrors({
  showDialog: false,
  onError(error, versions, submitIssue) {
    dialog.showMessageBox({
      title: 'An error occurred',
      message: error.message,
      detail: error.stack,
      type: 'error',
      buttons: ['Ignore', 'Report', 'Exit'],
    })
      .then((result) => {
        if (result.response === 1) {
          submitIssue('https://github.com/ejolly/svelte-turk/issues/new', {
            title: `Error report for ${versions.app}`,
            body: 'Error:\n```' + error.stack + '\n```\n' + `OS: ${versions.os}`
          });
          return;
        }

        if (result.response === 2) {
          app.quit();
        }
      });
  }
});
// Scope main process logs so that 'main' appears in the log file next to messages
const mainLog = log.scope('main');

mainLog.info('NEW MAIN STARTUP');

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
    minWidth: 1090,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
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
  db.hitTemplates = Datastore.create({
    filename: path.join(__dirname, 'db', 'hitTemplates.db'),
    timestampData: true,
    autoload: true,
  });

  mainLog.info('Databases initialized');

  if (awsCredentials.accessKeyId && awsCredentials.secretAccessKey) {
    mainLog.info('AWS credentials loaded from environment variables.');
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
              mainLog.error('No environment variables or config file found for AWS credentials. Exiting...');
              app.exit(0);
              process.abort();
            });
        } else {
          throw err;
        }
      } else {
        awsCredentials = JSON.parse(data);
        mainLog.info('AWS credentials loaded from file!');
      }
    });
  }
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Only show the window once it's ready
  mainWindow.once('ready-to-show', () => mainWindow.show());
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
      buttonLabel: 'Export',
      message: "Where do you want to save the exported databases?\n(files will be auto-named with today's date)",
      showsTagField: false,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (!result.canceled) {
      const ts = new Date();
      const day = ts.getDate();
      let month = ts.getMonth() + 1;
      month = month < 10 ? `0${month}` : `${month}`;
      const year = ts.getFullYear();
      const date = `${year}-${month}-${day}`;
      for (const dbName in db) {
        const docs = await db[dbName].find({}).sort({ createdAt: -1 });
        const writePath = path.join(result.filePaths[0], `${dbName}_${date}.json`);
        // TODO: use option to export importable db file or json
        await fs.promises.writeFile(writePath, JSON.stringify(docs));
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

// Export selected Assignements to JSON for bonusing
ipcMain.handle('exportAsstsForBonus', async (ev, assts) => {
  let text;
  let type;
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Export Assignments for Bonus',
      defaultPath: `${app.getPath('home')}/Desktop/`,
      buttonLabel: 'Save',
      message: 'Where do you want to save the file?',
      showsTagField: false,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (!result.canceled) {
      const writePath = path.join(result.filePaths[0], 'assignments.csv');
      const csv = await Papa.unparse(assts);
      await fs.promises.writeFile(writePath, csv);
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

// Import Assignemts for bonusing
ipcMain.handle('importAsstsForBonus', async () => {
  let text;
  let type;
  let data;
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Export Assignments for Bonus',
      defaultPath: `${app.getPath('home')}/Desktop/`,
      buttonLabel: 'Load',
      message: 'Select assignments file with bonuses',
      showsTagField: false,
      properties: ['openFile'],
    });
    if (!result.canceled) {
      const filePath = path.join(result.filePaths[0]);
      const fileData = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
      const parsed = await Papa.parse(fileData, { header: true });
      data = parsed.data;
      text = 'Import succesful!';
      type = 'success';
    } else {
      text = 'Import cancelled';
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
    data,
  };
});

// Delete a doc in any db
ipcMain.handle('deleteDoc', async (ev, dbName, id) => {
  let text;
  let type;
  try {
    const numRemoved = await db[dbName].remove({ _id: id }, { multi: false });
    if (numRemoved) {
      text = 'Deleted successfully';
      type = 'success';
    } else {
      text = 'Document not found';
      type = 'erorr';
    }
  } catch (err) {
    console.error(err);
    text = err;
    type = 'error';
  }
  return { text, type };
});

// Update a doc in any db
ipcMain.handle('updateDoc', async (ev, dbName, query, update, options) => {
  let text;
  let type;
  try {
    const numAffected = await db[dbName].update(query, update, options);
    if (numAffected) {
      text = 'Updated successfully';
      type = 'success';
    } else {
      text = 'Document not found';
      type = 'erorr';
    }
  } catch (err) {
    console.error(err);
    text = err;
    type = 'error';
  }
  return { text, type };
});
// Return all hits
ipcMain.handle('findHits', async (ev) => {
  const docs = await db.hits.find({}).sort({ createdAt: -1 });
  return docs;
});

// Return all assts
ipcMain.handle('findAssts', async (ev) => {
  const docs = await db.assts.find({}).sort({ createdAt: -1 });
  return docs;
});

// Return assts for a specific HIT
ipcMain.handle('findAsstsForHIT', async (ev, HITId) => {
  const docs = await db.assts.find({ HITId }).sort({ createdAt: -1 });
  return docs;
});

// Return all workers
ipcMain.handle('findWorkers', async (ev) => {
  const docs = await db.workers.find({}).sort({ createdAt: -1 });
  return docs;
});

// Manage hit templates
// TODO: refactor
ipcMain.handle('findHITTemplates', async (ev) => {
  const docs = await db.hitTemplates.find({}).sort({ name: 1 });
  return docs;
});

ipcMain.handle('saveHITTemplate', async (ev, template) => {
  let text;
  let type;
  try {
    await db.hitTemplates.insert(template);
    text = 'Template saved successfully';
    type = 'success';
  } catch (err) {
    console.error(err);
    text = err;
    type = 'error';
  }
  return {
    text,
    type
  };
});

ipcMain.handle('deleteHITTemplate', async (ev, name) => {
  let text;
  let type;
  try {
    const numRemoved = await db.hitTemplates.remove({ name }, { multi: false });
    if (numRemoved) {
      text = 'Deleted successfully';
      type = 'success';
    } else {
      text = 'Document not found';
      type = 'erorr';
    }
  } catch (err) {
    console.error(err);
    text = err;
    type = 'error';
  }
  return { text, type };
});
