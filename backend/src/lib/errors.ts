import { ErrorCode } from "./response";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      ErrorCode.NOT_FOUND,
      404,
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, 400, message, details);
  }
}

export class ExecutionError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.EXECUTION_ERROR, 409, message, details);
  }
}
