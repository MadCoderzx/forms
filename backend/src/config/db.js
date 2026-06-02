const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/form_builder'
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('DB connection error:', err.message || err);
    return false;
  }
}

module.exports = { pool, testConnection };
