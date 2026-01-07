'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin' // Needed for fetching source quiz ignoring RLS
import { revalidatePath } from 'next/cache'

function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// --- Interfaces ---
export interface Quiz {
    id: string
    title: string
    description?: string
    is_public: boolean
    share_token: string
    created_at: string
}

export interface Question {
    id: string
    quiz_id: string
    content: string
    type: 'single' | 'multiple'
    explanation?: string
    media_url?: string
    media_type?: 'image' | 'youtube'
    order_index: number
    answers?: Answer[]
}

export interface Answer {
    id: string
    question_id: string
    content: string
    is_correct: boolean
    order_index: number
}

// --- Quiz CRUD ---

export async function getQuizzes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await (supabase as any)
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching quizzes:', error)
        return []
    }
    return data
}

export async function getQuiz(id: string) {
    const supabase = await createClient()
    const { data, error } = await (supabase as any)
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data
}

export async function getQuizWithDetails(id: string) {
    const supabase = await createClient()

    // Auth check implied by RLS, but explicit check good for logic
    // We will let RLS handle if user can see it
    const { data: quiz, error: quizError } = await (supabase as any)
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single()

    if (quizError || !quiz) return null

    // Fetch Questions
    const { data: questions, error: qError } = await (supabase as any)
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index', { ascending: true })

    if (qError) return null

    // Fetch Answers for all questions
    const { data: answers, error: aError } = await (supabase as any)
        .from('quiz_answers')
        .select('*')
        .in('question_id', questions.map((q: any) => q.id))
        .order('order_index', { ascending: true })

    if (aError) return null

    // Map answers to questions
    const questionsWithAnswers = questions.map((q: any) => ({
        ...q,
        answers: answers.filter((a: any) => a.question_id === q.id)
    }))

    return {
        ...quiz,
        questions: questionsWithAnswers
    }
}

export async function createQuiz(title: string, description: string, isPublic: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await (supabase as any)
        .from('quizzes')
        .insert({
            user_id: user.id,
            title,
            description,
            is_public: isPublic
        })
        .select()
        .single()

    if (error) return { error: error.message }
    revalidatePath('/dashboard/quiz/my-quizzes')
    return { success: true, data }
}

export async function updateQuiz(id: string, data: Partial<Quiz>) {
    const supabase = await createClient()

    const { error } = await (supabase as any)
        .from('quizzes')
        .update(data)
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/quiz/my-quizzes')
    revalidatePath(`/dashboard/quiz/${id}/edit`)
    return { success: true }
}

export async function deleteQuiz(id: string) {
    const supabase = await createClient()

    const { error } = await (supabase as any)
        .from('quizzes')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/quiz/my-quizzes')
    return { success: true }
}

// --- Question/Answer CRUD ---

export async function createQuestion(quizId: string, questionData: Partial<Question>, answersData: Partial<Answer>[]) {
    const supabase = await createClient()

    // 1. Create Question
    const { data: question, error: qError } = await (supabase as any)
        .from('quiz_questions')
        .insert({
            quiz_id: quizId,
            content: questionData.content,
            type: questionData.type,
            explanation: questionData.explanation,
            media_url: questionData.media_url,
            media_type: questionData.media_type,
            order_index: questionData.order_index || 0
        })
        .select()
        .single()

    if (qError) return { error: qError.message }

    // 2. Create Answers
    if (answersData.length > 0) {
        const formattedAnswers = answersData.map((a, idx) => ({
            question_id: question.id,
            content: a.content,
            is_correct: a.is_correct,
            order_index: idx
        }))

        const { error: aError } = await (supabase as any)
            .from('quiz_answers')
            .insert(formattedAnswers as any)

        if (aError) return { error: 'Question created but failed to save answers: ' + aError.message }
    }

    revalidatePath(`/dashboard/quiz/${quizId}/edit`)
    return { success: true, data: question }
}

export async function updateQuestion(id: string, questionData: Partial<Question>, answersData: Partial<Answer>[]) {
    const supabase = await createClient()

    // 1. Update Question
    // We construct the update object only with defined fields
    const updatePayload: any = {}
    if (questionData.content) updatePayload.content = questionData.content
    if (questionData.type) updatePayload.type = questionData.type
    if (questionData.explanation !== undefined) updatePayload.explanation = questionData.explanation
    if (questionData.media_url !== undefined) updatePayload.media_url = questionData.media_url
    if (questionData.media_type !== undefined) updatePayload.media_type = questionData.media_type

    // Explicitly update updated_at if schema has trigger or we do it manually
    updatePayload.updated_at = new Date().toISOString()

    const { error: qError } = await (supabase as any)
        .from('quiz_questions')
        .update(updatePayload)
        .eq('id', id)

    if (qError) return { error: qError.message }

    // 2. Update Answers
    // Strategy: Delete all existing and re-insert.

    // Delete existing
    const { error: delError } = await (supabase as any)
        .from('quiz_answers')
        .delete()
        .eq('question_id', id)

    if (delError) return { error: 'Failed to clear old answers' }

    // Insert new
    if (answersData.length > 0) {
        const formattedAnswers = answersData.map((a, idx) => ({
            question_id: id,
            content: a.content || '',
            is_correct: a.is_correct || false,
            order_index: idx
        }))

        const { error: aError } = await (supabase as any)
            .from('quiz_answers')
            .insert(formattedAnswers as any) // Cast to any to avoid strict type mismatch on insert array if types aren't perfect

        if (aError) return { error: 'Failed to save new answers: ' + aError.message }
    }

    // Attempt to revalidate the quiz edit page. 
    // We need quizId. We can fetch it or just rely on client refresh. 
    // Ideally we return success and client handles it.

    return { success: true }
}

export async function deleteQuestion(id: string) {
    const supabase = await createClient()
    const { error } = await (supabase as any).from('quiz_questions').delete().eq('id', id)
    if (error) return { error: error.message }
    return { success: true }
}

// --- Attempts & History ---

export async function submitQuizAttempt(quizId: string, userAnswers: { questionId: string, answerIds: string[] }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch correct answers to calculate score
    // Securely fetch details server-side
    const details = await getQuizWithDetails(quizId)
    if (!details) return { error: 'Quiz not found' }

    let score = 0
    let totalQuestions = details.questions.length

    // Logic: 
    // Single choice: Correct if selected ID matches correct ID
    // Multi choice: Correct if ALL selected IDs match ALL correct IDs (strict) OR partial? 
    // Let's go with simple strict matching for now.

    const attemptAnswersPayload: any[] = []

    for (const q of details.questions) {
        const ua = userAnswers.find(item => item.questionId === q.id)
        if (!ua) continue

        const correctAnswers = q.answers?.filter((a: any) => a.is_correct).map((a: any) => a.id) || []
        const selectedIds = ua.answerIds

        let isCorrect = false
        if (q.type === 'single') {
            if (selectedIds.length === 1 && correctAnswers.includes(selectedIds[0])) {
                isCorrect = true
            }
        } else {
            // Multiple
            // Check if selected contains all correct AND no extras
            const selectedSet = new Set(selectedIds)
            const correctSet = new Set(correctAnswers)
            if (selectedSet.size === correctSet.size && [...selectedSet].every(x => correctSet.has(x))) {
                isCorrect = true
            }
        }

        if (isCorrect) score++

        // Prepare payload for DB
        // For multiple choice, we might insert multiple rows or just logical handling. 
        // Schema `quiz_attempt_answers` links to `answer_id`. 
        // If multiple answers selected, we insert multiple rows for this attempt+question.
        selectedIds.forEach(aid => {
            attemptAnswersPayload.push({
                question_id: q.id,
                answer_id: aid
            })
        })
    }

    // 2. Create Attempt
    // If user is not logged in, we do not save the attempt to DB (RLS would block anyway)
    // We just return the score.
    if (!user) {
        return { success: true, attemptId: null, score, totalQuestions, saved: false }
    }

    const { data: attempt, error: attError } = await (supabase as any)
        .from('quiz_attempts')
        .insert({
            quiz_id: quizId,
            user_id: user.id,
            score,
            total_questions: totalQuestions,
            // started_at default now()
            completed_at: new Date().toISOString()
        })
        .select()
        .single()

    if (attError) return { error: attError.message }

    // 3. Insert Answer Details
    // append attempt_id to payload
    const finalPayload = attemptAnswersPayload.map(p => ({ ...p, attempt_id: attempt.id }))
    if (finalPayload.length > 0) {
        const { error: ansError } = await (supabase as any).from('quiz_attempt_answers').insert(finalPayload as any)
        if (ansError) console.error('Error saving detailed answers:', ansError)
    }

    revalidatePath('/dashboard/quiz/history')
    return { success: true, attemptId: attempt.id, score, totalQuestions, saved: true }
}

export async function getQuizHistory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await (supabase as any)
        .from('quiz_attempts')
        .select(`
            *,
            quizzes ( title )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })

    if (error) return []
    return data
}

export async function resetHistory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await (supabase as any)
        .from('quiz_attempts')
        .delete()
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/quiz/history')
    return { success: true }
}

export async function importQuizFromToken(tokenOrId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized: Bạn cần đăng nhập để nhập câu hỏi.' }

    const adminClient = createAdminClient()

    // 1. Find source quiz
    // Try by share_token first
    let { data: sourceQuiz } = await (adminClient as any)
        .from('quizzes')
        .select(`
            *,
            quiz_questions (
                *,
                quiz_answers (*)
            )
        `)
        .eq('share_token', tokenOrId)
        .single()

    // If not found, try by ID (if it's a UUID)
    if (!sourceQuiz) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(tokenOrId)) {
            const { data: qById } = await (adminClient as any)
                .from('quizzes')
                .select(`
                    *,
                    quiz_questions (
                        *,
                        quiz_answers (*)
                    )
                `)
                .eq('id', tokenOrId)
                .single()
            sourceQuiz = qById
        }
    }

    if (!sourceQuiz) {
        return { error: 'Không tìm thấy bộ câu hỏi với mã này.' }
    }

    // 2. Clone Quiz
    const newShareToken = generateToken()
    const { data: newQuiz, error: insertError } = await (supabase as any)
        .from('quizzes')
        .insert({
            user_id: user.id,
            title: `${sourceQuiz.title} (Copy)`,
            description: sourceQuiz.description,
            is_public: false,
            share_token: newShareToken
        })
        .select()
        .single()

    if (insertError) return { error: 'Lỗi khi tạo quiz mới: ' + insertError.message }

    // 3. Clone Questions & Answers
    if (sourceQuiz.quiz_questions && sourceQuiz.quiz_questions.length > 0) {
        // Sort to keep order
        const sortedQuestions = sourceQuiz.quiz_questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))

        for (const q of sortedQuestions) {
            // Insert Question
            const { data: newQ, error: qErr } = await (supabase as any)
                .from('quiz_questions')
                .insert({
                    quiz_id: newQuiz.id,
                    content: q.content,
                    type: q.type,
                    explanation: q.explanation,
                    media_url: q.media_url,
                    media_type: q.media_type,
                    order_index: q.order_index
                })
                .select()
                .single()

            if (qErr) continue

            // Insert Answers
            if (q.quiz_answers && q.quiz_answers.length > 0) {
                const answersPayload = q.quiz_answers.map((a: any) => ({
                    question_id: newQ.id,
                    content: a.content,
                    is_correct: a.is_correct,
                    order_index: a.order_index
                }))
                await (supabase as any).from('quiz_answers').insert(answersPayload)
            }
        }
    }

    revalidatePath('/dashboard/quiz/my-quizzes')
    return { success: true, quizId: newQuiz.id }
}

export async function createQuestionsBatch(quizId: string, questionsData: { question: Partial<Question>, answers: Partial<Answer>[] }[]) {
    const supabase = await createClient()

    // Limits: processed in chunks if too large? 
    // For now, simple loop with Promise.all for parallelism might be okay, or sequential to ensure order.
    // Sequential is safer for rate limits.

    let successCount = 0
    let errors: string[] = []

    for (const item of questionsData) {
        const { question, answers } = item

        // 1. Create Question
        const { data: qData, error: qError } = await (supabase as any)
            .from('quiz_questions')
            .insert({
                quiz_id: quizId,
                content: question.content,
                type: question.type,
                explanation: question.explanation,
                media_url: question.media_url,
                media_type: question.media_type,
                order_index: question.order_index
            })
            .select()
            .single()

        if (qError) {
            errors.push(`Question "${question.content}": ${qError.message}`)
            continue
        }

        // 2. Create Answers
        if (answers && answers.length > 0) {
            const answersPayload = answers.map((a, idx) => ({
                question_id: qData.id,
                content: a.content,
                is_correct: a.is_correct,
                order_index: idx
            }))

            const { error: aError } = await (supabase as any)
                .from('quiz_answers')
                .insert(answersPayload)

            if (aError) {
                errors.push(`Answers for "${question.content}": ${aError.message}`)
            }
        }
        successCount++
    }

    revalidatePath(`/dashboard/quiz/${quizId}/edit`)
    return { success: true, count: successCount, errors }
}
