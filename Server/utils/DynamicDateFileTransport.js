const Transport = require('winston-transport');
const fs = require('fs');
const path = require('path');

module.exports = class DynamicDateFileTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.baseDir = opts.baseDir;
    this.filename = opts.filename;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const logDir = path.join(this.baseDir, year, month, day);
    
    // Create directory recursively
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, this.filename);
    const message = info[Symbol.for('message')] || JSON.stringify(info);

    fs.appendFile(logFile, message + '\n', (err) => {
      if (err) {
        console.error('Failed to write log:', err);
      }
    });

    if (callback) {
      callback();
    }
  }
};
