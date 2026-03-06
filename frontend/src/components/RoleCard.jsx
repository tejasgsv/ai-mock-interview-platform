import './RoleCard.css';

const RoleCard = ({ role, icon, description, onClick }) => {
  return (
    <button className="role-card" onClick={() => onClick(role)} aria-label={`Select ${role}`}>
      <div className="role-card-icon">{icon}</div>
      <h3 className="role-card-title">{role}</h3>
      <p className="role-card-description">{description}</p>
      <span className="role-card-action">Start Interview →</span>
    </button>
  );
};

export default RoleCard;
