import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { FiArrowLeft, FiAward, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../api/axios';
import './Report.css';

const scoreColor = (score) => {
  if (score >= 8) return '#48bb78';
  if (score >= 5) return '#ed8936';
  return '#e53e3e';
};

const ScoreRing = ({ score }) => {
  const pct = (score / 10) * 100;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="score-ring-wrapper">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e2130" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="score-ring-inner">
        <span className="score-value" style={{ color }}>
          {score.toFixed(1)}
        </span>
        <span className="score-out">/ 10</span>
      </div>
    </div>
  );
};

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/interviews/${id}`)
      .then(({ data }) => setInterview(data.interview))
      .catch(() => setError('Failed to load interview report.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="report-loading">
        <div className="spinner" />
        <p>Loading report…</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="report-error">
        <p>{error || 'Interview not found.'}</p>
        <button onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    );
  }

  const barData = interview.questions.map((q, i) => ({
    name: `Q${i + 1}`,
    score: q.score ?? 0,
  }));

  const radarData = interview.questions.map((q, i) => ({
    subject: `Q${i + 1}`,
    score: q.score ?? 0,
  }));

  const avgScore = interview.totalScore ?? 0;
  const passed = avgScore >= 6;

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <FiArrowLeft size={16} />
          Back to Dashboard
        </button>
        <h1>Interview Report</h1>
        <p className="report-meta">
          {interview.jobRole} &bull;{' '}
          {new Date(interview.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          {interview.duration ? ` • ${formatDuration(interview.duration)}` : ''}
        </p>
      </div>

      <div className="report-summary">
        <div className="summary-card score-card">
          <ScoreRing score={avgScore} />
          <div className="summary-card-info">
            <div className={`result-badge ${passed ? 'pass' : 'fail'}`}>
              {passed ? (
                <>
                  <FiCheckCircle size={16} /> Passed
                </>
              ) : (
                <>
                  <FiAlertCircle size={16} /> Needs Improvement
                </>
              )}
            </div>
            <p className="score-label">Overall Score</p>
            <p className="score-note">
              {avgScore >= 8
                ? 'Excellent performance! You demonstrated strong technical knowledge.'
                : avgScore >= 6
                ? 'Good performance. Some areas could be strengthened.'
                : 'Keep practicing. Review the feedback below to improve.'}
            </p>
          </div>
        </div>

        <div className="summary-card stats-card">
          <div className="stat">
            <FiAward size={20} className="stat-icon" />
            <span className="stat-value">{interview.questions.length}</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value" style={{ color: scoreColor(avgScore) }}>
              {avgScore.toFixed(1)}
            </span>
            <span className="stat-label">Avg Score</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">
              {interview.questions.filter((q) => (q.score ?? 0) >= 7).length}
            </span>
            <span className="stat-label">Strong Answers</span>
          </div>
        </div>
      </div>

      <div className="report-charts">
        <div className="chart-card">
          <h3>Score Per Question</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#718096', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1a1d2e', border: '1px solid #2d3748', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#6c63ff' }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={scoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Performance Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2d3748" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#718096', fontSize: 12 }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#6c63ff"
                fill="#6c63ff"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="report-questions">
        <h2>Question-by-Question Breakdown</h2>
        {interview.questions.map((q, i) => (
          <div key={i} className="question-report-card">
            <div className="qr-header">
              <span className="qr-number">Q{i + 1}</span>
              <p className="qr-question">{q.question}</p>
              <span className="qr-score" style={{ color: scoreColor(q.score ?? 0) }}>
                {q.score ?? '—'}/10
              </span>
            </div>
            <div className="qr-answer">
              <p className="qr-label">Your Answer</p>
              <p>{q.answer || <em>No answer provided</em>}</p>
            </div>
            {q.feedback && (
              <div className="qr-feedback">
                <p className="qr-label">AI Feedback</p>
                <p>{q.feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="report-actions">
        <button className="btn-try-again" onClick={() => navigate('/')}>
          Try Another Interview
        </button>
      </div>
    </div>
  );
};

export default Report;
