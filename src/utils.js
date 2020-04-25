// Initialize firebase
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import 'firebase/auth';
import { firebaseConfig } from './config';

firebase.initializeApp(firebaseConfig);

// Setup and export firebase globals for use elsewhere in the app
export const db = firebase.database();
export const storage = firebase.storage();
export const auth = firebase.auth();
export const serverTime = firebase.database.ServerValue.TIMESTAMP;
