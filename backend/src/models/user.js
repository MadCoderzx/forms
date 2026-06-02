const { pool } = require('../config/db');

async function findUserByEmail(email) {
  const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createUser({ email, password_hash }) {
  const result = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, password_hash]
  );
  return result.rows[0];
}

module.exports = { findUserByEmail, findUserById, createUser };
