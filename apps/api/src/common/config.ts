import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // Fallback to current working dir .env

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-jwt-secret-replace-in-production-64bytes-min',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-insecure-refresh-secret-replace-in-production-64bytes',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  receiptHmacSecret: process.env.RECEIPT_HMAC_SECRET || 'dev-receipt-hmac-secret-min-32-chars-long',
  expenseDualApprovalThreshold: parseFloat(process.env.EXPENSE_DUAL_APPROVAL_THRESHOLD || '500.00'),
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};
