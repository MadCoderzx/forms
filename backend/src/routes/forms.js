const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  getFormsByUserId,
  getFormByIdForUser,
  getFormWithQuestionsAndOptionsById,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
} = require('../models/form');
const {
  isValidQuestionType,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../models/question');
const {
  getOptionById,
  createOption,
  updateOption,
  deleteOption,
} = require('../models/option');
const { getResponsesForFormById } = require('../models/response');
const {
  isNonEmptyString,
  isBoolean,
  isValidPosition,
  isValidOptions,
} = require('../utils/validation');

const router = express.Router();
router.use(authMiddleware);

const choiceTypes = ['dropdown', 'radio', 'checkbox'];

router.get('/', async (req, res) => {
  const forms = await getFormsByUserId(req.user.id);
  res.json({ forms });
});

router.post('/', async (req, res) => {
  const { title, description } = req.body;
  if (!isNonEmptyString(title)) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (description != null && typeof description !== 'string') {
    return res.status(400).json({ error: 'Description must be a string' });
  }

  const form = await createForm({
    user_id: req.user.id,
    title: title.trim(),
    description: description ? description.trim() : null,
  });

  res.status(201).json({ form });
});

router.get('/:id', async (req, res) => {
  const form = await getFormWithQuestionsAndOptionsById(req.params.id, req.user.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  res.json({ form });
});

router.post('/:id/questions', async (req, res) => {
  const { question_type, label, required = false, position = 0, options } = req.body;
  const form = await getFormByIdForUser(req.params.id, req.user.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  if (!isValidQuestionType(question_type) || !isNonEmptyString(label)) {
    return res.status(400).json({ error: 'Question type and label are required' });
  }

  if (!isBoolean(required)) {
    return res.status(400).json({ error: 'Required must be true or false' });
  }

  if (!isValidPosition(position)) {
    return res.status(400).json({ error: 'Position must be a non-negative integer' });
  }

  if (choiceTypes.includes(question_type)) {
    if (!isValidOptions(options)) {
      return res.status(400).json({ error: 'Choice questions require at least one valid option' });
    }
  } else if (options != null) {
    return res.status(400).json({ error: 'Only choice questions may include options' });
  }

  const question = await createQuestion({
    form_id: req.params.id,
    question_type,
    label: label.trim(),
    required,
    position,
  });

  if (Array.isArray(options) && options.length > 0) {
    const createdOptions = [];
    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      if (!option || !isNonEmptyString(option.label)) {
        return res.status(400).json({ error: 'Each option must include a label' });
      }

      const created = await createOption({
        question_id: question.id,
        label: option.label.trim(),
        position: typeof option.position === 'number' ? option.position : index,
      });
      createdOptions.push(created);
    }
    question.options = createdOptions;
  } else {
    question.options = [];
  }

  res.status(201).json({ question });
});

router.put('/:formId/questions/:questionId', async (req, res) => {
  const { question_type, label, required = false, position = 0 } = req.body;
  const form = await getFormByIdForUser(req.params.formId, req.user.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const existingQuestion = await getQuestionById(req.params.questionId);
  if (!existingQuestion || existingQuestion.form_id !== Number(req.params.formId)) {
    return res.status(404).json({ error: 'Question not found' });
  }

  if (!isValidQuestionType(question_type) || !isNonEmptyString(label)) {
    return res.status(400).json({ error: 'Question type and label are required' });
  }

  if (!isBoolean(required)) {
    return res.status(400).json({ error: 'Required must be true or false' });
  }

  if (!isValidPosition(position)) {
    return res.status(400).json({ error: 'Position must be a non-negative integer' });
  }

  const updated = await updateQuestion({
    id: req.params.questionId,
    question_type,
    label: label.trim(),
    required,
    position,
  });

  res.json({ question: updated });
});

router.delete('/:formId/questions/:questionId', async (req, res) => {
  const form = await getFormByIdForUser(req.params.formId, req.user.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const existingQuestion = await getQuestionById(req.params.questionId);
  if (!existingQuestion || existingQuestion.form_id !== Number(req.params.formId)) {
    return res.status(404).json({ error: 'Question not found' });
  }

  await deleteQuestion(req.params.questionId);
  res.status(204).end();
});

router.post('/:formId/questions/:questionId/options', async (req, res) => {
  const { label, position = 0 } = req.body;
  const form = await getFormByIdForUser(req.params.formId, req.user.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const existingQuestion = await getQuestionById(req.params.questionId);
  if (!existingQuestion || existingQuestion.form_id !== Number(req.params.formId)) {
    return res.status(404).json({ error: 'Question not found' });
  }

  if (!choiceTypes.includes(existingQuestion.question_type)) {
    return res.status(400).json({ error: 'Options can only be added to choice questions' });
  }

  if (!isNonEmptyString(label)) {
    return res.status(400).json({ error: 'Option label is required' });
  }

  if (!isValidPosition(position)) {
    return res.status(400).json({ error: 'Position must be a non-negative integer' });
  }

  const option = await createOption({
    question_id: req.params.questionId,
    label: label.trim(),
    position,
  });

  res.status(201).json({ option });
});

router.put('/:formId/questions/:questionId/options/:optionId', async (req, res) => {
  const { label, position = 0 } = req.body;
  const form = await getFormByIdForUser(req.params.formId, req.user.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const existingQuestion = await getQuestionById(req.params.questionId);
  if (!existingQuestion || existingQuestion.form_id !== Number(req.params.formId)) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const option = await getOptionById(req.params.optionId);
  if (!option || option.question_id !== Number(req.params.questionId)) {
    return res.status(404).json({ error: 'Option not found' });
  }

  if (!isNonEmptyString(label)) {
    return res.status(400).json({ error: 'Option label is required' });
  }

  if (!isValidPosition(position)) {
    return res.status(400).json({ error: 'Position must be a non-negative integer' });
  }

  const updatedOption = await updateOption({
    id: req.params.optionId,
    label: label.trim(),
    position,
  });

  res.json({ option: updatedOption });
});

router.delete('/:formId/questions/:questionId/options/:optionId', async (req, res) => {
  const form = await getFormByIdForUser(req.params.formId, req.user.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const existingQuestion = await getQuestionById(req.params.questionId);
  if (!existingQuestion || existingQuestion.form_id !== Number(req.params.formId)) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const option = await getOptionById(req.params.optionId);
  if (!option || option.question_id !== Number(req.params.questionId)) {
    return res.status(404).json({ error: 'Option not found' });
  }

  await deleteOption(req.params.optionId);
  res.status(204).end();
});

router.put('/:id', async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const existing = await getFormByIdForUser(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const updated = await updateForm({
    id: req.params.id,
    title,
    description: description || null,
  });

  res.json({ form: updated });
});

router.delete('/:id', async (req, res) => {
  const existing = await getFormByIdForUser(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Form not found' });
  }

  await deleteForm(req.params.id);
  res.status(204).end();
});

router.post('/:id/duplicate', async (req, res) => {
  const existing = await getFormByIdForUser(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const duplicated = await duplicateForm(req.params.id, req.user.id);
  res.status(201).json({ form: duplicated });
});

router.get('/:id/responses', async (req, res) => {
  const existing = await getFormByIdForUser(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const responses = await getResponsesForFormById(req.params.id);
  const totalResponses = responses.length;
  const latestResponse = responses[0] ? responses[0].created_at : null;

  res.json({
    form: {
      id: existing.id,
      title: existing.title,
      description: existing.description,
    },
    responses,
    stats: {
      totalResponses,
      latestResponse,
    },
  });
});

function escapeCsvValue(value) {
  if (value == null) return '';
  const stringValue = String(value).replace(/"/g, '""');
  return /[",\n\r]/.test(stringValue) ? `"${stringValue}"` : stringValue;
}

function buildResponsesCsv(responses) {
  const questionOrder = [];
  const questionSeen = new Set();

  responses.forEach((response) => {
    response.answers.forEach((answer) => {
      if (!questionSeen.has(answer.question_id)) {
        questionSeen.add(answer.question_id);
        questionOrder.push({ id: answer.question_id, label: answer.question_label });
      }
    });
  });

  const headers = ['Response ID', 'Submitted At', ...questionOrder.map((question) => question.label)];
  const rows = [headers];

  responses.forEach((response) => {
    const answerMap = new Map();

    response.answers.forEach((answer) => {
      const questionId = answer.question_id;
      const existing = answerMap.get(questionId) || '';
      const value = ['dropdown', 'radio', 'checkbox'].includes(answer.question_type)
        ? answer.option_label || ''
        : answer.value || '';
      answerMap.set(questionId, existing ? `${existing} | ${value}` : value);
    });

    const row = [
      response.id,
      new Date(response.created_at).toISOString(),
      ...questionOrder.map((question) => answerMap.get(question.id) || ''),
    ];

    rows.push(row);
  });

  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
}

router.get('/:id/responses/csv', async (req, res) => {
  const existing = await getFormByIdForUser(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const responses = await getResponsesForFormById(req.params.id);
  const csv = buildResponsesCsv(responses);
  const safeTitle = existing.title ? existing.title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_') : `form-${existing.id}`;
  const filename = `${safeTitle}-responses.csv`;

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

module.exports = router;
