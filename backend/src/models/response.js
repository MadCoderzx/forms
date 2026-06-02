const { pool } = require('../config/db');

async function createResponse(formId) {
  const result = await pool.query(
    'INSERT INTO responses (form_id) VALUES ($1) RETURNING id',
    [formId]
  );
  return result.rows[0];
}

async function createAnswer({ response_id, question_id, option_id = null, value = null }) {
  const result = await pool.query(
    'INSERT INTO answers (response_id, question_id, option_id, value) VALUES ($1, $2, $3, $4) RETURNING id, response_id, question_id, option_id, value',
    [response_id, question_id, option_id, value]
  );
  return result.rows[0];
}

async function getResponsesForFormById(formId) {
  const result = await pool.query(
    `SELECT
      r.id AS response_id,
      r.created_at AS response_created_at,
      a.id AS answer_id,
      a.question_id,
      q.label AS question_label,
      q.question_type,
      q.position AS question_position,
      a.option_id,
      o.label AS option_label,
      a.value
    FROM responses r
    LEFT JOIN answers a ON a.response_id = r.id
    LEFT JOIN questions q ON q.id = a.question_id
    LEFT JOIN options o ON o.id = a.option_id
    WHERE r.form_id = $1
    ORDER BY r.created_at DESC, q.position ASC`,
    [formId]
  );

  const responses = new Map();

  for (const row of result.rows) {
    let response = responses.get(row.response_id);
    if (!response) {
      response = {
        id: row.response_id,
        created_at: row.response_created_at,
        answers: [],
      };
      responses.set(row.response_id, response);
    }

    if (row.answer_id) {
      response.answers.push({
        answer_id: row.answer_id,
        question_id: row.question_id,
        question_label: row.question_label,
        question_type: row.question_type,
        question_position: row.question_position,
        option_id: row.option_id,
        option_label: row.option_label,
        value: row.value,
      });
    }
  }

  return Array.from(responses.values());
}

module.exports = {
  createResponse,
  createAnswer,
  getResponsesForFormById,
};
