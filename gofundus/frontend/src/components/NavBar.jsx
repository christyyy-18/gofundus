import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css';
import { useToast } from './ToastProvider';
import { apiFetch } from '../services/api';

const NavBar = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  });

  useEffect(() => {
    const syncUser = () => {
      try { setUser(JSON.parse(localStorage.getItem('user') || 'null')); }
      catch { setUser(null); }
    };
    window.addEventListener('auth-change', syncUser);
    return () => window.removeEventListener('auth-change', syncUser);
  }, []);

  const handleLogout = async () => {
    await apiFetch('/auth/logout/', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    addToast('Logged out', 'success');
    navigate('/login');
  };

  const isLoggedIn = !!user;
  const initials = isLoggedIn
    ? (`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() ||
        user.username?.[0]?.toUpperCase() ||
        '?')
    : '?';
  const storedAvatar = isLoggedIn && user.username
    ? localStorage.getItem(`avatar_${user.username}`)
    : null;

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
                <NavLink to="/admin/support" className="navbar__link">Help & Support</NavLink>
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
