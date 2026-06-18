require("dotenv").config({ path: './config/.env' }); 
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 8080;

// Trust reverse-proxy headers (X-Forwarded-For, X-Real-IP) so req.ip
// returns the actual client IP instead of the loopback address.
app.set('trust proxy', true);
const logger = require('./utils/logger');
const morgan = require('morgan');

const routes = require('./routes/routes');
const collegeAdminRoutes = require('./routes/collegeAdminRoutes');
const facultyMarksRoutes = require('./routes/facultyMarksRoutes');
const universityAdminRoutes = require('./routes/universityAdminRoutes');
const externalFacultyRoutes = require('./routes/externalFacultyRoutes');
const gradingRoutes = require('./routes/gradingRoutes');
const paperSetterRoutes = require('./routes/paperSetterRoutes');
const secrecyRoutes = require('./routes/secrecyRoutes');
const hallRoutes = require('./routes/hallRoutes');
const reportRoutes = require('./routes/reportRoutes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000'],
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 1. Request and Response Logging Middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    res.__custombody__ = body;
    originalSend.call(this, body);
  };
  next();
});

app.use(morgan((tokens, req, res) => {
  let resBody = res.__custombody__;
  try {
    if (typeof resBody === 'string') {
      resBody = JSON.parse(resBody);
    }
  } catch (e) {
    // Ignore if not JSON
  }

  let reqBody = req.body;
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    reqBody = '[Multipart Form Data omitted]';
  }

  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    content_length: tokens.res(req, res, 'content-length'),
    response_time: tokens['response-time'](req, res) + ' ms',
    ip: tokens['remote-addr'](req, res) || req.ip,
    user_agent: tokens['user-agent'](req, res),
    user_id: req.user?.id,
    req_body: reqBody,
    res_body: resBody
  });
}, { stream: logger.stream }));

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use('/api', routes);
app.use('/api/college-admin', collegeAdminRoutes);
app.use('/api/faculty-marks', facultyMarksRoutes);
app.use('/api/university-admin', universityAdminRoutes);
app.use('/api/external-faculty', externalFacultyRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/paper-setter', paperSetterRoutes);
app.use('/api/secrecy', secrecyRoutes);
app.use('/api/examination-halls', hallRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

app.get('/api/test-error', (req, res) => {
  throw new Error("This is a manual test error to verify logging functionality.");
});

// 4. Global Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled Exception: ${req.method} ${req.originalUrl}`, {
    user: req.user?.id,
    params: req.params,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  }, err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

module.exports = app;
