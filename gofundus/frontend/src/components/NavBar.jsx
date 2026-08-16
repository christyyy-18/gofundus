import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css';
import { useToast } from './ToastProvider';

const NavBar = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    addToast('Logged out', 'success');
    navigate('/login');
  };

  const isLoggedIn = !!localStorage.getItem('token');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();
  const initials = (
    `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() ||
    user.username?.[0]?.toUpperCase() ||
    '?'
  );
  const storedAvatar = user.username ? localStorage.getItem(`avatar_${user.username}`) : null;

  return (
    <header className="navbar">
      <nav className="navbar__nav">
        <NavLink to="/" className="navbar__brand">GoFundUs</NavLink>

        {isLoggedIn ? (
          <>
            {user.role === 'institution_admin' ? (
              /* ── Institution admin: stripped nav ── */
              <>
                <NavLink to="/orphanage-portal" className="navbar__link">Dashboard</NavLink>
                <NavLink to="/profile" className="navbar__link navbar__profile-link">
                  {storedAvatar
                    ? <img src={storedAvatar} alt="avatar" className="navbar__avatar" style={{ objectFit: 'cover', padding: 0 }} />
                    : <span className="navbar__avatar">{initials}</span>
                  }
                  {user.first_name || user.username}
                </NavLink>
                <button className="navbar__btn" onClick={handleLogout}>Logout</button>
              </>
            ) : user.role === 'admin' ? (
              /* ── System admin: admin control panel nav ── */
              <>
                <NavLink to="/admin" className="navbar__link">Admin</NavLink>
                <NavLink to="/profile" className="navbar__link navbar__profile-link">
                  {storedAvatar
                    ? <img src={storedAvatar} alt="avatar" className="navbar__avatar" style={{ objectFit: 'cover', padding: 0 }} />
                    : <span className="navbar__avatar">{initials}</span>
                  }
                  {user.first_name || user.username}
                </NavLink>
                <button className="navbar__btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              /* ── Donor: full nav ── */
              <>
                <NavLink to="/dashboard" className="navbar__link">Institutions</NavLink>
                <NavLink to="/matches"   className="navbar__link">Match</NavLink>
                <NavLink to="/support"   className="navbar__link">Support</NavLink>
                <NavLink to="/profile" className="navbar__link navbar__profile-link">
                  {storedAvatar
                    ? <img src={storedAvatar} alt="avatar" className="navbar__avatar" style={{ objectFit: 'cover', padding: 0 }} />
                    : <span className="navbar__avatar">{initials}</span>
                  }
                  {user.first_name || user.username}
                </NavLink>
                <button className="navbar__btn" onClick={handleLogout}>Logout</button>
              </>
            )}
          </>
        ) : (
          <>
            <NavLink to="/login"    className="navbar__link">Login</NavLink>
            <NavLink to="/register" className="navbar__link">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default NavBar;
