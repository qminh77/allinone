'use server'

import { requireAdmin } from '@/lib/auth/authorization-middleware'
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin'
import { createAuditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminDataClient } from '@/lib/admin/db'

const UuidSchema = z.string().uuid()
const BACKUP_BUCKET = 'backups'
const BACKUP_TABLES = [
    'roles',
    'permissions',
    'role_permissions',
    'user_profiles',
    'modules',
    'settings',
    'shortlinks',
    'smtp_configs',
    'mail_history',
    'quizzes',
    'quiz_questions',
    'quiz_answers',
    'quiz_attempts',
    'quiz_attempt_answers',
    'user_sessions',
    'tool_files',
] as const

function validateUuid(id: string, label = 'id') {
    const result = UuidSchema.safeParse(id)
    if (!result.success) {
        return { error: `Invalid ${label}` }
    }

    return { value: result.data }
}

async function ensureBackupBucket() {
    const supabase = createAdminClient()
    const { data } = await supabase.storage.getBucket(BACKUP_BUCKET)
    if (data) return

    const { error } = await supabase.storage.createBucket(BACKUP_BUCKET, {
        public: false,
        fileSizeLimit: 1024 * 1024 * 100,
    })

    if (error && !error.message.toLowerCase().includes('already exists')) {
        throw error
    }
}

async function writeAuditLog(params: Parameters<typeof createAuditLog>[0]) {
    await createAuditLog(params)
}

export async function getBackups() {
    await requireAdmin()
    const supabase = await createAdminDataClient()
    const db = supabase as any

    const { data, error } = await db
        .from('backups')
        .select('id, filename, type, size_bytes, created_at, created_by, storage_path')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching backups:', error)
        return []
    }

    return data || []
}

export async function createDatabaseBackup() {
    const currentUser = await requireAdmin()

    if (!isAdminClientConfigured()) {
        return { error: 'Backup requires SUPABASE_SERVICE_ROLE_KEY' }
    }

    try {
        await ensureBackupBucket()
        const supabase = createAdminClient()
        const db = supabase as any
        const exportedTables: Record<string, unknown[]> = {}

        for (const table of BACKUP_TABLES) {
            const { data, error } = await db
                .from(table)
                .select('*')

            if (error) {
                return { error: `Failed to export ${table}: ${error.message}` }
            }

            exportedTables[table] = data || []
        }

        const createdAt = new Date().toISOString()
        const filename = `database-backup-${createdAt.replace(/[:.]/g, '-')}.json`
        const storagePath = `database/${filename}`
        const payload = {
            version: 1,
            type: 'database',
            created_at: createdAt,
            created_by: currentUser.id,
            tables: exportedTables,
        }
        const body = Buffer.from(JSON.stringify(payload, null, 2), 'utf8')

        const { error: uploadError } = await supabase.storage
            .from(BACKUP_BUCKET)
            .upload(storagePath, body, {
                contentType: 'application/json',
                upsert: false,
            })

        if (uploadError) return { error: uploadError.message }

        const { data: backup, error: insertError } = await db
            .from('backups')
            .insert({
                filename,
                type: 'database',
                size_bytes: body.byteLength,
                created_by: currentUser.id,
                storage_path: storagePath,
            })
            .select()
            .single()

        if (insertError) {
            await supabase.storage.from(BACKUP_BUCKET).remove([storagePath])
            return { error: insertError.message }
        }

        await writeAuditLog({
            userId: currentUser.id,
            action: 'backup.create',
            resourceType: 'backup',
            resourceId: backup.id,
            metadata: { filename, size_bytes: body.byteLength },
        })

        revalidatePath('/admin')
        revalidatePath('/admin/backup')
        return { success: true, backup }
    } catch (error: any) {
        return { error: error.message || 'Failed to create backup' }
    }
}

export async function getBackupDownloadUrl(id: string) {
    await requireAdmin()
    const uuid = validateUuid(id, 'backup id')
    if (uuid.error) return { error: uuid.error }

    if (!isAdminClientConfigured()) {
        return { error: 'Backup download requires SUPABASE_SERVICE_ROLE_KEY' }
    }

    const supabase = createAdminClient()
    const db = supabase as any
    const { data: backup } = await db
        .from('backups')
        .select('storage_path')
        .eq('id', uuid.value!)
        .single()

    if (!backup?.storage_path) {
        return { error: 'Backup file not found' }
    }

    const { data, error } = await supabase.storage
        .from(BACKUP_BUCKET)
        .createSignedUrl(backup.storage_path, 60)

    if (error) return { error: error.message }

    return { success: true, url: data.signedUrl }
}

export async function deleteBackup(id: string) {
    const currentUser = await requireAdmin()
    const uuid = validateUuid(id, 'backup id')
    if (uuid.error) return { error: uuid.error }

    if (!isAdminClientConfigured()) {
        return { error: 'Backup delete requires SUPABASE_SERVICE_ROLE_KEY' }
    }

    const supabase = createAdminClient()
    const db = supabase as any
    const { data: backup } = await db
        .from('backups')
        .select('id, filename, storage_path')
        .eq('id', uuid.value!)
        .single()

    if (!backup) {
        return { error: 'Backup not found' }
    }

    if (backup.storage_path) {
        const { error: storageError } = await supabase.storage
            .from(BACKUP_BUCKET)
            .remove([backup.storage_path])

        if (storageError) return { error: storageError.message }
    }

    const { error } = await db
        .from('backups')
        .delete()
        .eq('id', uuid.value!)

    if (error) return { error: error.message }

    await writeAuditLog({
        userId: currentUser.id,
        action: 'backup.delete',
        resourceType: 'backup',
        resourceId: uuid.value,
        metadata: { filename: backup.filename },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/backup')
    return { success: true }
}
