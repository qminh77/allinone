'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

export async function getSmtpConfigs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // @ts-ignore
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

    // @ts-ignore
    const { error } = await supabase.from('smtp_configs').insert({
        user_id: user.id,
        name,
        host,
        port,
        secure,
        username: username || null,
        password: password || null, // Storing plain text for MVP as discussed
        from_email: fromEmail
    })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/mail')
    return { success: true }
}

export async function deleteSmtpConfig(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // @ts-ignore
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
    // @ts-ignore
    const { data: config } = await supabase
        .from('smtp_configs')
        .select('*')
        .eq('id', configId)
        .eq('user_id', user.id)
        .single()

    if (!config) return { error: 'Config not found' }

    // 2. Transporter
    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure, // true for 465, false for other ports
            auth: config.username ? {
                user: config.username,
                pass: config.password
            } : undefined,
        })

        // 3. Send
        // Handle multiple recipients
        const recipients = to.split(',').map(e => e.trim()).filter(Boolean)

        await transporter.sendMail({
            from: `"${config.name}" <${config.from_email}>`, // sender address
            to: recipients.join(', '), // list of receivers
            subject: subject, // Subject line
            html: body, // html body
        })

        // 4. Log Success
        // @ts-ignore
        await supabase.from('mail_history').insert({
            user_id: user.id,
            config_id: config.id,
            recipients: recipients,
            subject,
            body, // maybe truncate if too long? keeping full for now
            status: 'success'
        })

        revalidatePath('/dashboard/mail')
        return { success: true }

    } catch (err: any) {
        console.error('Mail Send Error:', err)
        // Log Error
        // @ts-ignore
        await supabase.from('mail_history').insert({
            user_id: user.id,
            config_id: config.id,
            recipients: to.split(',').map(e => e.trim()).filter(Boolean),
            subject,
            body,
            status: 'failed',
            error_message: err.message || 'Unknown error'
        })

        return { error: err.message || 'Failed to send mail' }
    }
}

export async function getMailHistory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // @ts-ignore
    const { data } = await supabase
        .from('mail_history')
        .select(`
            *,
            smtp_configs ( name )
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })

    return data || []
}
