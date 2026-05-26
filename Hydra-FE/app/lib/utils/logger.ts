/**
 * Standardized Logging Utility
 *
 * Development: Full verbose logging
 * Production: Only warn and error
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const IS_PROD = process.env.NODE_ENV === 'production';

const formatMessage = (level: LogLevel, message: string, context?: unknown) => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

export const logger = {
  debug: (message: string, context?: unknown) => {
    if (!IS_PROD) {
      console.debug(formatMessage('debug', message, context));
    }
  },

  info: (message: string, context?: unknown) => {
    if (!IS_PROD) {
      console.info(formatMessage('info', message, context));
    }
  },

  warn: (message: string, context?: unknown) => {
    console.warn(formatMessage('warn', message, context));
    // Here as specified in Roadmap 5.2, we could send to Sentry
  },

  error: (message: string, context?: unknown) => {
    console.error(formatMessage('error', message, context));
    // Here as specified in Roadmap 5.2, we could send to Sentry
  },
};
