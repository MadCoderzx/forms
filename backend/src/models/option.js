const { pool } = require('../config/db');

async function getOptionById(id) {
  const result = await pool.query(
    'SELECT id, question_id, label, position FROM options WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function getOptionsByQuestionId(questionId) {
  const result = await pool.query(
    'SELECT id, question_id, label, position FROM options WHERE question_id = $1 ORDER BY position ASC',
    [questionId]
  );
  return result.rows;
}

async function createOption({ question_id, label, position = 0 }) {
  const result = await pool.query(
    'INSERT INTO options (question_id, label, position) VALUES ($1, $2, $3) RETURNING id, question_id, label, position',
    [question_id, label, position]
  );
  return result.rows[0];
}

async function updateOption({ id, label, position }) {
  const result = await pool.query(
    'UPDATE options SET label = $1, position = $2, updated_at = now() WHERE id = $3 RETURNING id, question_id, label, position',
    [label, position, id]
  );
  return result.rows[0] || null;
}

async function deleteOption(id) {
  await pool.query('DELETE FROM options WHERE id = $1', [id]);
}

module.exports = {
  getOptionById,
  getOptionsByQuestionId,
  createOption,
  updateOption,
  deleteOption,
};
