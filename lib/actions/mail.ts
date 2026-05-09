'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import { encrypt, decrypt } from '@/lib/encryption'
import { EmailSchema, DomainSchema, IpSchema } from '@/lib/validation'
import type { Database } from '@/types/database'

type SmtpConfigRow = Database['public']['Tables']['smtp_configs']['Row']
type SmtpConfigInsert = Database['public']['Tables']['smtp_configs']['Insert']
type MailHistoryInsert = Database['public']['Tables']['mail_history']['Insert']
type MailHistoryRow = Database['public']['Tables']['mail_history']['Row'] & {
    smtp_configs?: { name: string } | null
}

export async function getSmtpConfigs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('smtp_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return data || []
}

export async function createSmtpConfig(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const host = formData.get('host') as string
    const port = parseInt(formData.get('port') as string)
    const secure = formData.get('secure') === 'true'
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const fromEmail = formData.get('from_email') as string

    if (!name || !host || !port || !fromEmail) {
        return { error: 'Missing required fields' }
    }

    // ✅ Input Validation
    const emailValidation = EmailSchema.safeParse(fromEmail)
    if (!emailValidation.success) return { error: `Invalid email: ${emailValidation.error.issues[0].message}` }

    // Validate Host (Domain or IP)
    // Note: Zod "safeParse" returns object with success boolean. 
    // Simplify host check: if it fails both domain and IP check, it's invalid.
    // DomainSchema is strict on format.
    const isDomain = DomainSchema.safeParse(host).success
    const isIp = IpSchema.safeParse(host).success

    if (!isDomain && !isIp && host !== 'localhost') {
        return { error: 'Invalid host format (must be domain or IP)' }
    }

    // Validate Port
    if (isNaN(port) || port < 1 || port > 65535) {
        return { error: 'Invalid port number' }
    }

    const insertPayload: SmtpConfigInsert = {
        user_id: user.id,
        name,
        host,
        port,
        secure,
        username: username || null,
        encrypted_password: password ? encrypt(password) : null,
        from_email: fromEmail
    }

    const { error } = await supabase.from('smtp_configs').insert(insertPayload as never)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/mail')
    return { success: true }
}

export async function deleteSmtpConfig(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('smtp_configs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/mail')
    return { success: true }
}

export async function sendMailAction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const configId = formData.get('config_id') as string
    const to = formData.get('to') as string // Comma separated
    const subject = formData.get('subject') as string
    const body = formData.get('body') as string

    if (!configId || !to || !subject || !body) {
        return { error: 'Missing required fields' }
    }

    // 1. Get Config
    const { data: config } = await supabase
        .from('smtp_configs')
        .select('*')
        .eq('id', configId)
        .eq('user_id', user.id)
        .single()

    if (!config) return { error: 'Config not found' }
    const smtpConfig = config as SmtpConfigRow

    // 2. Transporter
    try {
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: smtpConfig.username ? {
                user: smtpConfig.username,
                pass: smtpConfig.encrypted_password
                    ? decrypt(smtpConfig.encrypted_password)
                    : undefined
            } : undefined,
        })

        // 3. Send
        // Handle multiple recipients
        const recipients = to.split(',').map(e => e.trim()).filter(Boolean)

        await transporter.sendMail({
            from: `"${smtpConfig.name}" <${smtpConfig.from_email}>`,
            to: recipients.join(', '),
            subject,
            html: body,
        })

        // 4. Log Success
        const successLog: MailHistoryInsert = {
            user_id: user.id,
            config_id: smtpConfig.id,
            recipients: recipients,
            subject,
            body,
            status: 'success'
        }

        await supabase.from('mail_history').insert(successLog as never)

        revalidatePath('/dashboard/mail')
        return { success: true }

    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        console.error('Mail Send Error:', err)
        // Log Error
        const failedLog: MailHistoryInsert = {
            user_id: user.id,
            config_id: smtpConfig.id,
            recipients: to.split(',').map(e => e.trim()).filter(Boolean),
            subject,
            body,
            status: 'failed',
            error_message: err.message || 'Unknown error'
        }

        await supabase.from('mail_history').insert(failedLog as never)

        return { error: err.message || 'Failed to send mail' }
    }
}

export async function getMailHistory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('mail_history')
        .select(`
            *,
            smtp_configs ( name )
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })

    return (data || []) as MailHistoryRow[]
}
