import { useState, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';
import './Timer.css';

const Timer = ({ isRunning }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const format = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="timer">
      <FiClock size={16} />
      <span>{format(seconds)}</span>
    </div>
  );
};

export default Timer;
