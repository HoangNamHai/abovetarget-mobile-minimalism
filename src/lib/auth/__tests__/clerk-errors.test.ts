import { clerkErrorCode, mapClerkError } from '../clerk-errors';

const clerkErr = (code: string) => ({ errors: [{ code, message: 'raw' }] });

test('maps known codes to friendly strings', () => {
  expect(mapClerkError(clerkErr('form_password_incorrect'))).toMatch(/incorrect/i);
  expect(mapClerkError(clerkErr('form_identifier_exists'))).toMatch(/already exists/i);
  expect(mapClerkError(clerkErr('form_code_incorrect'))).toMatch(/code is incorrect/i);
});

test('never returns the raw clerk message', () => {
  expect(mapClerkError(clerkErr('form_password_incorrect'))).not.toContain('raw');
});

test('falls back for unknown or malformed errors', () => {
  expect(mapClerkError(clerkErr('totally_unknown_code'))).toMatch(/something went wrong/i);
  expect(mapClerkError(new Error('boom'))).toMatch(/something went wrong/i);
  expect(mapClerkError(null)).toMatch(/something went wrong/i);
  expect(mapClerkError(undefined)).toMatch(/something went wrong/i);
});

test('clerkErrorCode extracts the first code or null', () => {
  expect(clerkErrorCode(clerkErr('form_code_incorrect'))).toBe('form_code_incorrect');
  expect(clerkErrorCode(new Error('x'))).toBeNull();
  expect(clerkErrorCode(null)).toBeNull();
});
