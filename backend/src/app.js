const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const formsRouter = require('./routes/forms');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/forms', formsRouter);

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

module.exports = app;
