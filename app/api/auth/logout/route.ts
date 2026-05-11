import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        await supabase.auth.signOut()
    } catch {
        // Ignore logout errors. Redirect still clears the UI path.
    }

    return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}
