import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar" role="banner">
      <div className="container nav-content">
        <Link to="/" className="brand-logo" aria-label="EventForge - Home">
          <img
            src="/favicon.svg"
            alt="EventForge logo"
            width="32"
            height="32"
            className="brand-icon-svg"
          />
          <span className="brand-name">EventForge</span>
        </Link>

        <nav className="nav-links" aria-label="Primary Navigation">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>My Events</span>
              </NavLink>
              <NavLink to="/create-event" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <PlusCircle size={18} />
                <span>Plan Event</span>
              </NavLink>
            </>
          ) : (
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>Home</span>
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-badge" title={user?.email}>
                <UserIcon size={16} aria-hidden="true" />
                <span className="user-name">{user?.name}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
                aria-label="Log out of account"
              >
                <LogOut size={16} aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>

          ) : (
            <div className="auth-nav-buttons">
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
