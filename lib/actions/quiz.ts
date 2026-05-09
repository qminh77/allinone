'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin' // Needed for fetching source quiz ignoring RLS
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import type { Database } from '@/types/database'

function generateToken() {
    return randomBytes(16).toString('hex')
}

type QuizRow = Database['public']['Tables']['quizzes']['Row']
type QuizInsert = Database['public']['Tables']['quizzes']['Insert']
type QuizUpdate = Database['public']['Tables']['quizzes']['Update']
type QuizQuestionRow = Database['public']['Tables']['quiz_questions']['Row']
type QuizQuestionInsert = Database['public']['Tables']['quiz_questions']['Insert']
type QuizQuestionUpdate = Database['public']['Tables']['quiz_questions']['Update']
type QuizAnswerRow = Database['public']['Tables']['quiz_answers']['Row']
type QuizAnswerInsert = Database['public']['Tables']['quiz_answers']['Insert']
type QuizAttemptRow = Database['public']['Tables']['quiz_attempts']['Row']
type QuizAttemptInsert = Database['public']['Tables']['quiz_attempts']['Insert']
type QuizAttemptAnswerInsert = Database['public']['Tables']['quiz_attempt_answers']['Insert']

type QuizQuestionWithAnswers = QuizQuestionRow & {
    quiz_answers?: QuizAnswerRow[]
}

type QuizWithQuestions = QuizRow & {
    quiz_questions?: QuizQuestionWithAnswers[]
}

type QuizHistoryRow = QuizAttemptRow & {
    quizzes?: { title: string } | null
}

function sortByOrderIndex<T extends { order_index: number | null }>(items: T[]) {
    return [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
}

// --- Interfaces ---
export interface Quiz {
    id: string
    title: string
    description?: string | null
    is_public: boolean
    share_token: string | null
    created_at: string
}

export interface Question {
    id: string
    quiz_id: string
    content: string
    type: 'single' | 'multiple'
    explanation?: string | null
    media_url?: string | null
    media_type?: 'image' | 'youtube' | null
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

export interface QuizReviewItem {
    questionId: string
    correctAnswerIds: string[]
    explanation?: string
}

// --- Quiz CRUD ---

export async function getQuizzes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single()

    if (quizError || !quiz) return null
    const quizRow = quiz as QuizRow

    // Fetch Questions
    const { data: questions, error: qError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index', { ascending: true })

    if (qError) return null

    // Fetch Answers for all questions
    const questionRows = (questions ?? []) as QuizQuestionRow[]
    const questionIds = questionRows.map(question => question.id)
    const { data: answers, error: aError } = questionIds.length > 0
        ? await supabase
            .from('quiz_answers')
            .select('*')
            .in('question_id', questionIds)
            .order('order_index', { ascending: true })
        : { data: [] as QuizAnswerRow[], error: null }

    if (aError) return null

    // Map answers to questions
    const answerRows = (answers ?? []) as QuizAnswerRow[]
    const questionsWithAnswers = questionRows.map(question => ({
        ...question,
        answers: answerRows.filter(answer => answer.question_id === question.id)
    }))

    return {
        ...quizRow,
        questions: questionsWithAnswers
    }
}

async function getQuizWithDetailsForAttempt(id: string, accessToken?: string) {
    if (!accessToken) {
        return getQuizWithDetails(id)
    }

    const adminClient = createAdminClient()
    const { data: quizData } = await adminClient
        .from('quizzes')
        .select(`
            *,
            quiz_questions (
                *,
                quiz_answers (*)
            )
        `)
        .eq('id', id)
        .single()

    const quiz = quizData as QuizWithQuestions | null

    if (!quiz) return null

    const hasTokenAccess = quiz.share_token === accessToken
    const hasPublicIdAccess = quiz.is_public === true && quiz.id === accessToken
    if (!hasTokenAccess && !hasPublicIdAccess) {
        return null
    }

    const questions = sortByOrderIndex(quiz.quiz_questions ?? [])
        .map(question => ({
            ...question,
            answers: sortByOrderIndex(question.quiz_answers ?? []),
        }))

    return {
        ...quiz,
        questions,
    }
}

export async function createQuiz(title: string, description: string, isPublic: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const payload: QuizInsert = {
        user_id: user.id,
        title,
        description,
        is_public: isPublic
    }

    const { data, error } = await supabase
        .from('quizzes')
        .insert(payload as never)
        .select()
        .single()

    if (error) return { error: error.message }
    const createdQuiz = data as QuizRow | null
    if (!createdQuiz) return { error: 'Failed to create quiz' }
    revalidatePath('/dashboard/quiz/my-quizzes')
    return { success: true, data: createdQuiz }
}

export async function updateQuiz(id: string, data: QuizUpdate) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('quizzes')
        .update(data as never)
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/quiz/my-quizzes')
    revalidatePath(`/dashboard/quiz/${id}/edit`)
    return { success: true }
}

export async function deleteQuiz(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
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

    if (!questionData.content) {
        return { error: 'Question content is required' }
    }

    // 1. Create Question
    const questionPayload: QuizQuestionInsert = {
        quiz_id: quizId,
        content: questionData.content,
        type: questionData.type ?? 'single',
        explanation: questionData.explanation ?? null,
        media_url: questionData.media_url ?? null,
        media_type: questionData.media_type ?? null,
        order_index: questionData.order_index ?? 0
    }

    const { data: question, error: qError } = await supabase
        .from('quiz_questions')
        .insert(questionPayload as never)
        .select()
        .single()

    if (qError) return { error: qError.message }
    const createdQuestion = question as QuizQuestionRow | null
    if (!createdQuestion) return { error: 'Failed to create question' }

    // 2. Create Answers
    if (answersData.length > 0) {
        const formattedAnswers: QuizAnswerInsert[] = answersData.map((a, idx) => ({
            question_id: createdQuestion.id,
            content: a.content ?? '',
            is_correct: a.is_correct ?? false,
            order_index: idx
        }))

        const { error: aError } = await supabase
            .from('quiz_answers')
            .insert(formattedAnswers as never)

        if (aError) return { error: 'Question created but failed to save answers: ' + aError.message }
    }

    revalidatePath(`/dashboard/quiz/${quizId}/edit`)
    return { success: true, data: createdQuestion }
}

export async function updateQuestion(id: string, questionData: Partial<Question>, answersData: Partial<Answer>[]) {
    const supabase = await createClient()

    // 1. Update Question
    // We construct the update object only with defined fields
    const updatePayload: QuizQuestionUpdate = {}
    if (questionData.content) updatePayload.content = questionData.content
    if (questionData.type) updatePayload.type = questionData.type
    if (questionData.explanation !== undefined) updatePayload.explanation = questionData.explanation
    if (questionData.media_url !== undefined) updatePayload.media_url = questionData.media_url
    if (questionData.media_type !== undefined) updatePayload.media_type = questionData.media_type

    // Explicitly update updated_at if schema has trigger or we do it manually
    updatePayload.updated_at = new Date().toISOString()

    const { error: qError } = await supabase
        .from('quiz_questions')
        .update(updatePayload as never)
        .eq('id', id)

    if (qError) return { error: qError.message }

    // 2. Update Answers
    // Strategy: Delete all existing and re-insert.

    // Delete existing
    const { error: delError } = await supabase
        .from('quiz_answers')
        .delete()
        .eq('question_id', id)

    if (delError) return { error: 'Failed to clear old answers' }

    // Insert new
    if (answersData.length > 0) {
        const formattedAnswers: QuizAnswerInsert[] = answersData.map((a, idx) => ({
            question_id: id,
            content: a.content || '',
            is_correct: a.is_correct || false,
            order_index: idx
        }))

        const { error: aError } = await supabase
            .from('quiz_answers')
            .insert(formattedAnswers as never)

        if (aError) return { error: 'Failed to save new answers: ' + aError.message }
    }

    // Attempt to revalidate the quiz edit page. 
    // We need quizId. We can fetch it or just rely on client refresh. 
    // Ideally we return success and client handles it.

    return { success: true }
}

export async function deleteQuestion(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
    if (error) return { error: error.message }
    return { success: true }
}

// --- Attempts & History ---

export async function submitQuizAttempt(quizId: string, userAnswers: { questionId: string, answerIds: string[] }[], accessToken?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch correct answers to calculate score
    // Securely fetch details server-side
    const details = await getQuizWithDetailsForAttempt(quizId, accessToken)
    if (!details) return { error: 'Quiz not found' }

    let score = 0
    const totalQuestions = details.questions.length
    const review: QuizReviewItem[] = []

    // Logic: 
    // Single choice: Correct if selected ID matches correct ID
    // Multi choice: Correct if ALL selected IDs match ALL correct IDs (strict) OR partial? 
    // Let's go with simple strict matching for now.

    const attemptAnswersPayload: Array<Pick<QuizAttemptAnswerInsert, 'question_id' | 'answer_id'>> = []

    for (const q of details.questions) {
        const correctAnswers = q.answers?.filter(answer => answer.is_correct).map(answer => answer.id) || []
        review.push({
            questionId: q.id,
            correctAnswerIds: correctAnswers,
            explanation: q.explanation || undefined,
        })

        const ua = userAnswers.find(item => item.questionId === q.id)
        if (!ua) continue

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
        return { success: true, attemptId: null, score, totalQuestions, saved: false, review }
    }

    const attemptPayload: QuizAttemptInsert = {
        quiz_id: quizId,
        user_id: user.id,
        score,
        total_questions: totalQuestions,
        completed_at: new Date().toISOString()
    }

    const { data: attempt, error: attError } = await supabase
        .from('quiz_attempts')
        .insert(attemptPayload as never)
        .select()
        .single()

    if (attError) return { error: attError.message }
    const attemptRow = attempt as QuizAttemptRow | null
    if (!attemptRow) return { error: 'Failed to save quiz attempt' }

    // 3. Insert Answer Details
    // append attempt_id to payload
    const finalPayload: QuizAttemptAnswerInsert[] = attemptAnswersPayload.map(p => ({ ...p, attempt_id: attemptRow.id }))
    if (finalPayload.length > 0) {
        const { error: ansError } = await supabase.from('quiz_attempt_answers').insert(finalPayload as never)
        if (ansError) console.error('Error saving detailed answers:', ansError)
    }

    revalidatePath('/dashboard/quiz/history')
    return { success: true, attemptId: attemptRow.id, score, totalQuestions, saved: true, review }
}

export async function getQuizHistory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
            *,
            quizzes ( title )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })

    if (error) return []
    return data as QuizHistoryRow[]
}

export async function resetHistory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
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
    const quizSelect = `
            *,
            quiz_questions (
                *,
                quiz_answers (*)
            )
        `
    const fetchSourceQuiz = async (column: 'share_token' | 'id') => {
        const { data } = await adminClient
            .from('quizzes')
            .select(quizSelect)
            .eq(column, tokenOrId)
            .single()
        return data as QuizWithQuestions | null
    }

    // 1. Find source quiz
    // Try by share_token first
    let sourceQuiz = await fetchSourceQuiz('share_token')

    // If not found, try by ID (if it's a UUID)
    if (!sourceQuiz) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(tokenOrId)) {
            sourceQuiz = await fetchSourceQuiz('id')
        }
    }

    if (!sourceQuiz) {
        return { error: 'Không tìm thấy bộ câu hỏi với mã này.' }
    }

    // 2. Clone Quiz
    const newShareToken = generateToken()
    const quizInsert: QuizInsert = {
        user_id: user.id,
        title: `${sourceQuiz.title} (Copy)`,
        description: sourceQuiz.description,
        is_public: false,
        share_token: newShareToken
    }

    const { data: newQuiz, error: insertError } = await supabase
        .from('quizzes')
        .insert(quizInsert as never)
        .select()
        .single()

    if (insertError) return { error: 'Lỗi khi tạo quiz mới: ' + insertError.message }
    const newQuizRow = newQuiz as QuizRow | null
    if (!newQuizRow) return { error: 'Lỗi khi tạo quiz mới.' }

    // 3. Clone Questions & Answers
    if (sourceQuiz.quiz_questions && sourceQuiz.quiz_questions.length > 0) {
        // Sort to keep order
        const sortedQuestions = sortByOrderIndex(sourceQuiz.quiz_questions)

        for (const q of sortedQuestions) {
            // Insert Question
            const { data: newQ, error: qErr } = await supabase
                .from('quiz_questions')
                .insert({
                    quiz_id: newQuizRow.id,
                    content: q.content,
                    type: q.type,
                    explanation: q.explanation,
                    media_url: q.media_url,
                    media_type: q.media_type,
                    order_index: q.order_index
                } as QuizQuestionInsert as never)
                .select()
                .single()

            if (qErr) continue
            const newQuestionRow = newQ as QuizQuestionRow | null
            if (!newQuestionRow) continue

            // Insert Answers
            if (q.quiz_answers && q.quiz_answers.length > 0) {
                const answersPayload: QuizAnswerInsert[] = q.quiz_answers.map(answer => ({
                    question_id: newQuestionRow.id,
                    content: answer.content,
                    is_correct: answer.is_correct,
                    order_index: answer.order_index
                }))
                await supabase.from('quiz_answers').insert(answersPayload as never)
            }
        }
    }

    revalidatePath('/dashboard/quiz/my-quizzes')
    return { success: true, quizId: newQuizRow.id }
}

export async function createQuestionsBatch(quizId: string, questionsData: { question: Partial<Question>, answers: Partial<Answer>[] }[]) {
    const supabase = await createClient()

    // Limits: processed in chunks if too large? 
    // For now, simple loop with Promise.all for parallelism might be okay, or sequential to ensure order.
    // Sequential is safer for rate limits.

    let successCount = 0
    const errors: string[] = []

    for (const item of questionsData) {
        const { question, answers } = item

        if (!question.content) {
            errors.push('Question content is required')
            continue
        }

        // 1. Create Question
        const { data: qData, error: qError } = await supabase
            .from('quiz_questions')
            .insert({
                quiz_id: quizId,
                content: question.content,
                type: question.type ?? 'single',
                explanation: question.explanation ?? null,
                media_url: question.media_url ?? null,
                media_type: question.media_type ?? null,
                order_index: question.order_index ?? 0
            } as QuizQuestionInsert as never)
            .select()
            .single()

        if (qError) {
            errors.push(`Question "${question.content}": ${qError.message}`)
            continue
        }
        const questionRow = qData as QuizQuestionRow | null
        if (!questionRow) {
            errors.push(`Question "${question.content}": Failed to create question`)
            continue
        }

        // 2. Create Answers
        if (answers && answers.length > 0) {
            const answersPayload: QuizAnswerInsert[] = answers.map((a, idx) => ({
                question_id: questionRow.id,
                content: a.content ?? '',
                is_correct: a.is_correct ?? false,
                order_index: idx
            }))

            const { error: aError } = await supabase
                .from('quiz_answers')
                .insert(answersPayload as never)

            if (aError) {
                errors.push(`Answers for "${question.content}": ${aError.message}`)
            }
        }
        successCount++
    }

    revalidatePath(`/dashboard/quiz/${quizId}/edit`)
    return { success: true, count: successCount, errors }
}
