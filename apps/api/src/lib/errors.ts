export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(opts: {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  }) {
    super(opts.message);
    this.statusCode = opts.statusCode;
    this.code = opts.code;
    this.details = opts.details;
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super({ statusCode: 404, code: "not_found", message });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Missing or invalid API key") {
    super({ statusCode: 401, code: "unauthorized", message });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ statusCode: 400, code: "validation_error", message, details });
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super({ statusCode: 409, code: "conflict", message });
  }
}

export class ProviderError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ statusCode: 502, code: "provider_error", message, details });
  }
}

export class QueueError extends AppError {
  constructor(message: string) {
    super({ statusCode: 503, code: "queue_error", message });
  }
}
