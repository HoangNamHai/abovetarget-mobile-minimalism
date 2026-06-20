// Map Clerk error payloads to short, human-friendly strings for inline display.
// Never surface raw Clerk messages/codes to users.

interface ClerkApiError {
  code?: string;
  message?: string;
  longMessage?: string;
}

interface ClerkErrorLike {
  errors?: ClerkApiError[];
  message?: string;
}

const FRIENDLY: Record<string, string> = {
  form_identifier_not_found: "We couldn't find an account with that email.",
  form_password_incorrect: 'Incorrect email or password.',
  form_password_pwned:
    'That password has appeared in a data breach. Please choose a different one.',
  form_password_length_too_short: 'Password must be at least 8 characters.',
  form_param_format_invalid: 'Please check the format and try again.',
  form_identifier_exists: 'An account with that email already exists.',
  form_code_incorrect: 'That code is incorrect. Please try again.',
  verification_expired: 'That code has expired. Request a new one.',
  verification_failed: 'Verification failed. Please try again.',
  too_many_requests: 'Too many attempts. Please wait a moment and try again.',
  network_error: 'Network problem. Check your connection and try again.',
};

const FALLBACK = 'Something went wrong. Please try again.';

/** Extract the first Clerk error code from an unknown thrown value, if present. */
export function clerkErrorCode(err: unknown): string | null {
  const e = err as ClerkErrorLike | null;
  return e?.errors?.[0]?.code ?? null;
}

/** Turn an unknown thrown value into a short, user-safe message. */
export function mapClerkError(err: unknown): string {
  const e = err as ClerkErrorLike | null;
  const code = e?.errors?.[0]?.code;
  if (code && FRIENDLY[code]) return FRIENDLY[code];
  return FALLBACK;
}
