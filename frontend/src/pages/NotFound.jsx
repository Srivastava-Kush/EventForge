import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container not-found-page py-20 text-center">
      <div className="card max-w-md mx-auto p-12">
        <h1 className="text-6xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-muted mb-8">
          The requested page could not be located. Perhaps the link has moved or expired.
        </p>
        <Link to="/" className="btn btn-primary inline-flex">
          <Home size={18} />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
