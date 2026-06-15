const { Pool } = require('pg');

const isRender = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@postgres:5432/form_builder',

  ssl: isRender
    ? {
        rejectUnauthorized: false,
      }
    : false,
});

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('DB connection error:', err.message || err);
    return false;
  }
}

module.exports = { pool, testConnection };