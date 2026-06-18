const winston = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../logs');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(LOG_DIR, 'access.log') })
    ]
});

// Optionally log to console
if (process.env.NODE_ENV !== 'production') {
    winstonLogger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

const logger = {
    info: (message, context = {}) => {
        winstonLogger.info(message, { context });
    },
    error: (message, context = {}, error = null) => {
        const errorDetails = error ? { message: error.message, stack: error.stack } : undefined;
        winstonLogger.error(message, { context, error: errorDetails });
    },
    warn: (message, context = {}) => {
        winstonLogger.warn(message, { context });
    },
    stream: {
        write: (message) => {
            try {
                const logData = JSON.parse(message);
                winstonLogger.info('HTTP Request/Response Log', logData);
            } catch (e) {
                winstonLogger.info(message.trim());
            }
        }
    }
};

module.exports = logger;
