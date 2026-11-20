import { config } from './config';

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (config.isTest) return;
    console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message, ...meta }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (config.isTest) return;
    console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), message, ...meta }));
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    if (config.isTest) return;
    console.error(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        error: error instanceof Error ? { message: error.message, stack: config.isProduction ? undefined : error.stack } : error,
        ...meta,
      })
    );
  },
};
