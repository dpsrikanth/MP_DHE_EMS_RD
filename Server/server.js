const express = require('express');
const cors = require('cors');
const app = express();
const { Client } = require('pg');
const port = 8080;

const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your React app's URL
  optionsSuccessStatus: 200
};

const client = new Client({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
    // port: 5432,
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

app.use(cors(corsOptions));
app.use(express.json());