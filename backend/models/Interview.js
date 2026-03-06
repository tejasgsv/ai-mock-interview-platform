const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: '' },
  score: { type: Number, min: 0, max: 10, default: null },
  feedback: { type: String, default: '' },
  timeSpent: { type: Number, default: 0 },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
      trim: true,
    },
    questions: [questionSchema],
    totalScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
