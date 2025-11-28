import { Logger } from '../logger'

describe('Logger', () => {
  let logger: Logger
  let consoleSpy: {
    log: jest.SpyInstance
    error: jest.SpyInstance
    warn: jest.SpyInstance
  }

  beforeEach(() => {
    logger = new Logger()
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('debug', () => {
    it('should log in development mode', () => {
      logger.debug('Test debug message', { key: 'value' })
      expect(consoleSpy.log).toHaveBeenCalled()
    })
  })

  describe('info', () => {
    it('should log in development mode', () => {
      logger.info('Test info message', { key: 'value' })
      expect(consoleSpy.log).toHaveBeenCalled()
    })
  })

  describe('warn', () => {
    it('should log warnings', () => {
      logger.warn('Test warning', { key: 'value' })
      expect(consoleSpy.warn).toHaveBeenCalled()
    })
  })

  describe('error', () => {
    it('should log errors', () => {
      const error = new Error('Test error')
      logger.error('Test error message', error, { key: 'value' })
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should handle errors without context', () => {
      const error = new Error('Test error')
      logger.error('Test error message', error)
      expect(consoleSpy.error).toHaveBeenCalled()
    })
  })

  describe('sanitizeContext', () => {
    it('should redact sensitive data', () => {
      const context = {
        password: 'secret123',
        token: 'abc123',
        email: 'test@example.com',
      }
      
      logger.info('Test message', context)
      const callArgs = consoleSpy.log.mock.calls[0][0]
      
      // Should contain redacted values
      expect(callArgs).toContain('[REDACTED]')
      expect(callArgs).not.toContain('secret123')
      expect(callArgs).not.toContain('abc123')
    })
  })
})









