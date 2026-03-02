require("dotenv").config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const port = 8080;
const routes = require('./routes/routes');

const corsOptions = {
  origin: 'http://localhost:3000', 
  optionsSuccessStatus: 200,
   credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api', routes);

app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
