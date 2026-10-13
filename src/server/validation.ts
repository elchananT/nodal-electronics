// Small hand-written validators. Each helper records problems in an Issues list so one
// response can report every bad field at once, e.g. "shipping.postalCode: must be a US ZIP code".
import { ValidationError } from "./errors";

export class Issues {
  readonly list: string[] = [];

  add(message: string): void {
    this.list.push(message);
  }

  throwIfAny(): void {
    if (this.list.length > 0) throw new ValidationError(this.list);
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const US_ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const GENERIC_POSTAL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$/;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;

export function asRecord(value: unknown, path: string, issues: Issues): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    issues.add(`${path}: must be an object`);
    return undefined;
  }
  return value as Record<string, unknown>;
}

export function requiredString(
  value: unknown,
  path: string,
  issues: Issues,
  options: { max: number; min?: number },
): string | undefined {
  const min = options.min ?? 1;
  if (typeof value !== "string") {
    issues.add(`${path}: is required`);
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    issues.add(`${path}: is required`);
    return undefined;
  }
  if (trimmed.length > options.max) {
    issues.add(`${path}: must be at most ${options.max} characters`);
    return undefined;
  }
  return trimmed;
}

export function optionalString(
  value: unknown,
  path: string,
  issues: Issues,
  options: { max: number },
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredString(value, path, issues, { max: options.max, min: 1 });
}

export function requiredEmail(value: unknown, path: string, issues: Issues): string | undefined {
  const email = requiredString(value, path, issues, { max: 254 });
  if (email === undefined) return undefined;
  if (!EMAIL_PATTERN.test(email)) {
    issues.add(`${path}: must be a valid email address`);
    return undefined;
  }
  return email;
}

export function requiredPostalCode(
  value: unknown,
  country: string | undefined,
  path: string,
  issues: Issues,
): string | undefined {
  const postal = requiredString(value, path, issues, { max: 12 });
  if (postal === undefined || country === undefined) return postal;
  const pattern = country === "US" ? US_ZIP_PATTERN : GENERIC_POSTAL_PATTERN;
  if (!pattern.test(postal)) {
    issues.add(
      country === "US"
        ? `${path}: must be a US ZIP code like 10001 or 10001-1234`
        : `${path}: must be 3 to 10 letters or digits`,
    );
    return undefined;
  }
  return postal;
}

export function requiredCountry(value: unknown, path: string, issues: Issues): string | undefined {
  const country = requiredString(value, path, issues, { max: 2, min: 2 });
  if (country === undefined) return undefined;
  if (!COUNTRY_PATTERN.test(country)) {
    issues.add(`${path}: must be a two-letter country code such as US`);
    return undefined;
  }
  return country;
}

export function requiredInt(
  value: unknown,
  path: string,
  issues: Issues,
  options: { min: number; max: number },
): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    issues.add(`${path}: must be an integer`);
    return undefined;
  }
  if (value < options.min || value > options.max) {
    issues.add(`${path}: must be between ${options.min} and ${options.max}`);
    return undefined;
  }
  return value;
}

export function oneOf<T extends string>(
  value: unknown,
  path: string,
  allowed: readonly T[],
  issues: Issues,
): T | undefined {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) return value as T;
  issues.add(`${path}: must be one of ${allowed.join(", ")}`);
  return undefined;
}

/** Parses an optional URL query value as a non-negative integer. Missing or empty means undefined. */
export function queryInt(
  raw: string | null,
  path: string,
  issues: Issues,
  options: { min: number; max: number },
): number | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  if (!/^-?\d+$/.test(raw.trim())) {
    issues.add(`${path}: must be a whole number`);
    return undefined;
  }
  const value = Number(raw);
  if (value < options.min || value > options.max) {
    issues.add(`${path}: must be between ${options.min} and ${options.max}`);
    return undefined;
  }
  return value;
}
