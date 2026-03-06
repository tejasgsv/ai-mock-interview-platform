const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const {
  generateQuestions,
  evaluateAnswer,
  saveInterview,
  getInterviews,
  getInterview,
} = require('../controllers/interviewController');

const router = express.Router();

const interviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests, please slow down.' },
});

const routerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Apply general rate limit first to protect the auth DB lookup from abuse,
// then verify the JWT token for all routes.
router.use(routerLimiter);
router.use(auth);

router.post('/generate-questions', aiLimiter, generateQuestions);
router.post('/evaluate-answer', aiLimiter, evaluateAnswer);
router.post('/', interviewLimiter, saveInterview);
router.get('/', interviewLimiter, getInterviews);
router.get('/:id', interviewLimiter, getInterview);

module.exports = router;
