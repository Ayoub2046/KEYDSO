import { app } from './app';
import { config } from './common/config';
import { logger } from './common/logger';

const server = app.listen(config.port, () => {
  logger.info(`Keydso Maanta API listening on port ${config.port} in ${config.env} mode`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});
