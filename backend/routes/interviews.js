const express = require('express');
const auth = require('../middleware/auth');
const {
  generateQuestions,
  evaluateAnswer,
  saveInterview,
  getInterviews,
  getInterview,
} = require('../controllers/interviewController');

const router = express.Router();

router.use(auth);

router.post('/generate-questions', generateQuestions);
router.post('/evaluate-answer', evaluateAnswer);
router.post('/', saveInterview);
router.get('/', getInterviews);
router.get('/:id', getInterview);

module.exports = router;
