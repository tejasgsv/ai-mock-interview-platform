import './QuestionCard.css';

const QuestionCard = ({ question, index, total }) => {
  return (
    <div className="question-card">
      <div className="question-meta">
        <span className="question-badge">Question {index + 1} of {total}</span>
      </div>
      <p className="question-text">{question}</p>
    </div>
  );
};

export default QuestionCard;
