const path = require('path');
const homedir = require('os').homedir();
const log = require('electron-log');

// Configure log file location
log.transports.file.resolvePath = (() => path.join(homedir, '.svelte-turk.log'));

// Scope renderer process logs so that 'renderer' appear in the log file next to messages
export const logger = log.scope('renderer');
