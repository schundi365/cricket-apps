import React from 'react';
import './ValidationError.css';

/**
 * ValidationError Component
 * Displays field-specific validation errors with suggested corrections
 * Validates: Requirements 10.6
 */
const ValidationError = ({ error, show }) => {
  if (!show || !error) return null;

  return (
    <div className="validation-error">
      <span className="validation-error-icon">⚠️</span>
      <div className="validation-error-content">
        <span className="validation-error-message">{error.message}</span>
        {error.suggestedCorrection && (
          <span className="validation-error-suggestion">
            Suggestion: {error.suggestedCorrection}
          </span>
        )}
      </div>
    </div>
  );
};

export default ValidationError;
