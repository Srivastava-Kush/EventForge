import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar.jsx';
import Footer from '../components/common/Footer.jsx';
import ChatWindow from '../components/chatbot/ChatWindow.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function MainLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      {isAuthenticated && <ChatWindow />}
    </div>
  );

}
