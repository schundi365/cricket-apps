/**
 * Comprehensive Error Handler for Multi-Asset Trading System
 * Handles validation, API, calculation, and data availability errors
 * Implements retry logic with exponential backoff and fallback mechanisms
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  API = 'API',
  CALCULATION = 'CALCULATION',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  NETWORK = 'NETWORK',
  WEBSOCKET = 'WEBSOCKET'
}

export enum DataSource {
  METALS = 'METALS',
  FOREX = 'FOREX',
  STOCKS = 'STOCKS',
  CACHE = 'CACHE'
}

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  DEGRADED = 'DEGRADED'
}

export interface ValidationError {
  type: ErrorType.VALIDATION;
  field: string;
  message: string;
  suggestedCorrection?: string;
}

export interface APIError {
  type: ErrorType.API;
  source: DataSource;
  message: string;
  statusCode?: number;
  retryable: boolean;
  timestamp: Date;
}

export interface CalculationError {
  type: ErrorType.CALCULATION;
  operation: string;
  message: string;
  context?: Record<string, any>;
}

export interface InsufficientDataError {
  type: ErrorType.INSUFFICIENT_DATA;
  asset: string;
  requiredDataPoints: number;
  availableDataPoints: number;
  message: string;
  affectedFeatures: string[];
}

export interface NetworkError {
  type: ErrorType.NETWORK;
  source: DataSource;
  message: string;
  retryAttempt: number;
  maxRetries: number;
}

export type AppError = ValidationError | APIError | CalculationError | InsufficientDataError | NetworkError;

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export interface ConnectionState {
  status: ConnectionStatus;
  lastSuccessfulUpdate: Date | null;
  consecutiveFailures: number;
  source: DataSource;
}

export class ErrorHandler {
  private retryConfig: RetryConfig = {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  private connectionStates: Map<DataSource, ConnectionState> = new Map();
  private errorListeners: Array<(error: AppError) => void> = [];

  constructor() {
    // Initialize connection states
    Object.values(DataSource).forEach(source => {
      this.connectionStates.set(source, {
        status: ConnectionStatus.DISCONNECTED,
        lastSuccessfulUpdate: null,
        consecutiveFailures: 0,
        source
      });
    });
  }

  /**
   * Handle validation errors - display field-specific errors
   */
  handleValidationError(error: ValidationError): void {
    console.warn(`Validation error in field "${error.field}": ${error.message}`);
    this.notifyListeners(error);
  }

  /**
   * Handle API errors with retry logic and fallback
   */
  async handleAPIError(
    error: APIError,
    retryFn?: () => Promise<any>,
    fallbackFn?: () => Promise<any>
  ): Promise<any> {
    console.error(`API error from ${error.source}: ${error.message}`);
    
    const state = this.connectionStates.get(error.source);
    if (state) {
      state.consecutiveFailures++;
      state.status = error.retryable ? ConnectionStatus.RECONNECTING : ConnectionStatus.DISCONNECTED;
      this.connectionStates.set(error.source, state);
    }

    this.notifyListeners(error);

    // Attempt retry if retryable and retry function provided
    if (error.retryable && retryFn) {
      try {
        const result = await this.retryWithBackoff(retryFn, error.source);
        this.markConnectionSuccess(error.source);
        return result;
      } catch (retryError) {
        console.error(`Retry failed for ${error.source} after ${this.retryConfig.maxRetries} attempts`);
      }
    }

    // Try fallback if available
    if (fallbackFn) {
      try {
        console.log(`Attempting fallback for ${error.source}`);
        const result = await fallbackFn();
        
        if (state) {
          state.status = ConnectionStatus.DEGRADED;
          this.connectionStates.set(error.source, state);
        }
        
        return result;
      } catch (fallbackError) {
        console.error(`Fallback failed for ${error.source}`);
      }
    }

    throw error;
  }

  /**
   * Handle calculation errors - log and maintain state
   */
  handleCalculationError(error: CalculationError): void {
    console.error(`Calculation error in ${error.operation}: ${error.message}`, error.context);
    this.notifyListeners(error);
  }

  /**
   * Handle insufficient data errors - disable affected features
   */
  handleInsufficientDataError(error: InsufficientDataError): void {
    console.warn(
      `Insufficient data for ${error.asset}: ` +
      `${error.availableDataPoints}/${error.requiredDataPoints} data points. ` +
      `Affected features: ${error.affectedFeatures.join(', ')}`
    );
    this.notifyListeners(error);
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    source: DataSource,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.retryConfig.maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
        this.retryConfig.maxDelay
      );

      console.log(`Retry attempt ${attempt + 1}/${this.retryConfig.maxRetries} for ${source} after ${delay}ms`);
      
      await this.sleep(delay);
      return this.retryWithBackoff(fn, source, attempt + 1);
    }
  }

  /**
   * Mark connection as successful
   */
  markConnectionSuccess(source: DataSource): void {
    const state = this.connectionStates.get(source);
    if (state) {
      state.status = ConnectionStatus.CONNECTED;
      state.lastSuccessfulUpdate = new Date();
      state.consecutiveFailures = 0;
      this.connectionStates.set(source, state);
    }
  }

  /**
   * Get connection status for a data source
   */
  getConnectionStatus(source: DataSource): ConnectionState | undefined {
    return this.connectionStates.get(source);
  }

  /**
   * Get all connection statuses
   */
  getAllConnectionStatuses(): Map<DataSource, ConnectionState> {
    return new Map(this.connectionStates);
  }

  /**
   * Create validation error
   */
  createValidationError(
    field: string,
    message: string,
    suggestedCorrection?: string
  ): ValidationError {
    return {
      type: ErrorType.VALIDATION,
      field,
      message,
      suggestedCorrection
    };
  }

  /**
   * Create API error
   */
  createAPIError(
    source: DataSource,
    message: string,
    statusCode?: number,
    retryable: boolean = true
  ): APIError {
    return {
      type: ErrorType.API,
      source,
      message,
      statusCode,
      retryable,
      timestamp: new Date()
    };
  }

  /**
   * Create calculation error
   */
  createCalculationError(
    operation: string,
    message: string,
    context?: Record<string, any>
  ): CalculationError {
    return {
      type: ErrorType.CALCULATION,
      operation,
      message,
      context
    };
  }

  /**
   * Create insufficient data error
   */
  createInsufficientDataError(
    asset: string,
    requiredDataPoints: number,
    availableDataPoints: number,
    affectedFeatures: string[]
  ): InsufficientDataError {
    return {
      type: ErrorType.INSUFFICIENT_DATA,
      asset,
      requiredDataPoints,
      availableDataPoints,
      message: `Insufficient data for ${asset}: ${availableDataPoints}/${requiredDataPoints} data points available`,
      affectedFeatures
    };
  }

  /**
   * Create network error
   */
  createNetworkError(
    source: DataSource,
    message: string,
    retryAttempt: number,
    maxRetries: number
  ): NetworkError {
    return {
      type: ErrorType.NETWORK,
      source,
      message,
      retryAttempt,
      maxRetries
    };
  }

  /**
   * Register error listener
   */
  onError(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  offError(listener: (error: AppError) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of an error
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset connection state for a source
   */
  resetConnectionState(source: DataSource): void {
    this.connectionStates.set(source, {
      status: ConnectionStatus.DISCONNECTED,
      lastSuccessfulUpdate: null,
      consecutiveFailures: 0,
      source
    });
  }

  /**
   * Check if data is fresh (less than 60 seconds old)
   */
  isDataFresh(source: DataSource): boolean {
    const state = this.connectionStates.get(source);
    if (!state || !state.lastSuccessfulUpdate) {
      return false;
    }

    const ageInSeconds = (Date.now() - state.lastSuccessfulUpdate.getTime()) / 1000;
    return ageInSeconds < 60;
  }

  /**
   * Get data age in seconds
   */
  getDataAge(source: DataSource): number | null {
    const state = this.connectionStates.get(source);
    if (!state || !state.lastSuccessfulUpdate) {
      return null;
    }

    return (Date.now() - state.lastSuccessfulUpdate.getTime()) / 1000;
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();
