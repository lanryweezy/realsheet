/**
 * Comprehensive Error Handling Service
 * Provides robust error handling, logging, and recovery
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  FORMULA = 'formula',
  AI = 'ai',
  API = 'api',
  DATA = 'data',
  STORAGE = 'storage',
  NETWORK = 'network',
  VALIDATION = 'validation',
  SYSTEM = 'system',
}

export interface ErrorDetails {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: any;
  stack?: string;
  recoverable: boolean;
  suggestion?: string;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context?: any;
  public readonly recoverable: boolean;
  public readonly suggestion?: string;

  constructor(details: Omit<ErrorDetails, 'timestamp' | 'stack'>) {
    super(details.message);
    this.name = 'AppError';
    this.code = details.code;
    this.category = details.category;
    this.severity = details.severity;
    this.timestamp = new Date();
    this.context = details.context;
    this.recoverable = details.recoverable;
    this.suggestion = details.suggestion;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
      recoverable: this.recoverable,
      suggestion: this.suggestion,
    };
  }
}

export class ErrorHandler {
  private static errors: ErrorDetails[] = [];
  private static maxErrors = 100;
  private static listeners: Array<(error: ErrorDetails) => void> = [];

  /**
   * Handle error with appropriate logging and recovery
   */
  static handle(error: Error | AppError, context?: any): ErrorDetails {
    let errorDetails: ErrorDetails;

    if (error instanceof AppError) {
      errorDetails = error.toJSON();
    } else {
      // Convert generic error to AppError
      errorDetails = {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.MEDIUM,
        timestamp: new Date(),
        context,
        stack: error.stack,
        recoverable: true,
        suggestion: 'Please try again or contact support if the issue persists.',
      };
    }

    // Log error
    this.log(errorDetails);

    // Store error
    this.store(errorDetails);

    // Notify listeners
    this.notify(errorDetails);

    // Attempt recovery if possible
    if (errorDetails.recoverable) {
      this.attemptRecovery(errorDetails);
    }

    return errorDetails;
  }

  /**
   * Log error to console with appropriate level
   */
  private static log(error: ErrorDetails): void {
    const logMessage = `[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`;

    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info(logMessage, error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, error);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error(logMessage, error);
        break;
    }
  }

  /**
   * Store error for later analysis
   */
  private static store(error: ErrorDetails): void {
    this.errors.push(error);

    // Enforce max errors limit
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Persist critical errors to localStorage
    if (error.severity === ErrorSeverity.CRITICAL) {
      try {
        const criticalErrors = JSON.parse(localStorage.getItem('critical_errors') || '[]');
        criticalErrors.push(error);
        localStorage.setItem('critical_errors', JSON.stringify(criticalErrors.slice(-10)));
      } catch (e) {
        console.error('Failed to persist critical error:', e);
      }
    }
  }

  /**
   * Notify error listeners
   */
  private static notify(error: ErrorDetails): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error listener failed:', e);
      }
    });
  }

  /**
   * Attempt automatic recovery
   */
  private static attemptRecovery(error: ErrorDetails): void {
    switch (error.category) {
      case ErrorCategory.STORAGE:
        this.recoverStorage();
        break;
      case ErrorCategory.NETWORK:
        this.recoverNetwork();
        break;
      case ErrorCategory.DATA:
        this.recoverData();
        break;
    }
  }

  private static recoverStorage(): void {
    try {
      // Clear corrupted data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        try {
          JSON.parse(localStorage.getItem(key) || '');
        } catch (e) {
          console.warn(`Removing corrupted storage key: ${key}`);
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Storage recovery failed:', e);
    }
  }

  private static recoverNetwork(): void {
    // Implement retry logic or offline mode
    console.info('Network recovery: Switching to offline mode');
  }

  private static recoverData(): void {
    // Attempt to restore from backup
    console.info('Data recovery: Attempting to restore from backup');
  }

  /**
   * Add error listener
   */
  static addListener(listener: (error: ErrorDetails) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get all errors
   */
  static getErrors(filter?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    since?: Date;
  }): ErrorDetails[] {
    let filtered = [...this.errors];

    if (filter) {
      if (filter.category) {
        filtered = filtered.filter(e => e.category === filter.category);
      }
      if (filter.severity) {
        filtered = filtered.filter(e => e.severity === filter.severity);
      }
      if (filter.since) {
        filtered = filtered.filter(e => e.timestamp >= filter.since);
      }
    }

    return filtered;
  }

  /**
   * Get error statistics
   */
  static getStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recentErrors: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let recentErrors = 0;

    this.errors.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      if (error.timestamp >= oneHourAgo) {
        recentErrors++;
      }
    });

    return {
      total: this.errors.length,
      byCategory,
      bySeverity,
      recentErrors,
    };
  }

  /**
   * Clear all errors
   */
  static clear(): void {
    this.errors = [];
  }

  /**
   * Export errors for debugging
   */
  static export(): string {
    return JSON.stringify(this.errors, null, 2);
  }
}

/**
 * Common error factories
 */
export class ErrorFactory {
  static formulaError(message: string, formula: string): AppError {
    return new AppError({
      code: 'FORMULA_ERROR',
      message,
      category: ErrorCategory.FORMULA,
      severity: ErrorSeverity.LOW,
      context: { formula },
      recoverable: true,
      suggestion: 'Check your formula syntax. Use =EXPLAIN() to understand formulas.',
    });
  }

  static aiError(message: string, functionName: string): AppError {
    return new AppError({
      code: 'AI_ERROR',
      message,
      category: ErrorCategory.AI,
      severity: ErrorSeverity.MEDIUM,
      context: { functionName },
      recoverable: true,
      suggestion: 'Check your API key and internet connection. AI functions require Gemini API access.',
    });
  }

  static apiError(message: string, endpoint: string, statusCode?: number): AppError {
    return new AppError({
      code: 'API_ERROR',
      message,
      category: ErrorCategory.API,
      severity: ErrorSeverity.MEDIUM,
      context: { endpoint, statusCode },
      recoverable: true,
      suggestion: 'Check your API credentials and network connection.',
    });
  }

  static dataError(message: string, context?: any): AppError {
    return new AppError({
      code: 'DATA_ERROR',
      message,
      category: ErrorCategory.DATA,
      severity: ErrorSeverity.HIGH,
      context,
      recoverable: true,
      suggestion: 'Check your data format and try again.',
    });
  }

  static storageError(message: string): AppError {
    return new AppError({
      code: 'STORAGE_ERROR',
      message,
      category: ErrorCategory.STORAGE,
      severity: ErrorSeverity.HIGH,
      context: {},
      recoverable: true,
      suggestion: 'Clear browser cache or try a different browser.',
    });
  }

  static networkError(message: string): AppError {
    return new AppError({
      code: 'NETWORK_ERROR',
      message,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      context: {},
      recoverable: true,
      suggestion: 'Check your internet connection and try again.',
    });
  }

  static validationError(message: string, field: string): AppError {
    return new AppError({
      code: 'VALIDATION_ERROR',
      message,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      context: { field },
      recoverable: true,
      suggestion: 'Please correct the highlighted fields.',
    });
  }
}

/**
 * Retry utility for failed operations
 */
export class RetryHandler {
  static async retry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoff?: boolean;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = true,
      onRetry,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
          
          if (onRetry) {
            onRetry(attempt, lastError);
          }

          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError!;
  }
}

/**
 * Circuit breaker for failing services
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new AppError({
          code: 'CIRCUIT_OPEN',
          message: 'Service temporarily unavailable',
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.HIGH,
          recoverable: true,
          suggestion: 'Please try again in a few moments.',
        });
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime.getTime() >= this.timeout;
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = undefined;
  }
}
