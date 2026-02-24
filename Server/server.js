const express = require('express');
const cors = require('cors');
const app = express();
const { Client } = require('pg');
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
const client = new Client({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
    // port: 5432,
});

app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

client.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database');
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

