// Utilities functions used throughout the app
const { ipcRenderer } = require('electron');

export const deleteDoc = async (dbName, id) => {
  let resp;
  try {
    resp = await ipcRenderer.invoke('deleteDoc', dbName, id);
  } catch (err) {
    console.error(err);
    resp = { text: err, type: 'error' };
  }
  return resp;
};

export const updateDoc = async (dbName, query, update) => {
  let resp;
  try {
    resp = await ipcRenderer.invoke('updateDoc', dbName, query, update);
  } catch (err) {
    console.error(err);
    resp = { text: err, type: 'error' };
  }
  return resp;
};

export const wait = async (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
