const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/auth', require('./routes/auth'));
app.use('/generate', require('./routes/generate'));

app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
