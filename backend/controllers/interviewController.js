const OpenAI = require('openai');
const Interview = require('../models/Interview');

const MOCK_QUESTIONS = {
  'Java Developer': [
    'Explain the concept of polymorphism in Java with an example.',
    'What is the difference between an interface and an abstract class in Java?',
    'How does garbage collection work in Java?',
    'Explain the Java memory model and the difference between stack and heap.',
    'What are Java Streams and how do you use them?',
  ],
  'Full Stack Developer': [
    'Explain the difference between REST and GraphQL APIs.',
    'How do you handle state management in a large React application?',
    'Describe the HTTP request lifecycle from browser to server and back.',
    'What are some strategies for optimizing database query performance?',
    'Explain the concept of CI/CD and how you would set it up for a web project.',
  ],
  'DevOps Engineer': [
    'What is the difference between containers and virtual machines?',
    'Explain the concept of Infrastructure as Code and tools you have used.',
    'How would you design a highly available and fault-tolerant system on AWS?',
    'Describe your experience with Kubernetes and how it manages containerized apps.',
    'What monitoring and alerting strategies do you recommend for production systems?',
  ],
  'Android Developer': [
    'Explain the Android Activity lifecycle and when each callback is invoked.',
    'What is the difference between ViewModel and LiveData in Android Jetpack?',
    'How do you handle background tasks in Android without blocking the main thread?',
    'Describe best practices for handling memory management in Android apps.',
    'What is Dependency Injection and how would you implement it in Android?',
  ],
};

const DEFAULT_QUESTIONS = [
  'Describe your background and relevant experience for this role.',
  'What are your greatest technical strengths?',
  'Describe a challenging technical problem you solved recently.',
  'How do you stay up to date with new technologies in your field?',
  'Where do you see yourself in five years within this career path?',
];

let openaiClient = null;

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const generateQuestions = async (req, res) => {
  try {
    const { jobRole } = req.body;
    if (!jobRole) {
      return res.status(400).json({ message: 'Job role is required' });
    }

    const client = getOpenAIClient();

    if (!client) {
      const questions = MOCK_QUESTIONS[jobRole] || DEFAULT_QUESTIONS;
      return res.json({ questions });
    }

    const prompt = `Generate 5 technical interview questions for a ${jobRole} position. 
Return only a JSON array of question strings, no additional text. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content.trim();
    const questions = JSON.parse(content);

    res.json({ questions });
  } catch (err) {
    console.error('generateQuestions error:', err.message);
    const { jobRole } = req.body;
    const questions = MOCK_QUESTIONS[jobRole] || DEFAULT_QUESTIONS;
    res.json({ questions, warning: 'AI unavailable, using preset questions' });
  }
};

const evaluateAnswer = async (req, res) => {
  try {
    const { question, answer, jobRole } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const client = getOpenAIClient();

    if (!client) {
      const mockScore = Math.floor(Math.random() * 4) + 6;
      return res.json({
        score: mockScore,
        feedback:
          'Good answer. You demonstrated solid understanding of the concept. Consider providing more specific examples from your experience to strengthen your response. ' +
          'Your explanation covered the key points well.',
      });
    }

    const prompt = `You are an expert technical interviewer evaluating a candidate's answer for a ${jobRole} position.

Question: ${question}

Candidate's Answer: ${answer}

Evaluate the answer and respond with a JSON object containing:
- "score": a number from 0 to 10 (0=no answer/completely wrong, 5=partially correct, 10=excellent)
- "feedback": a 2-3 sentence constructive feedback string

Respond with only the JSON object, no additional text.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content.trim();
    const result = JSON.parse(content);

    res.json({ score: result.score, feedback: result.feedback });
  } catch (err) {
    console.error('evaluateAnswer error:', err.message);
    res.json({
      score: 6,
      feedback:
        'Your answer showed a reasonable understanding of the topic. Try to be more specific with examples and technical details in future responses.',
      warning: 'AI unavailable, using default evaluation',
    });
  }
};

const saveInterview = async (req, res) => {
  try {
    const { jobRole, questions, totalScore, duration } = req.body;

    if (!jobRole || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'jobRole and questions array are required' });
    }

    const interview = await Interview.create({
      userId: req.user._id,
      jobRole,
      questions,
      totalScore,
      duration,
      status: 'completed',
    });

    res.status(201).json({ interview });
  } catch (err) {
    console.error('saveInterview error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-questions');

    res.json({ interviews });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ interview });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { generateQuestions, evaluateAnswer, saveInterview, getInterviews, getInterview };
