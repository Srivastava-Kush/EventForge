import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle.jsx';

export default function AuthLayout() {
  return (
    <div className="auth-shell relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="auth-brand-header">
        <Link to="/" className="brand-logo" aria-label="EventForge Home">
          <div className="brand-icon" aria-hidden="true">
            <Calendar size={24} />
          </div>
          <span className="brand-name">EventForge</span>
        </Link>
      </div>
      <div className="auth-card-container">
        <Outlet />
      </div>
    </div>
  );
}

