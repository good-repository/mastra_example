/**
 * Shared validation utilities
 * Centralized validation functions for consistent input handling
 */

/**
 * Validate a string input
 * @param value - The value to validate
 * @param fieldName - Name of the field (for error messages)
 * @returns The validated string (trimmed)
 * @throws Error if validation fails
 */
export function validateString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} is required and must be a non-empty string`);
  }
  return value.trim();
}

/**
 * Validate an object input
 * @param value - The value to validate
 * @param type - Expected type name (for error messages)
 * @throws Error if not an object
 */
export function validateObject(
  value: unknown,
  type: string = 'input'
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error(`Invalid ${type}: must be an object`);
  }
}

/**
 * Validate a required field exists and is of correct type
 * @param obj - Object to validate
 * @param field - Field name
 * @param expectedType - Expected type
 * @returns The field value
 * @throws Error if validation fails
 */
export function validateField<T>(
  obj: Record<string, unknown>,
  field: string,
  expectedType: string
): T {
  const value = obj[field];
  if (typeof value !== expectedType) {
    throw new Error(
      `Field '${field}' must be of type ${expectedType}, got ${typeof value}`
    );
  }
  return value as T;
}
