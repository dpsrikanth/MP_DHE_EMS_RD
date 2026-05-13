const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

const errorLogStream = fs.createWriteStream(path.join(LOG_DIR, 'error.log'), { flags: 'a' });
const accessLogStream = fs.createWriteStream(path.join(LOG_DIR, 'access.log'), { flags: 'a' });

function formatLog(message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${message}${contextStr}\n`;
}

const logger = {
    info: (message, context) => {
        const log = formatLog(`INFO: ${message}`, context);
        console.log(log.trim());
        accessLogStream.write(log);
    },
    error: (message, context, error) => {
        let errorDetails = '';
        if (error) {
            errorDetails = ` | Error: ${error.message} | Stack: ${error.stack}`;
        }
        const log = formatLog(`ERROR: ${message}${errorDetails}`, context);
        console.error(log.trim());
        errorLogStream.write(log);
    },
    warn: (message, context) => {
        const log = formatLog(`WARN: ${message}`, context);
        console.warn(log.trim());
        accessLogStream.write(log);
    }
};

module.exports = logger;
