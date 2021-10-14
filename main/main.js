const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron');
const path = require('path');
const Datastore = require('nedb-promises');
const fs = require('fs');
const Papa = require('papaparse');
const log = require('electron-log');
const isDev = require('electron-is-dev');
const fetch = require('node-fetch');
const downloadRelease = require('download-github-release');

if (isDev) {
  console.log('Running in dev mode...hot-reloading enabled');
  require('electron-reload')(path.join(__dirname, '..', 'renderer'));
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

nativeTheme.themeSource = 'light';

// BASE APP DATA PATH: Set the base app data path to a hidden folder in the user's home
const svelteturkPath = path.join(app.getPath('home'), 'svelteturk');
if (!fs.existsSync(svelteturkPath)) {
  fs.mkdirSync(svelteturkPath);
}

// SETUP LOGGING
log.transports.file.resolvePath = () => path.join(svelteturkPath, '.svelteturk.log');
// Configure the logger to display an electron dialog box with an option to submit an issue on any uncaught errors
log.catchErrors({
  showDialog: false,
  onError(error, versions, submitIssue) {
    dialog
      .showMessageBox({
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
            body: `Error:\n\`\`\`${error.stack}\n\`\`\`\n OS: ${versions.os}`,
          });
          return;
        }

        if (result.response === 2) {
          app.quit();
        }
      });
  },
});
// Scope main process logs so that 'main' appears in the log file next to messages
const mainLog = log.scope('main');

// INIT VARIABLES
// create a global reference to the window object
let mainWindow;

// try to load aws credentials
let awsCredentials;

// LOAD AWS CREDENTIALS
const loadAWS = () => {
  awsCredentials = {
    accessKeyId: process.env.AWS_SECRET_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_KEY_ID,
  };
  if (awsCredentials.accessKeyId && awsCredentials.secretAccessKey) {
    mainLog.info('AWS credentials loaded from environment variables.');
  } else {
    fs.readFile(`${app.getPath('home')}/.awscredentials.json`, (err, data) => {
      if (err) {
        mainLog.error('AWS credentials not configured');
        dialog
          .showMessageBox({
            type: 'error',
            title: 'No AWS Credentials',
            message:
              "Hmm I can't seem to find your AWS credentials. Are you sure you configured them? See the directions: https://eshinjolly.com/svelteturk/#/aws-credentials",
          })
          .then(() => {
            mainLog.info('Exiting...');
            app.exit(0);
            process.abort();
          });
      } else {
        awsCredentials = JSON.parse(data);
        mainLog.info('AWS credentials loaded from file');
      }
    });
  }
};

// Settings file location
const settingsFile = path.join(svelteturkPath, '.svelteturkrc');
// Default settings only applied if settings file doesn't exist
let userSettings = {
  refreshFrequency: 30,
  repeatBonuses: false,
  createHITHelpers: true,
};
if (fs.existsSync(settingsFile)) {
  fs.readFile(settingsFile, (err, data) => {
    userSettings = JSON.parse(data);
    mainLog.info('User settings loaded from file');
    if (err) throw err;
  });
} else {
  fs.writeFile(settingsFile, JSON.stringify(userSettings), (writeErr, writeData) => {
    if (writeErr) throw writeErr;
    mainLog.info('User settings file not found...created default');
  });
}

// Databases
// Create a object to hold all the dbs for easier referencing
const dbSandbox = {};
const dbLive = {};
const dbPath = path.join(svelteturkPath, 'db');
if (!fs.existsSync(dbPath)) {
  mainLog.info('No databases found...performing one time setup');
  fs.mkdirSync(dbPath);
}
// Load databases into memory
dbSandbox.hits = Datastore.create({
  filename: path.join(dbPath, 'hits_sandbox.db'),
  timestampData: true,
  autoload: true,
});
dbSandbox.assts = Datastore.create({
  filename: path.join(dbPath, 'assts_sandbox.db'),
  timestampData: true,
  autoload: true,
});
dbSandbox.workers = Datastore.create({
  filename: path.join(dbPath, 'workers_sandbox.db'),
  timestampData: true,
  autoload: true,
});
dbSandbox.hitTemplates = Datastore.create({
  filename: path.join(dbPath, 'hitTemplates_sandbox.db'),
  timestampData: true,
  autoload: true,
});
dbLive.hits = Datastore.create({
  filename: path.join(dbPath, 'hits.db'),
  timestampData: true,
  autoload: true,
});
dbLive.assts = Datastore.create({
  filename: path.join(dbPath, 'assts.db'),
  timestampData: true,
  autoload: true,
});
dbLive.workers = Datastore.create({
  filename: path.join(dbPath, 'workers.db'),
  timestampData: true,
  autoload: true,
});
dbLive.hitTemplates = Datastore.create({
  filename: path.join(dbPath, 'hitTemplates.db'),
  timestampData: true,
  autoload: true,
});

mainLog.info('---SVELTE TURK STARTUP---');
mainLog.info(`---VERSION: ${app.getVersion()}---`);
mainLog.info('Databases initialized');

// Custom update checker because we can't use electron native auto-updating cause the code isn't signed and I'd have to pay for an Apple Developer Account....
let latestRelease;
const userDesktop = path.join(app.getPath('home'), 'Desktop');

// Recrusively delete the unzipped release download
const deleteFolderRecursive = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file, index) => {
      const curPath = `${folderPath}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
};

// Move the .app file from the unzipped release download to the desktop
// then call deleteFolderRecursive
const completeUpdate = () => {
  fs.rename(
    path.join(userDesktop, 'SvelteTurk-darwin-x64', 'SvelteTurk.app'),
    path.join(userDesktop, 'SvelteTurk.app'),
    (err) => {
      if (err) mainLog.error(err);
      deleteFolderRecursive(path.join(userDesktop, 'SvelteTurk-darwin-x64'));
      mainWindow.webContents.send('updateComplete');
      mainLog.info('Update complete');
    }
  );
};

// Actually download the latest release
const getUpdate = () => {
  const filterRelease = (release) => release.tag_name === latestRelease;
  downloadRelease('ejolly', 'svelteturk', userDesktop, filterRelease)
    .then(completeUpdate)
    .catch((err) => console.error(err));
};

// Ask the user if they want to update
const promptForUpdate = async () => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Download', 'Later'],
    title: 'SvelteTurk Update Available',
    message: 'A new version of SvelteTurk is available. Would you like to download it?',
    details: 'The new version will be saved to your Desktop',
  };
  const returnValue = await dialog.showMessageBox(dialogOpts);
  const userAccepted = returnValue.response === 0;
  if (userAccepted) {
    getUpdate();
    mainLog.info('Downloading update...');
  } else {
    mainLog.info('User declined to update');
  }
  return userAccepted;
};

// Check for the latest version against the latest github release
const checkForLatestVersion = async () => {
  // Read from package.json
  const currentVersion = `v${app.getVersion()}`;
  let updateAvailable;
  try {
    const resp = await fetch('https://api.github.com/repos/ejolly/svelteturk/releases/latest');
    const json = await resp.json();
    if (currentVersion !== json.tag_name) {
      mainLog.info(
        `UPDATE AVAILABLE: App version is ${currentVersion}. Update is ${json.tag_name}`
      );
      updateAvailable = true;
      latestRelease = json.tag_name;
    } else {
      mainLog.info('No new updates');
      updateAvailable = false;
    }
  } catch (err) {
    mainLog.error(err);
  }
  return updateAvailable;
};

// Create the browser window.
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1460,
    height: 1000,
    minWidth: 1210,
    minHeight: 750,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Only show the window once it's ready
  mainWindow.once('ready-to-show', () => mainWindow.show());
};

// When the app is ready create a new window
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

// API DEFINITION START
// Send aws credentials and user settings
ipcMain.handle('initialize', async (ev) => {
  mainLog.info('<--API: intialize');
  loadAWS();
  let updateAvailable;
  let userWantsToUpdate = false;
  try {
    const data = await fs.promises.readFile(settingsFile);
    userSettings = JSON.parse(data);
    mainLog.info('Read user settings from file');
    if (!isDev) {
      mainLog.info('Checking for updates');
      updateAvailable = await checkForLatestVersion();
      if (updateAvailable) {
        userWantsToUpdate = await promptForUpdate();
      }
    }
  } catch (err) {
    mainLog.error(err);
  }
  mainLog.info('API: intialize-->');
  return {
    userSettings,
    awsCredentials,
    userWantsToUpdate,
  };
});

ipcMain.handle('updateSettings', async (ev, settingsStore) => {
  mainLog.info('<--API: updateSettings');
  let text;
  let type;
  try {
    await fs.promises.writeFile(settingsFile, JSON.stringify(settingsStore));
    text = 'Settings updated successfully';
    type = 'success';
    mainLog.info(text);
  } catch (err) {
    text = err;
    mainLog.error(text);
    type = 'error';
  }
  mainLog.info('API: updateSettings-->');
  return { text, type };
});

// Count records in each db
ipcMain.handle('countDocs', async (ev, live) => {
  mainLog.info('<--API: countDocs');
  const out = {};
  const db = live ? dbLive : dbSandbox;
  for (const dbName in db) {
    try {
      out[dbName] = await db[dbName].count({});
    } catch (err) {
      mainLog.error(err);
    }
  }
  mainLog.info('API: countDocs-->');
  return out;
});

// Add HIT to db after it's created in mturk
ipcMain.handle('insertHIT', async (ev, hit, live) => {
  mainLog.info('<--API: insertHIT');
  mainLog.info(`HITId: ${hit.HITId}`);
  let text;
  let type;
  const db = live ? dbLive : dbSandbox;
  try {
    await db.hits.insert(hit);
    text = 'HIT added successfully';
    type = 'success';
    mainLog.info(text);
  } catch (err) {
    text = err;
    mainLog.error(text);
    type = 'error';
  }
  mainLog.info('API: insertHIT-->');
  return {
    text,
    type,
  };
});

// Insert or modify worker
// NOTE: This isn't an ipc handler because no front-end UI every directly interacts with the workers db. Instead we're mocking a relational db store, as any calls to the *assignments db* will automatically invoke this function
// FIXME: at somepoint rewrite this logic because it assums that updateDoc('asst') on the client only every contains a WorkerId field when being called from withing ReviewAssts > updateAsstsinDB()
// If that ever changes in the future the logic could break
const upsertWorker = async (query, update, db) => {
  mainLog.info('<--API: upsertWorker');
  let numAffected;
  try {
    // If an assignment has a workerId it also has a HITid because the client-side operation is refreshing data from Mturk
    const asstData = update.$set;
    const asstId = query.AsstId;
    if ('WorkerId' in asstData) {
      const HIT = await db.hits.findOne({ HITId: asstData.HITId });
      const HITReward = parseFloat(HIT.Reward);
      const worker = await db.workers.findOne({ WorkerId: asstData.WorkerId });
      if (worker) {
        if (!worker.Assignments.includes(asstId)) {
          // Worker hasn't done this assignment before; update their record
          numAffected = await db.workers.update(
            {
              WorkerId: asstData.WorkerId,
            },
            {
              $set: {
                WorkerId: asstData.WorkerId,
                recentHIT: asstData.HITId,
                recentAsst: asstId,
              },
              $addToSet: {
                Assignments: asstId,
                HITs: asstData.HITId,
              },
              $inc: {
                totalPayments: HITReward,
              },
            }
          );
          mainLog.info(`Added new assignment for existing worker ${asstData.WorkerId}`);
        } else {
          mainLog.info(`Worker already has assignment skipping ${asstData.WorkerId}`);
        }
      } else {
        // Create a new worker record
        numAffected = await db.workers.insert({
          WorkerId: asstData.WorkerId,
          Assignments: [asstId],
          HITs: [asstData.HITId],
          totalPayments: HITReward,
          totalBonuses: 0,
          recentHIT: asstData.HITId,
          recentAsst: asstId,
        });
        mainLog.info(`New worker added ${asstData.WorkerId}`);
      }
    } else if ('Bonus' in asstData) {
      mainLog.info('Updating Bonus for worker');
      numAffected = await db.workers.update(
        {
          Assignments: asstId,
        },
        {
          $inc: {
            totalBonuses: parseFloat(asstData.Bonus),
          },
        }
      );
      if (numAffected) {
        mainLog.info('Added new bonus for existing worker');
      } else {
        mainLog.info('No document found');
      }
    }
  } catch (err) {
    mainLog.error(err);
  }
};

// Export all dbs to JSON
ipcMain.handle('export', async (live) => {
  mainLog.info('<--API: export');
  const db = live ? dbLive : dbSandbox;
  let text;
  let type;
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Export Database',
      defaultPath: `${app.getPath('home')}/Desktop/`,
      buttonLabel: 'Export',
      message:
        "Where do you want to save the exported databases?\n(files will be auto-named with today's date)",
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
      text = 'Export succesful';
      type = 'success';
    } else {
      text = 'Export cancelled';
      type = 'notification';
    }
    mainLog.info(text);
  } catch (err) {
    text = err;
    mainLog.error(err);
    type = 'error';
  }
  mainLog.info('API: export-->');
  return {
    text,
    type,
  };
});

// Export selected Assignements to JSON for bonusing
ipcMain.handle('exportAsstsForBonus', async (ev, assts) => {
  mainLog.info('<--API: exportAsstsForBonus');
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
    mainLog.info(text);
  } catch (err) {
    text = err;
    mainLog.error(err);
    type = 'error';
  }
  mainLog.info('API: exportAsstsForBonus-->');
  return {
    text,
    type,
  };
});

// Import Assignemts for bonusing
ipcMain.handle('importAsstsForBonus', async () => {
  mainLog.info('<--API: importAsstsForBonus');
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
    mainLog.info(text);
  } catch (err) {
    text = err;
    mainLog.error(err);
    type = 'error';
  }
  mainLog.info('API: importAsstsForBonus');
  return {
    text,
    type,
    data,
  };
});

// Delete a doc in any db
ipcMain.handle('deleteDoc', async (ev, dbName, id, live) => {
  mainLog.info('<--API: deleteDoc');
  const db = live ? dbLive : dbSandbox;
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
    mainLog.info(text);
  } catch (err) {
    text = err;
    mainLog.error(err);
    type = 'error';
  }
  mainLog.info('API: deleteDoc-->');
  return { text, type };
});

// Update a doc in any db
ipcMain.handle('updateDoc', async (ev, dbName, query, update, options, live) => {
  mainLog.info('<--API: updateDoc');
  const db = live ? dbLive : dbSandbox;
  console.log(`Using live DB: ${live}`);
  let text;
  let type;
  try {
    mainLog.info(`DB: ${dbName} Query: ${JSON.stringify(query)}`);
    const numAffected = await db[dbName].update(query, update, options);
    if (numAffected) {
      text = 'Updated successfully';
      type = 'success';
    } else {
      text = 'Document not found';
      type = 'error';
    }
    mainLog.info(text);
    if (dbName === 'assts') {
      await upsertWorker(query, update, db);
    }
  } catch (err) {
    text = err;
    mainLog.error(err);
    type = 'error';
  }
  mainLog.info('API: updateDoc-->');
  return { text, type };
});

// Return all hits
ipcMain.handle('findHits', async (ev, live) => {
  mainLog.info('<--API: findHITs');
  const db = live ? dbLive : dbSandbox;
  const docs = await db.hits.find({}).sort({ createdAt: -1 });
  mainLog.info('API: findHITs-->');
  return docs;
});

// Search for hit with same exact params; useful because Mturk will assign HITs with matching params
// the same HITTypeId
ipcMain.handle('findDuplicateHIT', async (ev, HITTypeId, live) => {
  mainLog.info('<--API: findDuplicateHIT');
  const db = live ? dbLive : dbSandbox;
  let text;
  let type;
  try {
    const docs = await db.hits.findOne({ HITTypeId });
    mainLog.info('API: findDuplicateHIT-->');
    return docs;
  } catch (err) {
    text = err;
    mainLog.error(err);
    type = 'error';
    mainLog.info('API: findDuplicateHIT-->');
    return { text, type };
  }
});

// Return all assts
ipcMain.handle('findAssts', async (ev, live) => {
  mainLog.info('<--API: findAssts');
  const db = live ? dbLive : dbSandbox;
  const docs = await db.assts.find({}).sort({ createdAt: -1 });
  mainLog.info('API: findAssts-->');
  return docs;
});

// Return assts for a specific HIT
ipcMain.handle('findAsstsForHIT', async (ev, HITId, live) => {
  mainLog.info('<--API: findAsstsForHIT');
  const db = live ? dbLive : dbSandbox;
  const docs = await db.assts.find({ HITId }).sort({ createdAt: -1 });
  mainLog.info('API: findAsstsForHIT-->');
  return docs;
});

// Return all workers
ipcMain.handle('findWorkers', async (ev, live) => {
  mainLog.info('<--API: findWorkers');
  const db = live ? dbLive : dbSandbox;
  const docs = await db.workers.find({}).sort({ createdAt: -1 });
  mainLog.info('API: findWorkers-->');
  return docs;
});

// Manage hit templates
// TODO: refactor
ipcMain.handle('findHITTemplates', async (ev, live) => {
  mainLog.info('<--API: findHITTemplates');
  const db = live ? dbLive : dbSandbox;
  const docs = await db.hitTemplates.find({}).sort({ name: 1 });
  mainLog.info('API: findHITTemplates-->');
  return docs;
});

ipcMain.handle('saveHITTemplate', async (ev, template, live) => {
  mainLog.info('<--API: saveHITTemplate');
  const db = live ? dbLive : dbSandbox;
  mainLog.info(`Name: ${template.name}`);
  let text;
  let type;
  try {
    await db.hitTemplates.insert(template);
    text = 'Template saved successfully';
    type = 'success';
    mainLog.info(text);
  } catch (err) {
    text = err;
    mainLog.error(err);
    type = 'error';
  }
  mainLog.info('API: saveHITTemplate-->');
  return {
    text,
    type,
  };
});

ipcMain.handle('deleteHITTemplate', async (ev, name, live) => {
  mainLog.info('<--API: deleteHITTemplate');
  mainLog.info(`Name: ${name}`);
  const db = live ? dbLive : dbSandbox;
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
    mainLog.info(text);
  } catch (err) {
    text = err;
    mainLog.error(err);
    type = 'error';
  }
  mainLog.info('API: deleteHITTemplate-->');
  return { text, type };
});

// Keeping this for posterity as it was written before matching on HITTypeID
// It matches based on document content in nedb, in this case the parameters of a HIT
// ipcMain.handle('findDuplicateHIT', async (ev, hitParams) => {
//   let text;
//   let type;
//   try {
//     const docs = await db.hits.findOne({
//       $and: [
//         {
//           AssignmentDurationInSeconds: hitParams.assignmentDuration,
//           Description: hitParams.description,
//           Reward: hitParams.reward,
//           Title: hitParams.title,
//           AutoApprovalDelayInSeconds: hitParams.autoApprovalDelay,
//           Keywords: hitParams.keywords,
//         },
//         {
//           $where() { return JSON.stringify(this.Qualifications) === JSON.stringify(hitParams.selectedQuals); }
//         }
//       ]
//     });
//     return docs;
//   } catch (err) {
//     console.error(err);
//     text = err;
//     type = 'error';
//     return { text, type };
//   }
// });
