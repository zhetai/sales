/**
 * Logging and monitoring utilities for the Sales Proxy application
 */

/**
 * Log levels
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Logger class for structured logging
 */
export class Logger {
  constructor(level = LOG_LEVELS.INFO, serviceName = 'sales-proxy') {
    this.level = level;
    this.serviceName = serviceName;
  }

  /**
   * Log a message with metadata
   * @param {string} level - The log level
   * @param {string} message - The log message
   * @param {Object} metadata - Additional metadata
   */
  log(level, message, metadata = {}) {
    // Check if we should log this level
    if (this.getLogLevel(level) > this.level) {
      return;
    }

    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      service: this.serviceName,
      message: message,
      metadata: metadata
    };

    // In a Cloudflare Worker, we can't write to files, so we'll log to console
    // In production, you might want to send logs to a logging service
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log an error
   * @param {string} message - The error message
   * @param {Object} metadata - Additional metadata
   */
  error(message, metadata = {}) {
    this.log('ERROR', message, { ...metadata, stack: new Error().stack });
  }

  /**
   * Log a warning
   * @param {string} message - The warning message
   * @param {Object} metadata - Additional metadata
   */
  warn(message, metadata = {}) {
    this.log('WARN', message, metadata);
  }

  /**
   * Log an info message
   * @param {string} message - The info message
   * @param {Object} metadata - Additional metadata
   */
  info(message, metadata = {}) {
    this.log('INFO', message, metadata);
  }

  /**
   * Log a debug message
   * @param {string} message - The debug message
   * @param {Object} metadata - Additional metadata
   */
  debug(message, metadata = {}) {
    this.log('DEBUG', message, metadata);
  }

  /**
   * Get numeric log level from string
   * @param {string} level - The log level string
   * @returns {number} The numeric log level
   */
  getLogLevel(level) {
    return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.INFO;
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  /**
   * Measure the execution time of a function
   * @param {string} operation - The operation name
   * @param {Function} fn - The function to measure
   * @param {Object} context - The context to bind to the function
   * @returns {Promise<any>} The result of the function
   */
  static async measure(operation, fn, context = null) {
    const start = Date.now();
    try {
      const result = await fn.call(context);
      const duration = Date.now() - start;
      
      // Log performance metrics
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'performance-monitor',
        message: `Operation ${operation} completed`,
        metadata: {
          operation: operation,
          duration_ms: duration,
          status: 'success'
        }
      }));
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Log performance metrics for failed operations
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        service: 'performance-monitor',
        message: `Operation ${operation} failed`,
        metadata: {
          operation: operation,
          duration_ms: duration,
          status: 'error',
          error: error.message
        }
      }));
      
      throw error;
    }
  }

  /**
   * Create a timing decorator
   * @param {string} operation - The operation name
   * @returns {Function} A decorator function
   */
  static timing(operation) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        return await PerformanceMonitor.measure(operation, () => originalMethod.apply(this, args), this);
      };
      
      return descriptor;
    };
  }
}

/**
 * Request logging middleware
 * @param {Request} request - The incoming request
 * @param {Object} env - The environment variables
 * @param {Function} next - The next middleware function
 * @returns {Response} The response
 */
export async function requestLogger(request, env, next) {
  // Create a logger instance
  const logger = new Logger(
    env.LOG_LEVEL ? LOG_LEVELS[env.LOG_LEVEL] : LOG_LEVELS.INFO,
    'sales-proxy'
  );

  // Log the incoming request
  logger.info('Incoming request', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('cf-connecting-ip')
  });

  const start = Date.now();
  
  try {
    // Call the next middleware
    const response = await next();
    
    const duration = Date.now() - start;
    
    // Log the response
    logger.info('Request completed', {
      method: request.method,
      url: request.url,
      status: response.status,
      duration_ms: duration
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Log the error
    logger.error('Request failed', {
      method: request.method,
      url: request.url,
      error: error.message,
      stack: error.stack,
      duration_ms: duration
    });
    
    throw error;
  }
}

/**
 * Error tracking and reporting
 */
export class ErrorTracker {
  /**
   * Report an error
   * @param {Error} error - The error to report
   * @param {Object} context - Additional context
   */
  static report(error, context = {}) {
    // In a real application, you might send this to an error tracking service
    // like Sentry, Rollbar, or a custom error reporting API
    
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'error-tracker',
      message: error.message,
      metadata: {
        ...context,
        stack: error.stack,
        name: error.name
      }
    }));
  }
  
  /**
   * Wrap a function with error tracking
   * @param {Function} fn - The function to wrap
   * @param {Object} context - Additional context
   * @returns {Function} The wrapped function
   */
  static wrap(fn, context = {}) {
    return async function(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        ErrorTracker.report(error, context);
        throw error;
      }
    };
  }
}

// Export a default logger instance
export default new Logger();