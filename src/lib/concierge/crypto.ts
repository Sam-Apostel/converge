/**
 * Symmetric encryption for stored provider API keys (silo 7).
 *
 * Keys are secrets: we store AES-256-GCM ciphertext in `userAiSettings`, never
 * the raw key. Encryption/decryption happens server-side only — this module
 * imports node:crypto and must never be pulled into a client bundle.
 *
 * The 32-byte key is derived from `CONCIERGE_KEY_SECRET` (falling back to
 * `BETTER_AUTH_SECRET`) via scrypt, so any sufficiently long secret works.
 */
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
// Stable salt — the secret is the actual entropy; scrypt just stretches it to
// 32 bytes. A fixed salt keeps the derived key deterministic across processes.
const SALT = 'converge.concierge.v1'

function secret(): string {
  const value =
    process.env.CONCIERGE_KEY_SECRET ?? process.env.BETTER_AUTH_SECRET
  if (!value) {
    throw new Error(
      'CONCIERGE_KEY_SECRET (or BETTER_AUTH_SECRET) must be set to store API keys',
    )
  }
  return value
}

function derivedKey(): Buffer {
  return scryptSync(secret(), SALT, 32)
}

/**
 * Encrypt a plaintext API key. Returns a self-describing string of the form
 * `iv.authTag.ciphertext` (all base64) so {@link decrypt} needs no extra
 * metadata.
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, derivedKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join('.')
}

/** Decrypt a string produced by {@link encrypt}. Throws on tamper/format errors. */
export function decrypt(encoded: string): string {
  const [ivB64, tagB64, dataB64] = encoded.split('.')
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Malformed ciphertext')
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    derivedKey(),
    Buffer.from(ivB64, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
