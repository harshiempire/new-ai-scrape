import { Response } from "express";
import { ZodError } from "zod";
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  EXECUTION_ERROR = "EXECUTION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export function successResponse<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function errorResponse(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
) {
  return res
    .status(status)
    .json({ success: false, error: { code, message, details } });
}

export function formatZodError(zodError: ZodError): ApiError {
  return {
    code: ErrorCode.VALIDATION_ERROR,
    message: "Validation failed",
    details: zodError.issues.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    })),
  };
}
