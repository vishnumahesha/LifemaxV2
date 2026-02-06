// Standard API Response wrapper - all endpoints use this format
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Helper to create success response
export function success<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

// Helper to create error response
export function error(code: string, message: string, details?: Record<string, unknown>): ApiResult<never> {
  return { ok: false, error: { code, message, details } };
}

// Common error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PHOTO_QUALITY_TOO_LOW: 'PHOTO_QUALITY_TOO_LOW',
  LOW_QUALITY: 'LOW_QUALITY',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  // View validation codes
  INVALID_VIEW: 'INVALID_VIEW',
  POSE_INVALID: 'POSE_INVALID',
  SUBJECT_NOT_VISIBLE: 'SUBJECT_NOT_VISIBLE',
  HEAVY_OCCLUSION: 'HEAVY_OCCLUSION',
  BEAUTY_FILTER_DETECTED: 'BEAUTY_FILTER_DETECTED',
  RESOLUTION_TOO_LOW: 'RESOLUTION_TOO_LOW',
  BLUR_DETECTED: 'BLUR_DETECTED',
} as const;
