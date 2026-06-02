const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/db');

router.get('/', async (req, res) => {
  const dbOk = await testConnection();
  res.json({ status: 'ok', service: 'backend', db: dbOk ? 'ok' : 'error' });
});

module.exports = router;
