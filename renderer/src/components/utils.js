import * as yup from 'yup';
import { get } from 'svelte/store';
import { live } from './store';
import { stLog } from './logger';

const { ipcRenderer } = require('electron');

// Global variables
export const refreshFrequency = 30000;

// Delete a document in any database
// Args: database name, document ._id
export const deleteDoc = async (dbName, id) => {
  let resp;
  try {
    resp = await ipcRenderer.invoke('deleteDoc', dbName, id);
  } catch (err) {
    resp = { text: err, type: 'error' };
  }
  return resp;
};

// Update a document in any database
// Args: database name, doc query, update operation, options
export const updateDoc = async (dbName, query, update, options) => {
  let resp;
  try {
    stLog.info('REQ: updateDoc');
    resp = await ipcRenderer.invoke('updateDoc', dbName, query, update, options, get(live));
  } catch (err) {
    resp = { text: err, type: 'error' };
  }
  return resp;
};

// Asychronously wait which can be used within another async func
// Args: time in ms
export const wait = async (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// Async iterable generator when we need to iterate N times, rather than over an object with a predefined length (in which case we'd use for of)
export function* asyncGenerator(N) {
  let i = 0;
  while (i < N) {
    // eslint-disable-next-line no-plusplus
    yield i++;
  }
}

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
  assignmentDuration: yup
    .number('Must be a number')
    .positive('Must be positive')
    .integer('Must be an integer')
    .required('Assignment Duration is required'),
  description: yup.string().required('HIT Description is required'),
  lifetime: yup
    .number('Must be a number')
    .positive('Must be positive')
    .integer('Must be an integer')
    .required('HIT Lifetime is required'),
  reward: yup
    .string()
    .matches(/^\d{0,3}(\.\d{1,2})$/, 'Must be valid current format with dollars and cents')
    .required('HIT Reward is required'),
  title: yup.string().required('HIT Title is required'),
  autoApprovalDelay: yup
    .number('Must be a number')
    .positive('Must be positive')
    .integer('Must be an integer'),
  keywords: yup
    .string('Must be a comma separated list of words without spaces')
    .required('Keywords are required'),
  maxAssignments: yup
    .number('Must be a number')
    .positive('Must be positive')
    .integer('Must be an integer')
    .required('Maximum Assignments is required'),
  numHITs: yup
    .number('Must be a number')
    .positive('Must be positive')
    .integer('Must be an integer')
    .required('Repeat participation is required'),
  externalURL: yup.string().url('Must be a valid URL').required('External URL is required'),
});

// Extract yup errors into an object
export const extractErrors = ({ inner }) =>
  inner.reduce((acc, err) => ({ ...acc, [err.path]: err.message }), {});

// Format qualifications as desired by mturk
export const formatQuals = (qualArray) => {
  const out = [];
  const mastersQualId = get(live)
    ? '2F1QJWKUDD8XADTFD2Q0G6UTO95ALH'
    : '2ARFPLSP75KLA8M8DH1HTEQVJT3SY6';
  qualArray.forEach((qual) => {
    switch (qual) {
      case '> 95% Approval':
        out.push({
          QualificationTypeId: '000000000000000000L0',
          Comparator: 'GreaterThanOrEqualTo',
          IntegerValues: [95],
          ActionsGuarded: 'DiscoverPreviewAndAccept',
        });
        break;
      case 'Adult only':
        out.push({
          QualificationTypeId: '00000000000000000060',
          Comparator: 'EqualTo',
          IntegerValues: [1],
          ActionsGuarded: 'DiscoverPreviewAndAccept',
        });
        break;
      case 'US Only':
        out.push({
          QualificationTypeId: '00000000000000000071',
          Comparator: 'EqualTo',
          LocaleValues: [{ Country: 'US' }],
          ActionsGuarded: 'DiscoverPreviewAndAccept',
        });
        break;
      case 'Masters':
        out.push({
          QualificationTypeId: mastersQualId,
          Comparator: 'Exists',
          ActionsGuarded: 'DiscoverPreviewAndAccept',
        });
        break;
      default:
        // eslint-disable-next-line no-throw-literal
        throw `Unrecognized qualification: ${qual}`;
    }
  });
  return out;
};

// Check for duplicate hits
export const checkForDuplicateHIT = async (HITTypeId) => {
  let resp;
  try {
    resp = await ipcRenderer.invoke('findDuplicateHIT', HITTypeId, get(live));
  } catch (err) {
    resp = { text: err, type: 'error' };
  }
  return resp;
};
