const { pool } = require('../config/db');

async function getFormsByUserId(userId) {
  const result = await pool.query(
    `SELECT
      f.id,
      f.user_id,
      f.title,
      f.description,
      f.public_id,
      f.created_at,
      f.updated_at,
      COUNT(r.id)::INT AS response_count
    FROM forms f
    LEFT JOIN responses r ON r.form_id = f.id
    WHERE f.user_id = $1
    GROUP BY f.id
    ORDER BY f.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getFormByIdForUser(id, userId) {
  const result = await pool.query(
    'SELECT id, user_id, title, description, public_id, created_at, updated_at FROM forms WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] || null;
}

async function getFormWithQuestionsAndOptionsById(id, userId) {
  const result = await pool.query(
    `SELECT
      f.id AS form_id,
      f.user_id,
      f.title,
      f.description,
      f.public_id,
      f.created_at,
      f.updated_at,
      q.id AS question_id,
      q.question_type,
      q.label AS question_label,
      q.required,
      q.position AS question_position,
      o.id AS option_id,
      o.label AS option_label,
      o.position AS option_position
    FROM forms f
    LEFT JOIN questions q ON q.form_id = f.id
    LEFT JOIN options o ON o.question_id = q.id
    WHERE f.id = $1 AND f.user_id = $2
    ORDER BY q.position ASC, o.position ASC`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  const form = {
    id: row.form_id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    public_id: row.public_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    questions: [],
  };

  const questionMap = new Map();

  for (const item of result.rows) {
    if (!item.question_id) {
      continue;
    }

    let question = questionMap.get(item.question_id);
    if (!question) {
      question = {
        id: item.question_id,
        question_type: item.question_type,
        label: item.question_label,
        required: item.required,
        position: item.question_position,
        options: [],
      };
      questionMap.set(item.question_id, question);
      form.questions.push(question);
    }

    if (item.option_id) {
      question.options.push({
        id: item.option_id,
        label: item.option_label,
        position: item.option_position,
      });
    }
  }

  return form;
}

async function getPublicFormWithQuestionsAndOptionsByPublicId(publicId) {
  const result = await pool.query(
    `SELECT
      f.id AS form_id,
      f.user_id,
      f.title,
      f.description,
      f.public_id,
      f.created_at,
      f.updated_at,
      q.id AS question_id,
      q.question_type,
      q.label AS question_label,
      q.required,
      q.position AS question_position,
      o.id AS option_id,
      o.label AS option_label,
      o.position AS option_position
    FROM forms f
    LEFT JOIN questions q ON q.form_id = f.id
    LEFT JOIN options o ON o.question_id = q.id
    WHERE f.public_id = $1
    ORDER BY q.position ASC, o.position ASC`,
    [publicId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  const form = {
    id: row.form_id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    public_id: row.public_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    questions: [],
  };

  const questionMap = new Map();

  for (const item of result.rows) {
    if (!item.question_id) {
      continue;
    }

    let question = questionMap.get(item.question_id);
    if (!question) {
      question = {
        id: item.question_id,
        question_type: item.question_type,
        label: item.question_label,
        required: item.required,
        position: item.question_position,
        options: [],
      };
      questionMap.set(item.question_id, question);
      form.questions.push(question);
    }

    if (item.option_id) {
      question.options.push({
        id: item.option_id,
        label: item.option_label,
        position: item.option_position,
      });
    }
  }

  return form;
}

async function createForm({ user_id, title, description }) {
  const result = await pool.query(
    'INSERT INTO forms (user_id, title, description) VALUES ($1, $2, $3) RETURNING id, user_id, title, description, public_id, created_at, updated_at',
    [user_id, title, description]
  );
  return result.rows[0];
}

async function updateForm({ id, title, description }) {
  const result = await pool.query(
    'UPDATE forms SET title = $1, description = $2, updated_at = now() WHERE id = $3 RETURNING id, user_id, title, description, public_id, created_at, updated_at',
    [title, description, id]
  );
  return result.rows[0] || null;
}

async function deleteForm(id) {
  await pool.query('DELETE FROM forms WHERE id = $1', [id]);
}

async function duplicateForm(id, userId) {
  const result = await pool.query(
    'INSERT INTO forms (user_id, title, description) SELECT user_id, title, description FROM forms WHERE id = $1 AND user_id = $2 RETURNING id, user_id, title, description, public_id, created_at, updated_at',
    [id, userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  getFormsByUserId,
  getFormByIdForUser,
  getFormWithQuestionsAndOptionsById,
  getPublicFormWithQuestionsAndOptionsByPublicId,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
};
