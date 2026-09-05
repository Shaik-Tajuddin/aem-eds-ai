import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// ============================================================
// Secret Manager
// Encrypts/decrypts sensitive values stored in database
// Uses AES-256-GCM with a key derived from ENCRYPTION_KEY env var
//
// SECURITY: The ENCRYPTION_KEY must be stored in environment, 
// never in code or Git.
// SECURITY: Encrypted values are never sent to the browser.
// SECURITY: Never log raw secrets.
// ============================================================

function getDerivedKey(): Buffer {
  const encryptionKey = process.env['ENCRYPTION_KEY'];
  if (!encryptionKey) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  // Derive a 32-byte key from the hex string
  return Buffer.from(encryptionKey, 'hex');
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16;

/**
 * Encrypts a secret value for storage in the database.
 * Format: iv:tag:ciphertext (hex encoded)
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = getDerivedKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypts a secret value retrieved from the database.
 * Never call this in browser code or log the result.
 */
export async function decryptSecret(encrypted: string): Promise<string> {
  const key = getDerivedKey();
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format');
  }

  const [ivHex, tagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex!, 'hex');
  const tag = Buffer.from(tagHex!, 'hex');
  const ciphertext = Buffer.from(ciphertextHex!, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Redacts a secret from a log-safe string.
 * Use this when you need to reference a secret in a log or event.
 */
export function redactSecret(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) {
    return '[REDACTED]';
  }
  return `${value.slice(0, visibleChars)}...[REDACTED]`;
}
