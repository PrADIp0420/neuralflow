require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/users',    require('./routes/users'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'NeuralFlow by Ethara AI', timestamp: new Date() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`NeuralFlow API running on port ${PORT}`));
