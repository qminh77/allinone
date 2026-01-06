'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import { encrypt, decrypt } from '@/lib/encryption'
import { EmailSchema, DomainSchema, IpSchema } from '@/lib/validation'
import { z } from 'zod'

export async function getSmtpConfigs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('smtp_configs' as any)
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
    const hostValidation = DomainSchema.safeParse(host) || IpSchema.safeParse(host)
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

    const { error } = await supabase.from('smtp_configs' as any).insert({
        user_id: user.id,
        name,
        host,
        port,
        secure,
        username: username || null,
        encrypted_password: password ? encrypt(password) : null, // ✅ Encrypt password
        from_email: fromEmail
    } as any)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/mail')
    return { success: true }
}

export async function deleteSmtpConfig(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('smtp_configs' as any)
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
        .from('smtp_configs' as any)
        .select('*')
        .eq('id', configId)
        .eq('user_id', user.id)
        .single()

    if (!config) return { error: 'Config not found' }

    // 2. Transporter
    try {
        const transporter = nodemailer.createTransport({
            host: (config as any).host,
            port: (config as any).port,
            secure: (config as any).secure,
            auth: (config as any).username ? {
                user: (config as any).username,
                pass: (config as any).encrypted_password
                    ? decrypt((config as any).encrypted_password) // ✅ Decrypt password
                    : undefined
            } : undefined,
        })

        // 3. Send
        // Handle multiple recipients
        const recipients = to.split(',').map(e => e.trim()).filter(Boolean)

        await transporter.sendMail({
            from: `"${(config as any).name}" <${(config as any).from_email}>`,
            to: recipients.join(', '), // list of receivers
            subject: subject, // Subject line
            html: body, // html body
        })

        // 4. Log Success
        await supabase.from('mail_history' as any).insert({
            user_id: user.id,
            config_id: (config as any).id,
            recipients: recipients,
            subject,
            body, // maybe truncate if too long? keeping full for now
            status: 'success'
        } as any)

        revalidatePath('/dashboard/mail')
        return { success: true }

    } catch (err: any) {
        console.error('Mail Send Error:', err)
        // Log Error
        await supabase.from('mail_history' as any).insert({
            user_id: user.id,
            config_id: (config as any).id,
            recipients: to.split(',').map(e => e.trim()).filter(Boolean),
            subject,
            body,
            status: 'failed',
            error_message: err.message || 'Unknown error'
        } as any)

        return { error: err.message || 'Failed to send mail' }
    }
}

export async function getMailHistory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('mail_history' as any)
        .select(`
            *,
            smtp_configs ( name )
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })

    return data || []
}
