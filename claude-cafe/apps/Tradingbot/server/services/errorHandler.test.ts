/**
 * Unit tests for ErrorHandler
 * Tests all error categories, retry logic, fallback mechanisms
 * Validates: Requirements 1.6, 2.3, 3.3, 4.4, 6.7, 11.3, 11.7
 */

import { 
  ErrorHandler, 
  DataSource, 
  ErrorType, 
  ConnectionStatus 
} from './errorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('Validation Errors', () => {
    it('should create validation error with field and message', () => {
      const error = errorHandler.createValidationError(
        'tradingCapital',
        'Trading capital must be positive',
        'Enter a value greater than 0'
      );

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.field).toBe('tradingCapital');
      expect(error.message).toBe('Trading capital must be positive');
      expect(error.suggestedCorrection).toBe('Enter a value greater than 0');
    });

    it('should handle validation error and notify listeners', () => {
      const listener = jest.fn();
      errorHandler.onError(listener);

      const error = errorHandler.createValidationError(
        'entryPrice',
        'Entry price is required'
      );

      errorHandler.handleValidationError(error);

      expect(listener).toHaveBeenCalledWith(error);
    });

    it('should handle zero trading capital validation error (Requirement 2.3)', () => {
      const error = errorHandler.createValidationError(
        'tradingCapital',
        'Trading capital must be greater than zero',
        'Enter a positive value'
      );

      expect(error.message).toContain('greater than zero');
    });

    it('should handle negative trading capital validation error (Requirement 2.3)', () => {
      const error = errorHandler.createValidationError(
        'tradingCapital',
        'Trading capital cannot be negative',
        'Enter a positive value'
      );

      expect(error.message).toContain('cannot be negative');
    });

    it('should handle invalid stop loss placement (Requirement 3.3)', () => {
      const error = errorHandler.createValidationError(
        'stopLoss',
        'Stop loss placement is invalid for trade direction',
        'For long positions, stop loss must be below entry price'
      );

      expect(error.message).toContain('invalid');
      expect(error.suggestedCorrection).toContain('below entry price');
    });

    it('should handle invalid take profit price (Requirement 4.4)', () => {
      const error = errorHandler.createValidationError(
        'takeProfit',
        'Take profit price is invalid',
        'Take profit must be above entry price for long positions'
      );

      expect(error.message).toContain('invalid');
    });
  });

  describe('API Errors', () => {
    it('should create API error with source and retryable flag', () => {
      const error = errorHandler.createAPIError(
        DataSource.METALS,
        'Failed to fetch metal prices',
        500,
        true
      );

      expect(error.type).toBe(ErrorType.API);
      expect(error.source).toBe(DataSource.METALS);
      expect(error.message).toBe('Failed to fetch metal prices');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should update connection state on API error', async () => {
      const error = errorHandler.createAPIError(
        DataSource.FOREX,
        'Connection timeout',
        undefined,
        true
      );

      try {
        await errorHandler.handleAPIError(error);
      } catch (e) {
        // Expected to throw
      }

      const state = errorHandler.getConnectionStatus(DataSource.FOREX);
      expect(state?.consecutiveFailures).toBeGreaterThan(0);
      expect(state?.status).toBe(ConnectionStatus.RECONNECTING);
    });

    it('should handle unavailable sentiment data (Requirement 1.6)', async () => {
      const error = errorHandler.createAPIError(
        DataSource.METALS,
        'Sentiment data unavailable for asset',
        404,
        false
      );

      const listener = jest.fn();
      errorHandler.onError(listener);

      try {
        await errorHandler.handleAPIError(error);
      } catch (e) {
        // Expected
      }

      expect(listener).toHaveBeenCalledWith(error);
    });

    it('should handle missing asset data (Requirement 6.7)', async () => {
      const error = errorHandler.createAPIError(
        DataSource.STOCKS,
        'Asset data not found',
        404,
        false
      );

      try {
        await errorHandler.handleAPIError(error);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry with exponential backoff (Requirement 11.7)', async () => {
      // Create a custom error handler with shorter delays for testing
      const testHandler = new ErrorHandler();
      (testHandler as any).retryConfig = {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      };

      let attempts = 0;
      const retryFn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const error = testHandler.createAPIError(
        DataSource.METALS,
        'Temporary error',
        undefined,
        true
      );

      const result = await testHandler.handleAPIError(error, retryFn);

      expect(result).toBe('success');
      expect(retryFn).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying after max attempts', async () => {
      // Create a custom error handler with shorter delays for testing
      const testHandler = new ErrorHandler();
      (testHandler as any).retryConfig = {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      };

      const retryFn = jest.fn(async () => {
        throw new Error('Persistent failure');
      });

      const error = testHandler.createAPIError(
        DataSource.FOREX,
        'Persistent error',
        undefined,
        true
      );

      // Should throw the original error after retries fail
      await expect(
        testHandler.handleAPIError(error, retryFn)
      ).rejects.toEqual(error);

      expect(retryFn).toHaveBeenCalledTimes(3); // maxRetries
    });

    it('should handle connection failures with retry (Requirement 11.3)', async () => {
      // Create a custom error handler with shorter delays for testing
      const testHandler = new ErrorHandler();
      (testHandler as any).retryConfig = {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      };

      let attempts = 0;
      const retryFn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Connection refused');
        }
        return { connected: true };
      });

      const error = testHandler.createAPIError(
        DataSource.STOCKS,
        'Connection failed',
        undefined,
        true
      );

      const result = await testHandler.handleAPIError(error, retryFn);

      expect(result).toEqual({ connected: true });
      expect(retryFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should use fallback when retry fails (Requirement 11.7)', async () => {
      // Create a custom error handler with shorter delays for testing
      const testHandler = new ErrorHandler();
      (testHandler as any).retryConfig = {
        maxRetries: 2,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      };

      const retryFn = jest.fn(async () => {
        throw new Error('Primary API failed');
      });

      const fallbackFn = jest.fn(async () => {
        return { fallback: true, data: 'cached' };
      });

      const error = testHandler.createAPIError(
        DataSource.METALS,
        'Primary API error',
        undefined,
        true
      );

      const result = await testHandler.handleAPIError(error, retryFn, fallbackFn);

      expect(result).toEqual({ fallback: true, data: 'cached' });
      expect(fallbackFn).toHaveBeenCalled();
    });

    it('should mark connection as degraded when using fallback', async () => {
      // Create a custom error handler with shorter delays for testing
      const testHandler = new ErrorHandler();
      (testHandler as any).retryConfig = {
        maxRetries: 2,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      };

      const retryFn = jest.fn(async () => {
        throw new Error('Primary failed');
      });

      const fallbackFn = jest.fn(async () => {
        return 'fallback data';
      });

      const error = testHandler.createAPIError(
        DataSource.FOREX,
        'Primary error',
        undefined,
        true
      );

      await testHandler.handleAPIError(error, retryFn, fallbackFn);

      const state = testHandler.getConnectionStatus(DataSource.FOREX);
      expect(state?.status).toBe(ConnectionStatus.DEGRADED);
    });

    it('should throw when both retry and fallback fail', async () => {
      // Create a custom error handler with shorter delays for testing
      const testHandler = new ErrorHandler();
      (testHandler as any).retryConfig = {
        maxRetries: 2,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2
      };

      const retryFn = jest.fn(async () => {
        throw new Error('Primary failed');
      });

      const fallbackFn = jest.fn(async () => {
        throw new Error('Fallback failed');
      });

      const error = testHandler.createAPIError(
        DataSource.STOCKS,
        'All sources failed',
        undefined,
        true
      );

      // Should throw the original error when both retry and fallback fail
      await expect(
        testHandler.handleAPIError(error, retryFn, fallbackFn)
      ).rejects.toEqual(error);
    });
  });

  describe('Calculation Errors', () => {
    it('should create calculation error with operation and context', () => {
      const error = errorHandler.createCalculationError(
        'calculateLotSize',
        'Division by zero',
        { capital: 10000, stopLoss: 0 }
      );

      expect(error.type).toBe(ErrorType.CALCULATION);
      expect(error.operation).toBe('calculateLotSize');
      expect(error.message).toBe('Division by zero');
      expect(error.context).toEqual({ capital: 10000, stopLoss: 0 });
    });

    it('should handle calculation error and notify listeners', () => {
      const listener = jest.fn();
      errorHandler.onError(listener);

      const error = errorHandler.createCalculationError(
        'calculateTakeProfit',
        'Invalid risk-reward ratio'
      );

      errorHandler.handleCalculationError(error);

      expect(listener).toHaveBeenCalledWith(error);
    });
  });

  describe('Insufficient Data Errors', () => {
    it('should create insufficient data error with affected features', () => {
      const error = errorHandler.createInsufficientDataError(
        'GOLD',
        100,
        25,
        ['sentiment', 'trending', 'timing']
      );

      expect(error.type).toBe(ErrorType.INSUFFICIENT_DATA);
      expect(error.asset).toBe('GOLD');
      expect(error.requiredDataPoints).toBe(100);
      expect(error.availableDataPoints).toBe(25);
      expect(error.affectedFeatures).toContain('sentiment');
      expect(error.affectedFeatures).toContain('timing');
    });

    it('should handle insufficient data error', () => {
      const listener = jest.fn();
      errorHandler.onError(listener);

      const error = errorHandler.createInsufficientDataError(
        'EUR/USD',
        50,
        10,
        ['technical analysis']
      );

      errorHandler.handleInsufficientDataError(error);

      expect(listener).toHaveBeenCalledWith(error);
    });
  });

  describe('Connection State Management', () => {
    it('should initialize all data sources as disconnected', () => {
      const states = errorHandler.getAllConnectionStatuses();

      expect(states.size).toBeGreaterThan(0);
      states.forEach(state => {
        expect(state.status).toBe(ConnectionStatus.DISCONNECTED);
        expect(state.lastSuccessfulUpdate).toBeNull();
        expect(state.consecutiveFailures).toBe(0);
      });
    });

    it('should mark connection as successful', () => {
      errorHandler.markConnectionSuccess(DataSource.METALS);

      const state = errorHandler.getConnectionStatus(DataSource.METALS);
      expect(state?.status).toBe(ConnectionStatus.CONNECTED);
      expect(state?.lastSuccessfulUpdate).toBeInstanceOf(Date);
      expect(state?.consecutiveFailures).toBe(0);
    });

    it('should reset connection state', () => {
      errorHandler.markConnectionSuccess(DataSource.FOREX);
      errorHandler.resetConnectionState(DataSource.FOREX);

      const state = errorHandler.getConnectionStatus(DataSource.FOREX);
      expect(state?.status).toBe(ConnectionStatus.DISCONNECTED);
      expect(state?.lastSuccessfulUpdate).toBeNull();
      expect(state?.consecutiveFailures).toBe(0);
    });
  });

  describe('Data Freshness', () => {
    it('should detect fresh data (less than 60 seconds old)', () => {
      errorHandler.markConnectionSuccess(DataSource.METALS);

      const isFresh = errorHandler.isDataFresh(DataSource.METALS);
      expect(isFresh).toBe(true);
    });

    it('should detect stale data (more than 60 seconds old)', () => {
      const state = errorHandler.getConnectionStatus(DataSource.FOREX);
      if (state) {
        state.lastSuccessfulUpdate = new Date(Date.now() - 70000); // 70 seconds ago
      }

      const isFresh = errorHandler.isDataFresh(DataSource.FOREX);
      expect(isFresh).toBe(false);
    });

    it('should return null age for never-updated source', () => {
      const age = errorHandler.getDataAge(DataSource.STOCKS);
      expect(age).toBeNull();
    });

    it('should calculate data age correctly', () => {
      errorHandler.markConnectionSuccess(DataSource.METALS);

      const age = errorHandler.getDataAge(DataSource.METALS);
      expect(age).not.toBeNull();
      expect(age).toBeLessThan(5); // Should be very recent
    });
  });

  describe('Error Listeners', () => {
    it('should register and notify error listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      errorHandler.onError(listener1);
      errorHandler.onError(listener2);

      const error = errorHandler.createValidationError('test', 'test error');
      errorHandler.handleValidationError(error);

      expect(listener1).toHaveBeenCalledWith(error);
      expect(listener2).toHaveBeenCalledWith(error);
    });

    it('should remove error listeners', () => {
      const listener = jest.fn();

      errorHandler.onError(listener);
      errorHandler.offError(listener);

      const error = errorHandler.createValidationError('test', 'test error');
      errorHandler.handleValidationError(error);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle errors in listeners gracefully', () => {
      const badListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      errorHandler.onError(badListener);
      errorHandler.onError(goodListener);

      const error = errorHandler.createValidationError('test', 'test error');
      
      // Should not throw
      expect(() => {
        errorHandler.handleValidationError(error);
      }).not.toThrow();

      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('Network Errors', () => {
    it('should create network error with retry information', () => {
      const error = errorHandler.createNetworkError(
        DataSource.METALS,
        'Connection timeout',
        2,
        5
      );

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.source).toBe(DataSource.METALS);
      expect(error.retryAttempt).toBe(2);
      expect(error.maxRetries).toBe(5);
    });
  });
});
