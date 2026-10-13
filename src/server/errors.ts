// Error types that route handlers map to HTTP responses (see http.ts).

export class ValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join("; "));
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export class StockConflictError extends Error {
  readonly lines: { productId: string; slug: string; name: string; requested: number; available: number }[];

  constructor(lines: StockConflictError["lines"]) {
    super(
      `Not enough stock: ${lines
        .map((line) => `${line.name} (wanted ${line.requested}, ${line.available} left)`)
        .join("; ")}`,
    );
    this.name = "StockConflictError";
    this.lines = lines;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
