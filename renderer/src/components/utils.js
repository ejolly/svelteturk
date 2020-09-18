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

export const updateDoc = async (dbName, query, update, options) => {
  let resp;
  try {
    resp = await ipcRenderer.invoke('updateDoc', dbName, query, update, options);
  } catch (err) {
    console.error(err);
    resp = { text: err, type: 'error' };
  }
  return resp;
};

export const wait = async (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const formatDate = (date) => {
  const dateTime = new Date(date);
  const year = dateTime.getFullYear() - 2000;
  const month = dateTime.getMonth();
  const day = dateTime.getDate();
  let hours = dateTime.getHours();
  let ampm;
  if (hours > 12) {
    ampm = 'pm';
    hours -= 12;
  } else if (hours === 12) {
    ampm = 'pm';
  } else {
    ampm = 'am';
  }
  hours = hours > 12 ? hours - 12 : hours;
  let minutes = dateTime.getMinutes();
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${month}/${day}/${year} - ${hours}:${minutes}${ampm}`;
};
