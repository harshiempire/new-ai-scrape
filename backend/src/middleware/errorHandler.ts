import { ErrorRequestHandler } from "express";
import { AppError } from "../lib/errors";
import { ErrorCode, errorResponse } from "../lib/response";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);

  if (err instanceof AppError) {
    return errorResponse(
      res,
      err.statusCode,
      err.code,
      err.message,
      err.details,
    );
  }

  if (err instanceof ZodError) {
    return errorResponse(
      res,
      400,
      ErrorCode.VALIDATION_ERROR,
      "Validation failed",
      err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  if (err.code === "P2025") {
    return errorResponse(res, 404, ErrorCode.NOT_FOUND, "Resource not found");
  }

  return errorResponse(
    res,
    500,
    ErrorCode.INTERNAL_ERROR,
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message,
  );
};
