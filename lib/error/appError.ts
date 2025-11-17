export class AppError {
  public readonly message: string;
  public readonly error?: Object;
  public readonly statusCode: number;
  public readonly name?: any;
  public readonly stack?: any;

  constructor(message: string, statusCode: number, error?: Object, stack?: any) {
    this.name = this.constructor.name;
    this.message = message;
    this.statusCode = statusCode;
    this.error = error;
    if (stack) {
      this.stack = stack;
    } else {
      // Capture stack trace excluding constructor
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }

  toJson(): object {
    return {
      message: this.message,
      error: this.error,
      stack: this.stack
    };
  }

  toString(): string {
    return `${this.name}: ${this.message} (Status: ${this.statusCode})\n${String(this.stack)}`;
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString();
  }
}

import { z } from "zod";

export const catchError = (error: any): { status: number, body: object } => {
  //TODO: use logger here.
  if (error instanceof z.ZodError) {
    return {
      status: 400, body: { error: "VALIDATION_ERROR", details: error.issues }
    }
  }
  if (error instanceof AppError) {
    return {
      status: error.statusCode, body: { error: error.message, details: error.error }
    }
  }
  console.error('Unhandled error in catchError:', error);
  return {
    status: 500, body: { error: "INTERNAL_SERVER_ERROR", message: error instanceof Error ? error.message : 'Unknown error' }
  }
}
