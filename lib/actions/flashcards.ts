'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type FlashcardVisibility = 'public' | 'private'
export type FlashcardProgressStatus = 'unknown' | 'known' | 'mastered'

function generateToken() {
    return randomBytes(16).toString('hex')
}

export interface FlashcardCard {
    id: string
    set_id: string
    term: string
    definition: string
    order_index: number
    created_at: string
    updated_at: string
    status?: FlashcardProgressStatus | null
}

export interface FlashcardSetSummary {
    id: string
    user_id: string
    title: string
    description: string | null
    visibility: FlashcardVisibility
    share_token: string
    created_at: string
    updated_at: string
    card_count: number
    completed_count: number
    mastered_count: number
    progress_percent: number
    is_owner: boolean
    shared_at?: string | null
}

export interface FlashcardSetWithCards extends FlashcardSetSummary {
    cards: FlashcardCard[]
}

const MAX_BULK_IMPORT_CARDS = 1000

function normalizeSearchQuery(query?: string) {
    return (query || '').trim().replace(/[%_]/g, '').slice(0, 80)
}

function cleanText(value: string, maxLength: number) {
    return value.trim().replace(/\0/g, '').slice(0, maxLength)
}

function validateTitle(title: string) {
    const value = cleanText(title, 160)
    if (value.length < 3) return { error: 'Tiêu đề phải có ít nhất 3 ký tự.' }
    return { value }
}

function validateDescription(description?: string | null) {
    const value = cleanText(description || '', 2000)
    return value.length > 0 ? value : null
}

function validateVisibility(visibility: string): FlashcardVisibility {
    return visibility === 'public' ? 'public' : 'private'
}

function validateCardInput(term: string, definition: string) {
    const safeTerm = cleanText(term, 500)
    const safeDefinition = cleanText(definition, 5000)

    if (!safeTerm) return { error: 'Term không được để trống.' }
    if (!safeDefinition) return { error: 'Definition không được để trống.' }

    return {
        value: {
            term: safeTerm,
            definition: safeDefinition,
        },
    }
}

function normalizeToken(input: string) {
    let value = cleanText(input, 200).trim()
    if (value.includes('/flashcard/')) {
        const parts = value.split('/flashcard/')
        value = parts[1]?.split(/[?#]/)[0] || value
    }
    return value
}

function encodeCsvCell(value: string | number | null | undefined) {
    const text = value === null || value === undefined ? '' : String(value)
    if (/[",\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`
    }
    return text
}

function toCsv(rows: readonly (readonly (string | number | null | undefined)[])[]) {
    return rows.map(row => row.map(encodeCsvCell).join(',')).join('\n')
}

async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return { supabase, user }
}

async function getOwnedSet(supabase: any, setId: string, userId: string) {
    const { data, error } = await supabase
        .from('flashcard_sets')
        .select('*')
        .eq('id', setId)
        .eq('user_id', userId)
        .single()

    if (error || !data) return null
    return data
}

async function buildSummaries(supabase: any, sets: any[], userId: string, sharedAtBySetId = new Map<string, string>()) {
    if (sets.length === 0) return []

    const setIds = Array.from(new Set(sets.map(set => set.id)))

    const [{ data: cardRows }, { data: progressRows }] = await Promise.all([
        supabase
            .from('flashcards')
            .select('id,set_id')
            .in('set_id', setIds),
        supabase
            .from('flashcard_progress')
            .select('card_id,set_id,status')
            .eq('user_id', userId)
            .in('set_id', setIds),
    ])

    const cardsBySet = new Map<string, string[]>()
    for (const card of cardRows || []) {
        const list = cardsBySet.get(card.set_id) || []
        list.push(card.id)
        cardsBySet.set(card.set_id, list)
    }

    const progressByCard = new Map<string, FlashcardProgressStatus>()
    for (const progress of progressRows || []) {
        progressByCard.set(progress.card_id, progress.status)
    }

    return sets.map((set): FlashcardSetSummary => {
        const cardIds = cardsBySet.get(set.id) || []
        const completedCount = cardIds.filter(cardId => {
            const status = progressByCard.get(cardId)
            return status === 'known' || status === 'mastered'
        }).length
        const masteredCount = cardIds.filter(cardId => progressByCard.get(cardId) === 'mastered').length

        return {
            id: set.id,
            user_id: set.user_id,
            title: set.title,
            description: set.description,
            visibility: set.visibility,
            share_token: set.share_token,
            created_at: set.created_at,
            updated_at: set.updated_at,
            card_count: cardIds.length,
            completed_count: completedCount,
            mastered_count: masteredCount,
            progress_percent: cardIds.length > 0 ? Math.round((completedCount / cardIds.length) * 100) : 0,
            is_owner: set.user_id === userId,
            shared_at: sharedAtBySetId.get(set.id) || null,
        }
    })
}

async function attachProgressToCards(supabase: any, cards: any[], userId?: string | null) {
    if (!userId || cards.length === 0) {
        return cards.map((card): FlashcardCard => ({ ...card, status: null }))
    }

    const { data: progressRows } = await supabase
        .from('flashcard_progress')
        .select('card_id,status')
        .eq('user_id', userId)
        .in('card_id', cards.map(card => card.id))

    const progressByCard = new Map<string, FlashcardProgressStatus>()
    for (const progress of progressRows || []) {
        progressByCard.set(progress.card_id, progress.status)
    }

    return cards.map((card): FlashcardCard => ({
        ...card,
        status: progressByCard.get(card.id) || null,
    }))
}

function buildSetWithCards(set: any, cards: FlashcardCard[], userId?: string | null, sharedAt?: string | null): FlashcardSetWithCards {
    const completedCount = cards.filter(card => card.status === 'known' || card.status === 'mastered').length
    const masteredCount = cards.filter(card => card.status === 'mastered').length

    return {
        id: set.id,
        user_id: set.user_id,
        title: set.title,
        description: set.description,
        visibility: set.visibility,
        share_token: set.share_token,
        created_at: set.created_at,
        updated_at: set.updated_at,
        card_count: cards.length,
        completed_count: completedCount,
        mastered_count: masteredCount,
        progress_percent: cards.length > 0 ? Math.round((completedCount / cards.length) * 100) : 0,
        is_owner: !!userId && set.user_id === userId,
        shared_at: sharedAt || null,
        cards,
    }
}

export async function getFlashcardLibrary(query?: string) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { own: [], shared: [], public: [] }

    const q = normalizeSearchQuery(query)

    let ownQuery = (supabase as any)
        .from('flashcard_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (q) {
        ownQuery = ownQuery.ilike('title', `%${q}%`)
    }

    const { data: ownSets } = await ownQuery

    let publicSets: any[] = []
    if (q) {
        const { data } = await (supabase as any)
            .from('flashcard_sets')
            .select('*')
            .eq('visibility', 'public')
            .neq('user_id', user.id)
            .ilike('title', `%${q}%`)
            .order('created_at', { ascending: false })
            .limit(30)
        publicSets = data || []
    }

    const own = await buildSummaries(supabase, ownSets || [], user.id)
    const publicResults = await buildSummaries(supabase, publicSets, user.id)

    return { own, shared: [], public: publicResults }
}

export async function getOwnedFlashcardSetWithCards(setId: string) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return null

    const set = await getOwnedSet(supabase as any, setId, user.id)
    if (!set) return null

    const { data: cards, error } = await (supabase as any)
        .from('flashcards')
        .select('*')
        .eq('set_id', setId)
        .order('order_index', { ascending: true })

    if (error) return null

    const cardsWithProgress = await attachProgressToCards(supabase, cards || [], user.id)
    return buildSetWithCards(set, cardsWithProgress, user.id)
}

export async function getFlashcardSetForStudy(setId: string) {
    const { supabase, user } = await getCurrentUser()

    const { data: set, error: setError } = await (supabase as any)
        .from('flashcard_sets')
        .select('*')
        .eq('id', setId)
        .single()

    if (setError || !set) return null

    const { data: cards, error: cardsError } = await (supabase as any)
        .from('flashcards')
        .select('*')
        .eq('set_id', setId)
        .order('order_index', { ascending: true })

    if (cardsError) return null

    const cardsWithProgress = await attachProgressToCards(supabase, cards || [], user?.id)
    return buildSetWithCards(set, cardsWithProgress, user?.id)
}

export async function createFlashcardSet(input: {
    title: string
    description?: string | null
    visibility: FlashcardVisibility
}) {
    const { user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const titleResult = validateTitle(input.title)
    if (titleResult.error) return { error: titleResult.error }

    // Use the server-only admin client for writes after authenticating the user.
    // This avoids deployment drift in RLS policies while still forcing user_id
    // to come from the current session, not from client input.
    const admin = createAdminClient()
    const { data, error } = await (admin as any)
        .from('flashcard_sets')
        .insert({
            user_id: user.id,
            title: titleResult.value,
            description: validateDescription(input.description),
            visibility: validateVisibility(input.visibility),
            share_token: generateToken(),
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/flashcards/library')
    return { success: true, data }
}

export async function updateFlashcardSet(setId: string, input: {
    title: string
    description?: string | null
    visibility: FlashcardVisibility
}) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const titleResult = validateTitle(input.title)
    if (titleResult.error) return { error: titleResult.error }

    const { error } = await (supabase as any)
        .from('flashcard_sets')
        .update({
            title: titleResult.value,
            description: validateDescription(input.description),
            visibility: validateVisibility(input.visibility),
        })
        .eq('id', setId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/flashcards/library')
    revalidatePath(`/dashboard/flashcards/${setId}/edit`)
    revalidatePath(`/dashboard/flashcards/${setId}/study`)
    return { success: true }
}

export async function deleteFlashcardSet(setId: string) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await (supabase as any)
        .from('flashcard_sets')
        .delete()
        .eq('id', setId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/flashcards/library')
    return { success: true }
}

export async function createFlashcardCard(setId: string, input: { term: string; definition: string }) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const set = await getOwnedSet(supabase as any, setId, user.id)
    if (!set) return { error: 'Bạn không có quyền chỉnh sửa set này.' }

    const cardResult = validateCardInput(input.term, input.definition)
    if (cardResult.error || !cardResult.value) return { error: cardResult.error || 'Card không hợp lệ.' }

    const { data: lastCards } = await (supabase as any)
        .from('flashcards')
        .select('order_index')
        .eq('set_id', setId)
        .order('order_index', { ascending: false })
        .limit(1)

    const nextOrder = (lastCards?.[0]?.order_index ?? -1) + 1

    const { data, error } = await (supabase as any)
        .from('flashcards')
        .insert({
            set_id: setId,
            term: cardResult.value.term,
            definition: cardResult.value.definition,
            order_index: nextOrder,
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/flashcards/${setId}/edit`)
    revalidatePath(`/dashboard/flashcards/${setId}/study`)
    return { success: true, data: { ...data, status: null } as FlashcardCard }
}

export async function updateFlashcardCard(cardId: string, input: { term: string; definition: string }) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const cardResult = validateCardInput(input.term, input.definition)
    if (cardResult.error || !cardResult.value) return { error: cardResult.error || 'Card không hợp lệ.' }

    const { data: existing } = await (supabase as any)
        .from('flashcards')
        .select('id,set_id,flashcard_sets!inner(user_id)')
        .eq('id', cardId)
        .single()

    if (!existing || existing.flashcard_sets?.user_id !== user.id) {
        return { error: 'Bạn không có quyền chỉnh sửa card này.' }
    }

    const { data, error } = await (supabase as any)
        .from('flashcards')
        .update({
            term: cardResult.value.term,
            definition: cardResult.value.definition,
        })
        .eq('id', cardId)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/flashcards/${existing.set_id}/edit`)
    revalidatePath(`/dashboard/flashcards/${existing.set_id}/study`)
    return { success: true, data: { ...data, status: null } as FlashcardCard }
}

export async function deleteFlashcardCard(cardId: string) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: existing } = await (supabase as any)
        .from('flashcards')
        .select('id,set_id,flashcard_sets!inner(user_id)')
        .eq('id', cardId)
        .single()

    if (!existing || existing.flashcard_sets?.user_id !== user.id) {
        return { error: 'Bạn không có quyền xóa card này.' }
    }

    const { error } = await (supabase as any)
        .from('flashcards')
        .delete()
        .eq('id', cardId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/flashcards/${existing.set_id}/edit`)
    revalidatePath(`/dashboard/flashcards/${existing.set_id}/study`)
    return { success: true }
}

export async function reorderFlashcardCards(setId: string, orderedIds: string[]) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const set = await getOwnedSet(supabase as any, setId, user.id)
    if (!set) return { error: 'Bạn không có quyền sắp xếp set này.' }

    const uniqueIds = Array.from(new Set(orderedIds)).filter(Boolean)
    if (uniqueIds.length === 0 || uniqueIds.length !== orderedIds.length) {
        return { error: 'Danh sách card không hợp lệ.' }
    }

    const { data: cards } = await (supabase as any)
        .from('flashcards')
        .select('id')
        .eq('set_id', setId)

    const actualIds = new Set((cards || []).map((card: any) => card.id))
    if (uniqueIds.length !== actualIds.size || uniqueIds.some(id => !actualIds.has(id))) {
        return { error: 'Danh sách card không khớp với set hiện tại.' }
    }

    for (let index = 0; index < uniqueIds.length; index++) {
        const { error } = await (supabase as any)
            .from('flashcards')
            .update({ order_index: index })
            .eq('id', uniqueIds[index])
            .eq('set_id', setId)

        if (error) return { error: error.message }
    }

    revalidatePath(`/dashboard/flashcards/${setId}/edit`)
    revalidatePath(`/dashboard/flashcards/${setId}/study`)
    return { success: true }
}

export async function importFlashcardCards(setId: string, cards: { term: string; definition: string }[]) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const set = await getOwnedSet(supabase as any, setId, user.id)
    if (!set) return { error: 'Bạn không có quyền import vào set này.' }

    if (cards.length === 0) return { error: 'Không có card hợp lệ để import.' }
    if (cards.length > MAX_BULK_IMPORT_CARDS) {
        return { error: `Chỉ cho phép import tối đa ${MAX_BULK_IMPORT_CARDS} card mỗi lần.` }
    }

    const cleanedCards: { term: string; definition: string }[] = []
    for (const card of cards) {
        const result = validateCardInput(card.term, card.definition)
        if (result.error || !result.value) return { error: result.error || 'Card không hợp lệ.' }
        cleanedCards.push(result.value)
    }

    const { data: lastCards } = await (supabase as any)
        .from('flashcards')
        .select('order_index')
        .eq('set_id', setId)
        .order('order_index', { ascending: false })
        .limit(1)

    const startOrder = (lastCards?.[0]?.order_index ?? -1) + 1
    const payload = cleanedCards.map((card, index) => ({
        set_id: setId,
        term: card.term,
        definition: card.definition,
        order_index: startOrder + index,
    }))

    for (let i = 0; i < payload.length; i += 200) {
        const { error } = await (supabase as any)
            .from('flashcards')
            .insert(payload.slice(i, i + 200))

        if (error) return { error: error.message }
    }

    revalidatePath(`/dashboard/flashcards/${setId}/edit`)
    revalidatePath(`/dashboard/flashcards/${setId}/study`)
    return { success: true, count: cleanedCards.length }
}

export async function getFlashcardSetExport(setId: string, format: 'csv' | 'txt') {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const set = await getOwnedSet(supabase as any, setId, user.id)
    if (!set) return { error: 'Chỉ owner mới được export set này.' }

    const { data: cards, error } = await (supabase as any)
        .from('flashcards')
        .select('term,definition')
        .eq('set_id', setId)
        .order('order_index', { ascending: true })

    if (error) return { error: error.message }

    const filenameBase = set.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'flashcards'

    if (format === 'csv') {
        const content = toCsv([
            ['Term', 'Definition'],
            ...(cards || []).map((card: any) => [card.term, card.definition]),
        ])
        return { success: true, filename: `${filenameBase}.csv`, content, mimeType: 'text/csv;charset=utf-8' }
    }

    const content = (cards || []).map((card: any) => `${card.term}\t${card.definition}`).join('\n')
    return { success: true, filename: `${filenameBase}.txt`, content, mimeType: 'text/plain;charset=utf-8' }
}

export async function joinFlashcardSetByToken(input: {
    token: string
}) {
    return getPublicFlashcardSetByToken(input.token)
}

export async function getPublicFlashcardSetByToken(tokenOrId: string) {
    const admin = createAdminClient()
    const token = normalizeToken(tokenOrId)

    let { data: set } = await (admin as any)
        .from('flashcard_sets')
        .select('*')
        .eq('share_token', token)
        .single()

    if (!set) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (uuidRegex.test(token)) {
            const { data: setById } = await (admin as any)
                .from('flashcard_sets')
                .select('*')
                .eq('id', token)
                .eq('visibility', 'public')
                .single()
            set = setById
        }
    }

    if (!set) return { error: 'Không tìm thấy flashcard set với mã này.' }

    const { data: cards } = await (admin as any)
        .from('flashcards')
        .select('*')
        .eq('set_id', set.id)
        .order('order_index', { ascending: true })

    const cardsWithProgress = (cards || []).map((card: any) => ({ ...card, status: null }))

    return {
        success: true,
        token,
        set: buildSetWithCards(set, cardsWithProgress, null),
    }
}

export async function importFlashcardSetFromToken(tokenOrId: string) {
    const { user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized: Bạn cần đăng nhập để nhập flashcard set.' }

    const admin = createAdminClient()
    const token = normalizeToken(tokenOrId)

    let { data: sourceSet } = await (admin as any)
        .from('flashcard_sets')
        .select('*')
        .eq('share_token', token)
        .single()

    if (!sourceSet) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (uuidRegex.test(token)) {
            const { data: setById } = await (admin as any)
                .from('flashcard_sets')
                .select('*')
                .eq('id', token)
                .single()
            sourceSet = setById
        }
    }

    if (!sourceSet) return { error: 'Không tìm thấy flashcard set với mã này.' }

    const { data: newSet, error: insertError } = await (admin as any)
        .from('flashcard_sets')
        .insert({
            user_id: user.id,
            title: `${sourceSet.title} (Copy)`,
            description: sourceSet.description,
            visibility: 'private',
            share_token: generateToken(),
        })
        .select()
        .single()

    if (insertError) return { error: 'Lỗi khi tạo flashcard set mới: ' + insertError.message }

    const { data: sourceCards } = await (admin as any)
        .from('flashcards')
        .select('term,definition,order_index')
        .eq('set_id', sourceSet.id)
        .order('order_index', { ascending: true })

    if (sourceCards && sourceCards.length > 0) {
        const payload = sourceCards.map((card: any, index: number) => ({
            set_id: newSet.id,
            term: card.term,
            definition: card.definition,
            order_index: card.order_index ?? index,
        }))

        await (admin as any).from('flashcards').insert(payload)
    }

    revalidatePath('/dashboard/flashcards/library')
    return { success: true, setId: newSet.id }
}

export async function saveFlashcardProgress(setId: string, cardId: string, status: FlashcardProgressStatus) {
    const { supabase, user } = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    if (!['unknown', 'known', 'mastered'].includes(status)) {
        return { error: 'Trạng thái không hợp lệ.' }
    }

    const { data: card } = await (supabase as any)
        .from('flashcards')
        .select('id,set_id')
        .eq('id', cardId)
        .eq('set_id', setId)
        .single()

    if (!card) return { error: 'Card không tồn tại hoặc bạn không có quyền truy cập.' }

    const now = new Date().toISOString()
    const { error } = await (supabase as any)
        .from('flashcard_progress')
        .upsert({
            set_id: setId,
            card_id: cardId,
            user_id: user.id,
            status,
            last_seen_at: now,
            updated_at: now,
        }, { onConflict: 'card_id,user_id' })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/flashcards/${setId}/study`)
    revalidatePath('/dashboard/flashcards/library')
    return { success: true }
}
