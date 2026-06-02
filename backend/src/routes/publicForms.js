const express = require('express');
const { getPublicFormWithQuestionsAndOptionsByPublicId } = require('../models/form');
const { createResponse, createAnswer } = require('../models/response');

const router = express.Router();

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateNumber(value) {
  return value !== '' && !Number.isNaN(Number(value));
}

router.get('/:publicId', async (req, res) => {
  const form = await getPublicFormWithQuestionsAndOptionsByPublicId(req.params.publicId);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  res.json({ form });
});

router.post('/:publicId/responses', async (req, res) => {
  const { answers } = req.body;
  const form = await getPublicFormWithQuestionsAndOptionsByPublicId(req.params.publicId);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers must be an array' });
  }

  const questionMap = new Map(form.questions.map((question) => [question.id, question]));
  const optionMap = new Map();
  for (const question of form.questions) {
    for (const option of question.options) {
      optionMap.set(option.id, { ...option, question_id: question.id });
    }
  }

  const groupedAnswers = new Map();
  for (const answer of answers) {
    if (!answer || typeof answer.question_id !== 'number') {
      return res.status(400).json({ error: 'Each answer must include a question_id' });
    }

    const question = questionMap.get(answer.question_id);
    if (!question) {
      return res.status(400).json({ error: 'Invalid question_id in answers' });
    }

    const entries = groupedAnswers.get(answer.question_id) || [];
    entries.push(answer);
    groupedAnswers.set(answer.question_id, entries);
  }

  const validatedAnswers = [];
  for (const question of form.questions) {
    const answersForQuestion = groupedAnswers.get(question.id) || [];

    if (question.required && answersForQuestion.length === 0) {
      return res.status(400).json({ error: `Question '${question.label}' is required` });
    }

    if (question.question_type === 'email' && answersForQuestion.length > 0) {
      const value = answersForQuestion[0].value ?? '';
      if (!validateEmail(value)) {
        return res.status(400).json({ error: `Question '${question.label}' requires a valid email` });
      }
    }

    if (question.question_type === 'number' && answersForQuestion.length > 0) {
      const value = answersForQuestion[0].value ?? '';
      if (!validateNumber(value)) {
        return res.status(400).json({ error: `Question '${question.label}' requires a valid number` });
      }
    }

    if (['dropdown', 'radio'].includes(question.question_type)) {
      const answer = answersForQuestion[0];
      if (!answer || answer.option_id == null || Number.isNaN(Number(answer.option_id))) {
        if (question.required) {
          return res.status(400).json({ error: `Question '${question.label}' requires a selected option` });
        }
        continue;
      }

      const option = optionMap.get(Number(answer.option_id));
      if (!option || option.question_id !== question.id) {
        return res.status(400).json({ error: `Question '${question.label}' contains an invalid option` });
      }

      validatedAnswers.push({ question_id: question.id, option_id: Number(answer.option_id), value: null });
      continue;
    }

    if (question.question_type === 'checkbox') {
      if (answersForQuestion.length === 0) {
        if (question.required) {
          return res.status(400).json({ error: `Question '${question.label}' requires at least one checkbox option` });
        }
        continue;
      }

      for (const answer of answersForQuestion) {
        if (answer.option_id == null || Number.isNaN(Number(answer.option_id))) {
          return res.status(400).json({ error: `Question '${question.label}' requires checkbox options` });
        }

        const option = optionMap.get(Number(answer.option_id));
        if (!option || option.question_id !== question.id) {
          return res.status(400).json({ error: `Question '${question.label}' contains an invalid option` });
        }

        validatedAnswers.push({ question_id: question.id, option_id: Number(answer.option_id), value: null });
      }

      continue;
    }

    const answer = answersForQuestion[0];
    const value = answer?.value ?? '';
    if (question.required && !String(value).trim()) {
      return res.status(400).json({ error: `Question '${question.label}' is required` });
    }
    if (!question.required && !String(value).trim()) {
      continue;
    }

    validatedAnswers.push({ question_id: question.id, option_id: null, value: String(value || '') });
  }

  const responseRecord = await createResponse(form.id);
  for (const answer of validatedAnswers) {
    await createAnswer({
      response_id: responseRecord.id,
      question_id: answer.question_id,
      option_id: answer.option_id,
      value: answer.value,
    });
  }

  res.status(201).json({ success: true });
});

module.exports = router;
