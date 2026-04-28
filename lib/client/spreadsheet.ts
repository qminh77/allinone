export type CellValue = string | number | boolean | Date | null | undefined
export type TableRow = CellValue[]
export type TableRecord = Record<string, unknown>

const textDecoder = new TextDecoder('utf-8')

function normalizeCell(value: unknown): string {
    if (value === null || value === undefined) return ''
    if (value instanceof Date) return value.toISOString()
    return String(value)
}

function escapeCsvValue(value: unknown): string {
    const text = normalizeCell(value)
    if (/[",\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`
    }
    return text
}

function escapeHtml(value: unknown): string {
    return normalizeCell(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export function parseCsvRows(csv: string): TableRow[] {
    const rows: TableRow[] = []
    let row: string[] = []
    let cell = ''
    let inQuotes = false

    for (let i = 0; i < csv.length; i++) {
        const char = csv[i]
        const next = csv[i + 1]

        if (inQuotes) {
            if (char === '"' && next === '"') {
                cell += '"'
                i++
            } else if (char === '"') {
                inQuotes = false
            } else {
                cell += char
            }
            continue
        }

        if (char === '"') {
            inQuotes = true
        } else if (char === ',') {
            row.push(cell)
            cell = ''
        } else if (char === '\n') {
            row.push(cell)
            rows.push(row)
            row = []
            cell = ''
        } else if (char !== '\r') {
            cell += char
        }
    }

    row.push(cell)
    if (row.some(value => value !== '') || rows.length === 0) {
        rows.push(row)
    }

    return rows
}

export function rowsToCsv(rows: readonly (readonly unknown[])[]): string {
    return rows.map(row => row.map(escapeCsvValue).join(',')).join('\n')
}

export function recordsToRows(records: readonly TableRecord[]): TableRow[] {
    if (records.length === 0) return []

    const headers = Array.from(
        records.reduce((keys, record) => {
            Object.keys(record).forEach(key => keys.add(key))
            return keys
        }, new Set<string>())
    )

    return [
        headers,
        ...records.map(record => headers.map(header => record[header] as CellValue)),
    ]
}

export function rowsToRecords(rows: readonly (readonly unknown[])[]): TableRecord[] {
    if (rows.length < 2) return []

    const headers = rows[0].map((header, index) => {
        const text = normalizeCell(header).trim()
        return text || `Column ${index + 1}`
    })

    return rows.slice(1)
        .filter(row => row.some(value => normalizeCell(value).trim() !== ''))
        .map(row => headers.reduce<TableRecord>((record, header, index) => {
            record[header] = row[index] ?? ''
            return record
        }, {}))
}

export function recordsToCsv(records: readonly TableRecord[]): string {
    return rowsToCsv(recordsToRows(records))
}

export function recordsToHtmlTable(records: readonly TableRecord[]): string {
    const rows = recordsToRows(records)
    if (rows.length === 0) return '<table></table>'

    const [headers, ...bodyRows] = rows
    const head = headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')
    const body = bodyRows.map(row => (
        `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
    )).join('')

    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

export async function readSpreadsheetRows(file: File): Promise<TableRow[]> {
    const name = file.name.toLowerCase()

    if (name.endsWith('.csv') || name.endsWith('.txt')) {
        return parseCsvRows(textDecoder.decode(await file.arrayBuffer()))
    }

    if (name.endsWith('.xlsx')) {
        const { default: readXlsxFile } = await import('read-excel-file/browser')
        const rows = await readXlsxFile(file)
        return rows.map(row => row as unknown as TableRow)
    }

    throw new Error('Unsupported spreadsheet format')
}

export function downloadTextFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
