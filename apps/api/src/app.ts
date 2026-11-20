import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { apiV1Router } from './modules';
import { AppError } from './common/errors';
import { logger } from './common/logger';
import { config } from './common/config';

export const app = express();

// Security Headers (OWASP Recommended)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'same-origin' },
  })
);

// General Rate Limiter (Protects against DoS / brute force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest, // Disable rate limiting during automated test runs
});

// Stricter Auth Rate Limiter (Protects against credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login attempts per 15 minutes per IP
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
});

app.use('/api/', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    credentials: true,
  })
);

// Payload parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Keydso Maanta Core API',
  });
});

// Mount API v1
app.use('/api/v1', apiV1Router);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Centralized Error Handling Middleware
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  // Malformed JSON parser error
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON payload syntax',
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof AppError) {
    logger.warn(`API Exception: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      path: req.originalUrl,
      details: err.details,
    });
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Zod Validation Error handling
  if (err && typeof err === 'object' && 'issues' in err) {
    const zodErr = err as { issues: Array<{ path: (string | number)[]; message: string }> };
    const formattedErrors = zodErr.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: formattedErrors,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Unhandled / Internal Server Errors
  logger.error('Unhandled Server Error', err, { path: req.originalUrl });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.isProduction ? 'An unexpected server error occurred' : (err as Error)?.message,
    },
    timestamp: new Date().toISOString(),
  });
});
