/**
 * Safely extracts the first validation error message across Zod v3 and Zod v4
 */
export function getValidationErrorMessage(error: any, fallback = 'Invalid input'): string {
  if (!error) return fallback
  if (Array.isArray(error.issues) && error.issues[0]?.message) {
    return error.issues[0].message
  }
  if (Array.isArray(error.errors) && error.errors[0]?.message) {
    return error.errors[0].message
  }
  if (typeof error.message === 'string') {
    return error.message
  }
  return fallback
}
