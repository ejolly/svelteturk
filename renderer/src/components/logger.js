const path = require('path');
const homedir = require('os').homedir();
const log = require('electron-log');

// Configure log file location
log.transports.file.resolvePath = (() => path.join(homedir, '.svelteturk.log'));

// Scope 2 loggers one for "system" calls where 'renderer' will appear in the log file and the other for "user actions" where 'user' will appear in the log file
export const stLog = log.scope('renderer');
export const userLog = log.scope('user');
