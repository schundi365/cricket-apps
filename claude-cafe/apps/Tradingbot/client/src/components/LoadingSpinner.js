import React from 'react';
import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * Displays loading state for async operations
 * Validates: Requirements 10.6
 */
const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  return (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <div className="spinner"></div>
      {message && <span className="loading-message">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
