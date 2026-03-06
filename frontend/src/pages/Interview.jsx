import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMaximize, FiMinimize, FiSend, FiLoader } from 'react-icons/fi';
import QuestionCard from '../components/QuestionCard';
import SpeechInput from '../components/SpeechInput';
import Timer from '../components/Timer';
import api from '../api/axios';
import './Interview.css';

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const jobRole = location.state?.jobRole;

  const [phase, setPhase] = useState('loading'); // loading | interview | submitting
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const containerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!jobRole) {
      navigate('/');
      return;
    }
    initSession();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initSession = async () => {
    try {
      const [questionsData] = await Promise.all([
        api.post('/interviews/generate-questions', { jobRole }),
        startCamera(),
      ]);
      setQuestions(questionsData.data.questions);
      startTimeRef.current = Date.now();
      setPhase('interview');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview session.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // Camera access denied is non-fatal
    }
  };

  const handleTranscript = useCallback((text) => {
    setCurrentAnswer((prev) => prev + text);
  }, []);

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    setSubmitting(true);

    try {
      const { data } = await api.post('/interviews/evaluate-answer', {
        question: questions[currentIndex],
        answer: currentAnswer.trim(),
        jobRole,
      });

      const updatedAnswers = [
        ...answers,
        {
          question: questions[currentIndex],
          answer: currentAnswer.trim(),
          score: data.score,
          feedback: data.feedback,
        },
      ];

      setAnswers(updatedAnswers);
      setCurrentAnswer('');

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        await finishInterview(updatedAnswers);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to evaluate answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const finishInterview = async (completedAnswers) => {
    setPhase('submitting');
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const totalScore =
      completedAnswers.reduce((sum, a) => sum + (a.score || 0), 0) / completedAnswers.length;

    try {
      const { data } = await api.post('/interviews', {
        jobRole,
        questions: completedAnswers,
        totalScore: parseFloat(totalScore.toFixed(1)),
        duration,
      });
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      navigate(`/report/${data.interview._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save interview.');
      setPhase('interview');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!jobRole) return null;

  if (phase === 'loading') {
    return (
      <div className="interview-loading">
        <FiLoader className="spin" size={32} />
        <p>Setting up your interview session…</p>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="interview-loading">
        <FiLoader className="spin" size={32} />
        <p>Generating your results…</p>
      </div>
    );
  }

  return (
    <div className="interview-container" ref={containerRef}>
      <div className="interview-header">
        <div className="interview-header-left">
          <span className="interview-role-badge">{jobRole}</span>
          <Timer isRunning={phase === 'interview'} />
        </div>
        <div className="interview-header-right">
          <div className="progress-text">
            {currentIndex + 1} / {questions.length}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            />
          </div>
          <button
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
          </button>
        </div>
      </div>

      {error && <div className="interview-error">{error}</div>}

      <div className="interview-body">
        <div className="interview-main">
          <QuestionCard
            question={questions[currentIndex]}
            index={currentIndex}
            total={questions.length}
          />

          <div className="answer-section">
            <div className="answer-toolbar">
              <span className="answer-label">Your Answer</span>
              <SpeechInput onTranscript={handleTranscript} disabled={submitting} />
            </div>
            <textarea
              className="answer-textarea"
              placeholder="Speak using the microphone or type your answer here…"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={6}
              disabled={submitting}
            />
            <button
              className="btn-submit-answer"
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer.trim() || submitting}
            >
              {submitting ? (
                <>
                  <FiLoader className="spin" size={16} />
                  <span>Evaluating…</span>
                </>
              ) : currentIndex + 1 === questions.length ? (
                <>
                  <FiSend size={16} />
                  <span>Submit & Finish</span>
                </>
              ) : (
                <>
                  <FiSend size={16} />
                  <span>Submit Answer</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="interview-sidebar">
          <div className="camera-preview">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="camera-video"
            />
            <div className="camera-label">📹 You</div>
          </div>

          <div className="answered-list">
            <p className="answered-title">Progress</p>
            {questions.map((_, i) => (
              <div
                key={i}
                className={`answered-dot ${
                  i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'pending'
                }`}
              >
                <span>{i + 1}</span>
                <span>
                  {i < currentIndex ? '✓ Answered' : i === currentIndex ? '← Current' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
