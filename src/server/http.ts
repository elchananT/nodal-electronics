import { NextResponse } from "next/server";
import { NotFoundError, StockConflictError, ValidationError } from "./errors";

export function jsonOk<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, { status });
}

export function jsonError(status: number, error: string, details?: unknown): NextResponse {
  return NextResponse.json(details === undefined ? { error } : { error, details }, { status });
}

/** Maps service-layer errors to the shared `{error, details?}` shape. Unknown errors become a generic 500. */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return jsonError(400, "Invalid request", error.issues);
  }
  if (error instanceof StockConflictError) {
    return jsonError(409, error.message, error.lines);
  }
  if (error instanceof NotFoundError) {
    return jsonError(404, error.message);
  }
  console.error(error);
  return jsonError(500, "Something went wrong. Please try again.");
}

/** Reads a JSON body, turning malformed JSON into a validation error. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError(["body: must be valid JSON"]);
  }
}
