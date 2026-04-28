import { parseCsvRows, readSpreadsheetRows, type TableRow } from '@/lib/client/spreadsheet'

export interface ImportedFlashcardDraft {
    term: string
    definition: string
}

export interface FlashcardImportPreview {
    cards: ImportedFlashcardDraft[]
    errors: string[]
    delimiter: string
}

function normalizeCell(value: unknown) {
    return value === null || value === undefined ? '' : String(value).trim()
}

function isHeader(term: string, definition: string) {
    const left = term.toLowerCase()
    const right = definition.toLowerCase()
    return (
        ['term', 'terms', 'front', 'question', 'từ khóa', 'thuật ngữ'].includes(left) ||
        ['definition', 'back', 'answer', 'định nghĩa', 'nghĩa'].includes(right)
    )
}

function pushCard(cards: ImportedFlashcardDraft[], errors: string[], term: string, definition: string, lineLabel: string) {
    const safeTerm = term.trim()
    const safeDefinition = definition.trim()

    if (!safeTerm || !safeDefinition) {
        errors.push(`${lineLabel}: thiếu Term hoặc Definition.`)
        return
    }

    if (safeTerm.length > 500) {
        errors.push(`${lineLabel}: Term vượt quá 500 ký tự.`)
        return
    }

    if (safeDefinition.length > 5000) {
        errors.push(`${lineLabel}: Definition vượt quá 5000 ký tự.`)
        return
    }

    cards.push({ term: safeTerm, definition: safeDefinition })
}

function splitLine(line: string): { term: string; definition: string; delimiter: string } | null {
    const trimmed = line.trim()
    if (!trimmed) return null

    if (trimmed.includes('\t')) {
        const [term, ...rest] = trimmed.split('\t')
        return { term, definition: rest.join('\t'), delimiter: 'tab' }
    }

    if (trimmed.includes(';')) {
        const [term, ...rest] = trimmed.split(';')
        return { term, definition: rest.join(';'), delimiter: 'semicolon' }
    }

    const dashMatch = trimmed.match(/\s+[-–—]\s+/)
    if (dashMatch?.index !== undefined) {
        const term = trimmed.slice(0, dashMatch.index)
        const definition = trimmed.slice(dashMatch.index + dashMatch[0].length)
        return { term, definition, delimiter: 'dash' }
    }

    if (trimmed.includes(',')) {
        const row = parseCsvRows(trimmed)[0] || []
        if (row.length >= 2) {
            return {
                term: normalizeCell(row[0]),
                definition: row.slice(1).map(normalizeCell).join(', '),
                delimiter: 'comma',
            }
        }
    }

    return null
}

export function parseFlashcardText(input: string): FlashcardImportPreview {
    const rawLines = input
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)

    const cards: ImportedFlashcardDraft[] = []
    const errors: string[] = []
    const delimiterHits: Record<string, number> = {}
    const unsplitLines: { line: string; index: number }[] = []

    for (let index = 0; index < rawLines.length; index++) {
        const parsed = splitLine(rawLines[index])
        if (!parsed) {
            unsplitLines.push({ line: rawLines[index], index })
            continue
        }

        delimiterHits[parsed.delimiter] = (delimiterHits[parsed.delimiter] || 0) + 1

        if (cards.length === 0 && isHeader(parsed.term.trim(), parsed.definition.trim())) {
            continue
        }

        pushCard(cards, errors, parsed.term, parsed.definition, `Dòng ${index + 1}`)
    }

    if (cards.length === 0 && unsplitLines.length > 0) {
        if (unsplitLines.length % 2 !== 0) {
            errors.push('Dữ liệu dùng new line delimiter phải có số dòng chẵn: Term rồi Definition.')
        }

        for (let index = 0; index + 1 < unsplitLines.length; index += 2) {
            const termLine = unsplitLines[index]
            const definitionLine = unsplitLines[index + 1]
            if (index === 0 && isHeader(termLine.line, definitionLine.line)) {
                continue
            }
            pushCard(cards, errors, termLine.line, definitionLine.line, `Dòng ${termLine.index + 1}-${definitionLine.index + 1}`)
        }

        delimiterHits.newline = Math.floor(unsplitLines.length / 2)
    } else if (unsplitLines.length > 0) {
        unsplitLines.forEach(item => {
            errors.push(`Dòng ${item.index + 1}: không phát hiện được delimiter.`)
        })
    }

    const delimiter = Object.entries(delimiterHits).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
    return { cards, errors, delimiter }
}

export function parseFlashcardRows(rows: TableRow[]): FlashcardImportPreview {
    const cards: ImportedFlashcardDraft[] = []
    const errors: string[] = []

    rows.forEach((row, index) => {
        const normalized = row.map(normalizeCell)
        if (normalized.every(cell => cell === '')) return

        const term = normalized[0] || ''
        const definition = normalized.slice(1).filter(Boolean).join(' ')

        if (cards.length === 0 && isHeader(term, normalized[1] || '')) {
            return
        }

        pushCard(cards, errors, term, definition, `Dòng ${index + 1}`)
    })

    return { cards, errors, delimiter: 'table' }
}

export async function parseFlashcardFile(file: File): Promise<FlashcardImportPreview> {
    const name = file.name.toLowerCase()

    if (name.endsWith('.txt')) {
        return parseFlashcardText(await file.text())
    }

    if (name.endsWith('.csv')) {
        const rows = parseCsvRows(await file.text())
        return parseFlashcardRows(rows)
    }

    if (name.endsWith('.xlsx')) {
        const rows = await readSpreadsheetRows(file)
        return parseFlashcardRows(rows)
    }

    throw new Error('Chỉ hỗ trợ CSV, TXT hoặc Excel (.xlsx).')
}
