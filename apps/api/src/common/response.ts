import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@keydso/shared-types';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string
): Response {
  const payload: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    message,
    data: {
      items,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize) || 1,
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(200).json(payload);
}
