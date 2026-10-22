import React from 'react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">

      <div className="container footer-content">
        <p className="footer-text">
          &copy; {CURRENT_YEAR} EventForge AI &bull; Intelligent Event Planning &amp; MERN Architecture.
        </p>
      </div>
    </footer>
  );
}

