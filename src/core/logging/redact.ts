const REDACTED = '[REDACTED]';

const SECRET_KEY_PATTERN =
  /^(nsec|private[_-]?key|secret[_-]?key|secretKeyHex|clientSecretKeyHex|privkey|seckey|sk|secret|seed|nsecHex|token|access[_-]?token|refresh[_-]?token|authorization|password|client[_-]?secret)$/i;

const NSEC_PATTERN = /nsec1[acdefghjklmnpqrstuvwxyz023456789]+/i;
/** Strip userinfo credentials from URLs before logging. */
const URL_USERINFO_PATTERN = /([a-z][a-z0-9+.-]*:\/\/)([^/@\s]+)@/gi;

export function redact(value: unknown): unknown {
  return redactValue(value, undefined);
}

function redactString(value: string): string {
  let next = NSEC_PATTERN.test(value) ? value.replace(NSEC_PATTERN, REDACTED) : value;
  next = next.replace(URL_USERINFO_PATTERN, `$1${REDACTED}@`);
  return next;
}

function redactValue(value: unknown, key: string | undefined): unknown {
  if (key !== undefined && SECRET_KEY_PATTERN.test(key)) {
    return REDACTED;
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (value instanceof Error) {
    const payload: Record<string, unknown> = {
      name: value.name,
      message: redactString(value.message),
    };
    const cause = (value as Error & {cause?: unknown}).cause;
    if (cause !== undefined) {
      payload.cause = redactValue(cause, undefined);
    }
    return payload;
  }

  if (Array.isArray(value)) {
    return value.map(item => redactValue(item, undefined));
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([childKey, childValue]) => [childKey, redactValue(childValue, childKey)] as const,
    );
    return Object.fromEntries(entries);
  }

  return value;
}
