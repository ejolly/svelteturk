import * as yup from 'yup';
// Utilities functions used throughout the app
const { ipcRenderer } = require('electron');

// Delete a document in any database
// Args: database name, document ._id
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

// Update a document in any database
// Args: database name, doc query, update operation, options
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

// Asychronously wait which can be used within another async func
// Args: time in ms
export const wait = async (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

// Format a data to Month/Data/Year - Hours:Minutesam/pm
// Args: date object
export const formatDate = (date) => {
  const dateTime = new Date(date);
  const year = dateTime.getFullYear() - 2000;
  const month = dateTime.getMonth() + 1;
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

// Create HIT validation
export const HITSchema = yup.object().shape({
  assignmentDuration: yup.number('Must be a number').positive('Must be positive').integer('Must be an integer').required('Assignment Duration is required'),
  description: yup.string().required('HIT Description is required'),
  lifetime: yup.number('Must be a number').positive('Must be positive').integer('Must be an integer').required('HIT Lifetime is required'),
  reward: yup.string().matches(/^\d{0,3}(\.\d{1,2})?$/, 'Must be a valid USD value').required('HIT Reward is required'),
  title: yup.string().required('HIT Title is required'),
  autoApprovalDelay: yup.number('Must be a number').positive('Must be positive').integer('Must be an integer'),
  keywords: yup.string('Must be a comma separated list of words without spaces').required('Keywords are required'),
  maxAssignments: yup.number('Must be a number').positive('Must be positive').integer('Must be an integer').required('Maximum Assignments is required'),
  externalURL: yup.string().url('Must be a valid URL').required('External URL is required'),
});

// Extract yup errors into an object
export const extractErrors = ({ inner }) => inner.reduce((acc, err) => ({ ...acc, [err.path]: err.message }), {});
