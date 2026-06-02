const { pool } = require('../config/db');

const allowedTypes = ['short_text', 'long_text', 'email', 'number', 'dropdown', 'radio', 'checkbox'];

function isValidQuestionType(question_type) {
  return allowedTypes.includes(question_type);
}

async function getQuestionById(id) {
  const result = await pool.query(
    'SELECT id, form_id, question_type, label, required, position FROM questions WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function getQuestionsByFormId(formId) {
  const result = await pool.query(
    'SELECT id, form_id, question_type, label, required, position FROM questions WHERE form_id = $1 ORDER BY position ASC',
    [formId]
  );
  return result.rows;
}

async function createQuestion({ form_id, question_type, label, required = false, position = 0 }) {
  const result = await pool.query(
    'INSERT INTO questions (form_id, question_type, label, required, position) VALUES ($1, $2, $3, $4, $5) RETURNING id, form_id, question_type, label, required, position',
    [form_id, question_type, label, required, position]
  );
  return result.rows[0];
}

async function updateQuestion({ id, question_type, label, required, position }) {
  const result = await pool.query(
    'UPDATE questions SET question_type = $1, label = $2, required = $3, position = $4, updated_at = now() WHERE id = $5 RETURNING id, form_id, question_type, label, required, position',
    [question_type, label, required, position, id]
  );
  return result.rows[0] || null;
}

async function deleteQuestion(id) {
  await pool.query('DELETE FROM questions WHERE id = $1', [id]);
}

module.exports = {
  allowedTypes,
  isValidQuestionType,
  getQuestionById,
  getQuestionsByFormId,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
