/**
 * Logger utility for mobile app
 * Simple logging system for development and production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = __DEV__ || process.env.NODE_ENV === 'development'
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined

    const sanitized: LogContext = {}
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'auth']

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const sanitizedContext = this.sanitizeContext(context)
      const formatted = this.formatMessage('debug', message, sanitizedContext)
      console.log(formatted)
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const sanitizedContext = this.sanitizeContext(context)
      const formatted = this.formatMessage('info', message, sanitizedContext)
      console.log(formatted)
    }
  }

  warn(message: string, context?: LogContext): void {
    const sanitizedContext = this.sanitizeContext(context)
    const formatted = this.formatMessage('warn', message, sanitizedContext)
    
    if (this.isDevelopment) {
      console.warn(formatted)
    }
    // In production, warnings are silent (can be extended if needed)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const sanitizedContext = this.sanitizeContext(context)
    const formatted = this.formatMessage('error', message, sanitizedContext)
    
    // Always log errors, even in production
    console.error(formatted, error || '')
    if (error instanceof Error && this.isDevelopment) {
      console.error('Error stack:', error.stack)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export Logger class for testing
export { Logger }
