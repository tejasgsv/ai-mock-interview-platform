import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleCard from '../components/RoleCard';
import api from '../api/axios';
import './Dashboard.css';

const ROLES = [
  {
    role: 'Java Developer',
    icon: '☕',
    description: 'Core Java, OOP, Spring Boot, data structures, and system design questions.',
  },
  {
    role: 'Full Stack Developer',
    icon: '🌐',
    description: 'React, Node.js, REST APIs, databases, and end-to-end system architecture.',
  },
  {
    role: 'DevOps Engineer',
    icon: '⚙️',
    description: 'CI/CD pipelines, Docker, Kubernetes, cloud platforms, and infrastructure.',
  },
  {
    role: 'Android Developer',
    icon: '📱',
    description: 'Android SDK, Kotlin/Java, Jetpack components, and mobile best practices.',
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api
      .get('/interviews')
      .then(({ data }) => setRecentInterviews(data.interviews.slice(0, 5)))
      .catch(() => setRecentInterviews([]))
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleRoleSelect = (role) => {
    navigate('/interview', { state: { jobRole: role } });
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getScoreColor = (score) => {
    if (score >= 8) return '#48bb78';
    if (score >= 5) return '#ed8936';
    return '#e53e3e';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h1>Welcome back, <span>{user?.name?.split(' ')[0]}</span> 👋</h1>
        <p>Choose a role below to start an AI-powered mock interview session.</p>
      </div>

      <section className="dashboard-section">
        <h2 className="section-title">Select a Job Role</h2>
        <div className="roles-grid">
          {ROLES.map((r) => (
            <RoleCard key={r.role} {...r} onClick={handleRoleSelect} />
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="section-title">Recent Interviews</h2>
        {loadingHistory ? (
          <p className="muted-text">Loading history…</p>
        ) : recentInterviews.length === 0 ? (
          <div className="empty-state">
            <span>📋</span>
            <p>No interviews yet. Start one above!</p>
          </div>
        ) : (
          <div className="history-list">
            {recentInterviews.map((interview) => (
              <button
                key={interview._id}
                className="history-item"
                onClick={() => navigate(`/report/${interview._id}`)}
              >
                <div className="history-item-left">
                  <span className="history-role">{interview.jobRole}</span>
                  <span className="history-date">{formatDate(interview.createdAt)}</span>
                </div>
                <div className="history-item-right">
                  {interview.totalScore != null && (
                    <span
                      className="history-score"
                      style={{ color: getScoreColor(interview.totalScore) }}
                    >
                      {interview.totalScore.toFixed(1)}/10
                    </span>
                  )}
                  <span className="history-arrow">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
