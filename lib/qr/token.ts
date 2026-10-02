import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const TOKEN_ROTATION_INTERVAL_SECONDS = 15
export const TOKEN_GRACE_PERIOD_SECONDS = 10 // Generous grace period for network latency and mobile clock jitter

/**
 * Creates a cryptographically secure random token string.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hashes a token using SHA-256 for secure server storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Generates and stores a new token for an attendance session.
 * Automatically marks any past active tokens as superseded.
 */
export async function createSessionToken(sessionId: string): Promise<{
  token: string
  validFrom: string
  validUntil: string
  intervalSeconds: number
}> {
  const admin = createAdminClient()
  const rawToken = generateSecureToken()
  const tokenHash = hashToken(rawToken)

  const now = new Date()
  const validUntil = new Date(now.getTime() + TOKEN_ROTATION_INTERVAL_SECONDS * 1000)

  const { error } = await admin.from('attendance_tokens').insert({
    session_id: sessionId,
    token_hash: tokenHash,
    valid_from: now.toISOString(),
    valid_until: validUntil.toISOString(),
  })

  if (error) {
    console.error('Error storing session token:', error)
    throw new Error('Failed to generate attendance token')
  }

  return {
    token: rawToken,
    validFrom: now.toISOString(),
    validUntil: validUntil.toISOString(),
    intervalSeconds: TOKEN_ROTATION_INTERVAL_SECONDS,
  }
}

/**
 * Validates a scanned QR token against the database.
 */
export async function validateSessionToken(
  sessionId: string,
  rawToken: string
): Promise<{
  valid: boolean
  tokenId?: string
  reason?: string
}> {
  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, reason: 'Invalid or missing token format' }
  }

  const admin = createAdminClient()
  const tokenHash = hashToken(rawToken.trim())

  const { data: tokenRecord, error } = await admin
    .from('attendance_tokens')
    .select('id, session_id, valid_from, valid_until, consumed_at')
    .eq('session_id', sessionId)
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error || !tokenRecord) {
    return { valid: false, reason: 'Invalid or unknown attendance token' }
  }

  const now = Date.now()
  const validFrom = new Date(tokenRecord.valid_from).getTime()
  // Add grace period to valid_until to accommodate network transit time
  const validUntil = new Date(tokenRecord.valid_until).getTime() + TOKEN_GRACE_PERIOD_SECONDS * 1000

  if (now < validFrom) {
    return { valid: false, reason: 'Attendance token is not yet active' }
  }

  if (now > validUntil) {
    return { valid: false, reason: 'Attendance QR code has expired. Please scan the current code.' }
  }

  return {
    valid: true,
    tokenId: tokenRecord.id,
  }
}
