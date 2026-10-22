import React from 'react';

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span className="loader-text">{text}</span>
    </div>
  );
}
