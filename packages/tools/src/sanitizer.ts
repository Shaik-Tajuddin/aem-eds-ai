// ============================================================
// @aeds/tools — Input/Output Sanitizer & Secret Redactor
// Ensures tokens, secrets, credentials never leak into logs or DB
// ============================================================

const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /passwd/i,
  /api[_-]?key/i,
  /auth/i,
  /private[_-]?key/i,
  /credential/i,
  /bearer/i,
];

export function sanitizeValue(
  value: unknown,
  keyName?: string,
  seen: WeakSet<object> = new WeakSet()
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // If the key name indicates a secret, mask it
  if (keyName && SENSITIVE_KEY_PATTERNS.some((p) => p.test(keyName))) {
    if (typeof value === 'string') {
      if (value.length <= 6) return '******';
      return `${value.slice(0, 3)}...${value.slice(-3)}`;
    }
    return '[REDACTED_SECRET]';
  }

  if (typeof value === 'string') {
    // Also detect raw token patterns inside string values (e.g. ghp_..., sk-...)
    if (/ghp_[a-zA-Z0-9]{30,}/.test(value)) {
      return value.replace(/ghp_[a-zA-Z0-9]{30,}/g, 'ghp_******');
    }
    if (/sk-[a-zA-Z0-9]{32,}/.test(value)) {
      return value.replace(/sk-[a-zA-Z0-9]{32,}/g, 'sk-******');
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, keyName, seen));
  }

  if (typeof value === 'object') {
    // Circular reference protection
    if (seen.has(value as object)) {
      return '[CIRCULAR_REF]';
    }
    seen.add(value as object);

    // Preserve special non-plain objects
    if (value instanceof Date || value instanceof RegExp || value instanceof Error) {
      return value;
    }

    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitizedObj[k] = sanitizeValue(v, k, seen);
    }
    return sanitizedObj;
  }

  return value;
}
