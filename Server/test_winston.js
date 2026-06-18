const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const transport = new DailyRotateFile({
  filename: path.join(__dirname, 'logs', '%DATE%', 'access.log'),
  datePattern: 'YYYY/MM/DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d'
});

const logger = winston.createLogger({
  transports: [
    transport
  ]
});

logger.info('Hello World!');
console.log('Done!');
