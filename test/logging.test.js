import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Logger, LOG_LEVELS, PerformanceMonitor, ErrorTracker } from '../src/workers/logging.js'

describe('Logging Functions', () => {
  let consoleLogSpy, consoleErrorSpy;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  })

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  })

  describe('Logger', () => {
    it('should create a logger instance', () => {
      const logger = new Logger()
      expect(logger).toBeDefined()
      expect(logger.level).toBe(LOG_LEVELS.INFO)
      expect(logger.serviceName).toBe('sales-proxy')
    })

    it('should log messages at different levels', () => {
      const logger = new Logger(LOG_LEVELS.DEBUG) // Set to DEBUG level to see all messages
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.error('Test error message')
      logger.warn('Test warning message')
      logger.info('Test info message')
      logger.debug('Test debug message')

      expect(consoleLogSpy).toHaveBeenCalledTimes(4)
    })

    it('should respect log levels', () => {
      const logger = new Logger(LOG_LEVELS.WARN)
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('Test info message')
      logger.debug('Test debug message')

      // Should not log info or debug messages when level is WARN
      expect(consoleLogSpy).toHaveBeenCalledTimes(0)

      logger.error('Test error message')
      logger.warn('Test warning message')

      // Should log error and warning messages
      expect(consoleLogSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('PerformanceMonitor', () => {
    it('should measure function execution time', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await PerformanceMonitor.measure('test-operation', async () => {
        return 'test-result'
      })

      expect(result).toBe('test-result')
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    })

    it('should handle errors in measured functions', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await expect(PerformanceMonitor.measure('test-operation', async () => {
        throw new Error('Test error')
      })).rejects.toThrow('Test error')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('ErrorTracker', () => {
    it('should report errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = new Error('Test error')
      ErrorTracker.report(error, { context: 'test' })

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"ERROR"')
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test error"')
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"context":"test"')
      )
    })

    it('should wrap functions with error tracking', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrappedFn = ErrorTracker.wrap(async () => {
        throw new Error('Test error')
      }, { context: 'test' })

      await expect(wrappedFn()).rejects.toThrow('Test error')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      consoleErrorSpy.mockRestore()
    })
  })
})