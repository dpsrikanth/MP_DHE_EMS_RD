require("dotenv").config({ path: './config/.env' }); 
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 8080;
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

// Security Middlewares
// 1. HTTP Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin images/resources if needed
}));

// 2. Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
