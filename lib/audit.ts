import { createAdminClient } from '@/lib/supabase/admin'

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'DEPARTMENT_CREATED'
  | 'COURSE_CREATED'
  | 'CLASS_CREATED'
  | 'ENROLLMENT_CREATED'
  | 'TEACHER_ASSIGNED'
  | 'SESSION_STARTED'
  | 'SESSION_ENDED'
  | 'TOKEN_GENERATED'
  | 'ATTENDANCE_SUCCESS'
  | 'ATTENDANCE_FAILED_LOCATION'
  | 'ATTENDANCE_FAILED_EXPIRED'
  | 'ATTENDANCE_FAILED_DUPLICATE'
  | 'ATTENDANCE_FAILED_AUTH'
  | 'REPORT_EXPORTED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'

interface AuditLogParams {
  actorId?: string | null
  action: AuditAction
  entityType: string
  entityId?: string | null
  success?: boolean
  metadata?: Record<string, unknown>
}

export async function logAuditEvent({
  actorId = null,
  action,
  entityType,
  entityId = null,
  success = true,
  metadata = {},
}: AuditLogParams): Promise<void> {
  try {
    const admin = createAdminClient()

    // Strip any sensitive properties if accidentally provided
    const safeMetadata = { ...metadata }
    delete safeMetadata.password
    delete safeMetadata.token
    delete safeMetadata.secret

    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      success,
      metadata: safeMetadata,
    })
  } catch (err) {
    // Audit logging should not crash the main application thread if DB is temporarily busy
    console.error('Failed to write audit log:', err)
  }
}
