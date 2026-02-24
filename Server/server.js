const express = require('express');
const cors = require('cors');
const app = express();
const port = 8080;
const routes = require('./routes/routes');

const corsOptions = {
  origin: 'http://localhost:3000', 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
