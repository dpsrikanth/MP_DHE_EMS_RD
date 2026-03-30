require("dotenv").config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const port = 8080;
const routes = require('./routes/routes');
const collegeAdminRoutes = require('./routes/collegeAdminRoutes');
const facultyMarksRoutes = require('./routes/facultyMarksRoutes');

const universityAdminRoutes = require('./routes/universityAdminRoutes');
const externalFacultyRoutes = require('./routes/externalFacultyRoutes');
const gradingRoutes = require('./routes/gradingRoutes');
const paperSetterRoutes = require('./routes/paperSetterRoutes');
const secrecyRoutes = require('./routes/secrecyRoutes');
const hallRoutes = require('./routes/hallRoutes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));
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

app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
