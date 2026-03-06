import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser, FiHome } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">🎯</span>
        <span className="brand-text">InterviewAI</span>
      </Link>

      {user && (
        <div className="navbar-actions">
          <Link to="/" className="nav-link">
            <FiHome size={16} />
            <span>Dashboard</span>
          </Link>
          <div className="nav-user">
            <FiUser size={16} />
            <span>{user.name}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} aria-label="Logout">
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
