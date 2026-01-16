import { useState, useEffect } from 'react';

/**
 * useValidation Hook
 * Provides real-time validation as user types
 * Validates: Requirements 10.6
 */
const useValidation = (value, validators) => {
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateValue(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, validators]);

  const validateValue = (val) => {
    if (!validators || validators.length === 0) {
      setError(null);
      setIsValid(true);
      return;
    }

    for (const validator of validators) {
      const result = validator(val);
      if (result !== true) {
        setError(result);
        setIsValid(false);
        return;
      }
    }

    setError(null);
    setIsValid(true);
  };

  return { error, isValid };
};

// Common validators
export const validators = {
  required: (fieldName) => (value) => {
    if (!value || value === '' || value === null || value === undefined) {
      return {
        message: `${fieldName} is required`,
        suggestedCorrection: `Please enter a value for ${fieldName}`
      };
    }
    return true;
  },

  positive: (fieldName) => (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return {
        message: `${fieldName} must be a positive number`,
        suggestedCorrection: 'Enter a value greater than 0'
      };
    }
    return true;
  },

  nonNegative: (fieldName) => (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return {
        message: `${fieldName} must be a non-negative number`,
        suggestedCorrection: 'Enter a value greater than or equal to 0'
      };
    }
    return true;
  },

  numeric: (fieldName) => (value) => {
    if (value === '' || value === null || value === undefined) {
      return true; // Allow empty for optional fields
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      return {
        message: `${fieldName} must be a valid number`,
        suggestedCorrection: 'Enter a numeric value'
      };
    }
    return true;
  },

  minValue: (fieldName, min) => (value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num < min) {
      return {
        message: `${fieldName} must be at least ${min}`,
        suggestedCorrection: `Enter a value of ${min} or greater`
      };
    }
    return true;
  },

  maxValue: (fieldName, max) => (value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > max) {
      return {
        message: `${fieldName} must be at most ${max}`,
        suggestedCorrection: `Enter a value of ${max} or less`
      };
    }
    return true;
  },

  riskLimit: (capital) => (value) => {
    if (!capital || !value) return true;
    
    const capitalNum = parseFloat(capital);
    const lossNum = parseFloat(value);
    
    if (isNaN(capitalNum) || isNaN(lossNum)) return true;
    
    const riskPercentage = (lossNum / capitalNum) * 100;
    
    if (riskPercentage > 3) {
      return {
        message: `Risk exceeds 3% limit (${riskPercentage.toFixed(2)}%)`,
        suggestedCorrection: `Reduce stop loss distance or increase capital to stay within 3% risk limit`
      };
    }
    return true;
  }
};

export default useValidation;
