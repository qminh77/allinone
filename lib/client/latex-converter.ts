import { recordsToCsv, rowsToCsv, type TableRecord } from '@/lib/client/spreadsheet'

export type LatexDownloadKind = 'text' | 'pdf' | 'png' | 'jpeg'

export interface LatexConversionResult {
    content: string
    extension: string
    mimeType: string
    downloadKind: LatexDownloadKind
    targetFormat: string
    summary: string
    warning?: string
}

interface LatexTable {
    headers: string[]
    rows: string[][]
    records: TableRecord[]
    hasHeader: boolean
}

interface LatexDocument {
    source: string
    plainText: string
    markdown: string
    table: LatexTable | null
}

interface ConvertOptions {
    sourceName?: string
}

const TEXT_COMMANDS = new Set([
    'textbf',
    'textit',
    'emph',
    'underline',
    'textrm',
    'textsf',
    'texttt',
    'textsc',
    'textcolor',
    'mbox',
    'caption',
    'label',
])

const FORMAT_INFO: Record<string, { extension: string; mimeType: string; downloadKind?: LatexDownloadKind }> = {
    actionscript: { extension: 'as', mimeType: 'text/plain' },
    ascii: { extension: 'txt', mimeType: 'text/plain' },
    asciidoc: { extension: 'adoc', mimeType: 'text/asciidoc' },
    asp: { extension: 'asp', mimeType: 'text/plain' },
    avro: { extension: 'avsc', mimeType: 'application/json' },
    bbcode: { extension: 'bbcode', mimeType: 'text/plain' },
    csv: { extension: 'csv', mimeType: 'text/csv;charset=utf-8' },
    dax: { extension: 'dax', mimeType: 'text/plain' },
    excel: { extension: 'csv', mimeType: 'text/csv;charset=utf-8' },
    firebase: { extension: 'json', mimeType: 'application/json' },
    html: { extension: 'html', mimeType: 'text/html;charset=utf-8' },
    ini: { extension: 'ini', mimeType: 'text/plain' },
    jira: { extension: 'jira', mimeType: 'text/plain' },
    jpeg: { extension: 'jpg', mimeType: 'image/jpeg', downloadKind: 'jpeg' },
    json: { extension: 'json', mimeType: 'application/json' },
    jsonlines: { extension: 'jsonl', mimeType: 'application/x-ndjson' },
    latex: { extension: 'tex', mimeType: 'application/x-tex' },
    magic: { extension: 'txt', mimeType: 'text/plain' },
    markdown: { extension: 'md', mimeType: 'text/markdown;charset=utf-8' },
    matlab: { extension: 'm', mimeType: 'text/plain' },
    mediawiki: { extension: 'wiki', mimeType: 'text/plain' },
    pandasdataframe: { extension: 'py', mimeType: 'text/x-python' },
    pdf: { extension: 'pdf', mimeType: 'application/pdf', downloadKind: 'pdf' },
    php: { extension: 'php', mimeType: 'application/x-httpd-php' },
    png: { extension: 'png', mimeType: 'image/png', downloadKind: 'png' },
    protobuf: { extension: 'proto', mimeType: 'text/plain' },
    qlik: { extension: 'qvs', mimeType: 'text/plain' },
    rdataframe: { extension: 'R', mimeType: 'text/plain' },
    rdf: { extension: 'ttl', mimeType: 'text/turtle' },
    restructuredtext: { extension: 'rst', mimeType: 'text/x-rst' },
    ruby: { extension: 'rb', mimeType: 'text/x-ruby' },
    sql: { extension: 'sql', mimeType: 'application/sql' },
    textile: { extension: 'textile', mimeType: 'text/plain' },
    toml: { extension: 'toml', mimeType: 'application/toml' },
    tracwiki: { extension: 'tracwiki', mimeType: 'text/plain' },
    xml: { extension: 'xml', mimeType: 'application/xml' },
    yaml: { extension: 'yaml', mimeType: 'application/yaml' },
}

export function getLatexTargetFormat(slug: string) {
    return slug.replace(/^latex-to-/, '').toLowerCase()
}

export function getLatexFormatInfo(targetFormat: string) {
    const info = FORMAT_INFO[targetFormat] || { extension: 'txt', mimeType: 'text/plain' }
    return {
        ...info,
        downloadKind: info.downloadKind || ('text' as LatexDownloadKind),
    }
}

export function convertLatex(content: string, slug: string, options: ConvertOptions = {}): LatexConversionResult {
    const targetFormat = getLatexTargetFormat(slug)
    const info = getLatexFormatInfo(targetFormat)
    const document = parseLatexDocument(content)
    const table = document.table
    const tableRows = table ? [table.headers, ...table.rows] : []
    const tableRecords = table?.records || []
    const sourceName = sanitizeBaseName(options.sourceName || 'latex_data')
    let warning: string | undefined
    let output: string

    switch (targetFormat) {
        case 'latex':
            output = formatLatex(content)
            break
        case 'ascii':
            output = toAscii(document.plainText)
            break
        case 'markdown':
            output = document.markdown
            break
        case 'html':
            output = markdownToHtml(document.markdown)
            break
        case 'csv':
        case 'excel':
            output = table ? rowsToCsv(tableRows) : rowsToCsv([['content'], [document.plainText]])
            if (targetFormat === 'excel') {
                warning = 'Excel export dùng CSV để đảm bảo tương thích và mở trực tiếp được bằng Excel.'
            }
            break
        case 'json':
            output = JSON.stringify(table ? tableRecords : documentToJson(document), null, 2)
            break
        case 'jsonlines':
            output = table
                ? tableRecords.map(record => JSON.stringify(record)).join('\n')
                : JSON.stringify(documentToJson(document))
            break
        case 'sql':
            output = table ? tableToSql(table, sourceName) : `-- No LaTeX table found.\n-- Plain text:\n${prefixLines(document.plainText, '-- ')}`
            break
        case 'xml':
            output = table ? recordsToXml(tableRecords) : documentToXml(document)
            break
        case 'yaml':
            output = table ? recordsToYaml(tableRecords) : documentToYaml(document)
            break
        case 'toml':
            output = table ? recordsToToml(tableRecords) : `content = ${quoteToml(document.plainText)}\n`
            break
        case 'ini':
            output = table ? recordsToIni(tableRecords) : `[document]\ncontent=${quoteIni(document.plainText)}\n`
            break
        case 'asciidoc':
            output = table ? tableToAsciiDoc(table) : markdownToAsciiDoc(document.markdown)
            break
        case 'restructuredtext':
            output = table ? tableToRst(table) : markdownToRst(document.markdown)
            break
        case 'mediawiki':
            output = table ? tableToMediaWiki(table) : markdownToMediaWiki(document.markdown)
            break
        case 'jira':
            output = table ? tableToJira(table) : document.markdown
            break
        case 'textile':
            output = table ? tableToTextile(table) : markdownToTextile(document.markdown)
            break
        case 'tracwiki':
            output = table ? tableToTracWiki(table) : document.markdown
            break
        case 'bbcode':
            output = table ? tableToBBCode(table) : markdownToBBCode(document.markdown)
            break
        case 'pandasdataframe':
            output = table ? tableToPandas(table) : `content = ${quotePython(document.plainText)}\n`
            break
        case 'rdataframe':
            output = table ? tableToRDataFrame(table) : `content <- ${quoteR(document.plainText)}\n`
            break
        case 'matlab':
            output = table ? tableToMatlab(table) : `content = ${quoteMatlab(document.plainText)};\n`
            break
        case 'php':
            output = table ? `<?php\n$data = ${phpValue(tableRecords)};\n?>` : `<?php\n$content = ${quotePhp(document.plainText)};\n?>`
            break
        case 'ruby':
            output = table ? `data = ${rubyValue(tableRecords)}\n` : `content = ${quoteRuby(document.plainText)}\n`
            break
        case 'firebase':
            output = JSON.stringify(table ? { rows: tableRecords } : documentToJson(document), null, 2)
            break
        case 'avro':
            output = JSON.stringify(table ? tableToAvroSchema(table, sourceName) : documentAvroSchema(sourceName), null, 2)
            break
        case 'protobuf':
            output = table ? tableToProtobuf(table) : documentToProtobuf()
            break
        case 'rdf':
            output = table ? tableToRdf(table) : documentToRdf(document)
            break
        case 'qlik':
            output = table ? tableToQlik(table, sourceName) : `Document:\nLOAD * INLINE [\ncontent\n${escapeQlik(document.plainText)}\n];`
            break
        case 'dax':
            output = table ? tableToDax(table, sourceName) : `Document = ${quoteDax(document.plainText)}`
            break
        case 'actionscript':
            output = table ? `var rows:Array = ${jsonForCode(tableRecords)};` : `var content:String = ${quoteActionScript(document.plainText)};`
            break
        case 'asp':
            output = `Dim content\ncontent = ${quoteVBScript(table ? rowsToCsv(tableRows) : document.plainText)}\nResponse.Write content`
            break
        case 'magic':
            output = createSummary(document)
            break
        case 'pdf':
        case 'png':
        case 'jpeg':
            output = table ? tableToMarkdown(table) : document.plainText
            warning = 'Preview là nội dung đã chuẩn hóa. File tải xuống sẽ render nội dung này thành PDF/ảnh trong trình duyệt.'
            break
        default:
            output = table ? recordsToCsv(tableRecords) : document.plainText
            warning = `Định dạng ${targetFormat} chưa có formatter chuyên biệt, đã trả về nội dung chuẩn hóa ổn định.`
            break
    }

    return {
        content: output,
        extension: info.extension,
        mimeType: info.mimeType,
        downloadKind: info.downloadKind,
        targetFormat,
        summary: table
            ? `Đã nhận diện bảng ${table.rows.length} dòng x ${table.headers.length} cột.`
            : 'Không tìm thấy bảng LaTeX; đã chuyển đổi theo nội dung văn bản.',
        warning,
    }
}

function parseLatexDocument(source: string): LatexDocument {
    const normalized = normalizeLineEndings(source)
    const withoutComments = stripLatexComments(normalized)
    const table = parseLatexTable(withoutComments)
    const tableMarkdown = table ? tableToMarkdown(table) : ''
    const textWithoutTables = removeTableEnvironments(withoutComments)
    const bodyPlainText = normalizeWhitespace(latexToPlainText(textWithoutTables))
    const bodyMarkdown = normalizeMarkdown(latexToMarkdown(textWithoutTables))
    const plainText = [bodyPlainText, tableMarkdown].filter(Boolean).join('\n\n') || withoutComments.trim()
    const markdown = [bodyMarkdown, tableMarkdown].filter(Boolean).join('\n\n') || plainText

    return {
        source: normalized,
        plainText,
        markdown,
        table,
    }
}

function normalizeLineEndings(value: string) {
    return value.replace(/\r\n?/g, '\n')
}

function stripLatexComments(source: string) {
    return source.split('\n').map(line => line.replace(/(^|[^\\])%.*/, '$1')).join('\n')
}

function parseLatexTable(source: string): LatexTable | null {
    const environment = extractTableEnvironment(source)
    if (!environment) return null

    const body = normalizeTableBody(environment.body)
    const rows = splitLatexRows(body)
        .map(row => splitLatexCells(row).map(cleanLatexCell))
        .map(row => row.filter((cell, index) => cell || index === 0))
        .filter(row => row.some(cell => cell.trim() !== ''))

    if (rows.length === 0) return null

    const columnCount = Math.max(...rows.map(row => row.length))
    const normalizedRows = rows.map(row => padRow(row, columnCount))
    const hasHeader = normalizedRows.length > 1 && looksLikeHeader(normalizedRows[0], normalizedRows.slice(1))
    const headers = hasHeader
        ? normalizeHeaders(normalizedRows[0])
        : Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`)
    const dataRows = hasHeader ? normalizedRows.slice(1) : normalizedRows
    const records = dataRows.map(rowToRecord(headers)).filter(record => (
        Object.values(record).some(value => String(value).trim() !== '')
    ))

    return {
        headers,
        rows: dataRows,
        records,
        hasHeader,
    }
}

function extractTableEnvironment(source: string) {
    const beginRegex = /\\begin\s*\{(tabular\*?|tabularx|longtable|array)\}/g
    const match = beginRegex.exec(source)
    if (!match) return null

    const envName = match[1]
    let bodyStart = match.index + match[0].length

    for (let groupCount = 0; groupCount < 3; groupCount++) {
        bodyStart = skipWhitespace(source, bodyStart)
        const nextChar = source[bodyStart]
        if (nextChar !== '{' && nextChar !== '[') break

        const skipped = skipBalancedGroup(source, bodyStart)
        if (skipped === bodyStart) break
        bodyStart = skipped
    }

    const endRegex = new RegExp(`\\\\end\\s*\\{${escapeRegExp(envName)}\\}`, 'g')
    endRegex.lastIndex = bodyStart
    const endMatch = endRegex.exec(source)
    if (!endMatch) return null

    return {
        envName,
        body: source.slice(bodyStart, endMatch.index),
        start: match.index,
        end: endMatch.index + endMatch[0].length,
    }
}

function removeTableEnvironments(source: string) {
    let result = source
    let environment = extractTableEnvironment(result)

    while (environment) {
        result = `${result.slice(0, environment.start)}\n${result.slice(environment.end)}`
        environment = extractTableEnvironment(result)
    }

    return result
}

function skipWhitespace(source: string, index: number) {
    let current = index
    while (/\s/.test(source[current] || '')) current++
    return current
}

function skipBalancedGroup(source: string, index: number) {
    const open = source[index]
    const close = open === '{' ? '}' : ']'
    let depth = 0

    for (let i = index; i < source.length; i++) {
        const char = source[i]
        const previous = source[i - 1]
        if (char === open && previous !== '\\') depth++
        if (char === close && previous !== '\\') {
            depth--
            if (depth === 0) return i + 1
        }
    }

    return index
}

function normalizeTableBody(body: string) {
    return body
        .replace(/\\(?:hline|toprule|midrule|bottomrule)\b/g, '\n')
        .replace(/\\(?:cline|cmidrule)\s*\{[^}]*\}/g, '\n')
        .replace(/\\addlinespace(?:\[[^\]]*\])?/g, '\n')
        .trim()
}

function splitLatexRows(body: string) {
    const rows: string[] = []
    let current = ''
    let depth = 0

    for (let i = 0; i < body.length; i++) {
        const char = body[i]
        const next = body[i + 1]
        const previous = body[i - 1]

        if (char === '{' && previous !== '\\') depth++
        if (char === '}' && previous !== '\\' && depth > 0) depth--

        if (char === '\\' && next === '\\' && depth === 0) {
            rows.push(current)
            current = ''
            i++

            if (body[i + 1] === '[') {
                i = skipBalancedGroup(body, i + 1) - 1
            }
            continue
        }

        current += char
    }

    if (current.trim()) rows.push(current)
    return rows
}

function splitLatexCells(row: string) {
    const cells: string[] = []
    let current = ''
    let depth = 0

    for (let i = 0; i < row.length; i++) {
        const char = row[i]
        const previous = row[i - 1]

        if (char === '{' && previous !== '\\') depth++
        if (char === '}' && previous !== '\\' && depth > 0) depth--

        if (char === '&' && previous !== '\\' && depth === 0) {
            cells.push(current)
            current = ''
            continue
        }

        current += char
    }

    cells.push(current)
    return cells
}

function cleanLatexCell(cell: string) {
    return latexToPlainText(cell
        .replace(/\\multicolumn\s*\{[^}]*\}\s*\{[^}]*\}\s*\{([^}]*)\}/g, '$1')
        .replace(/\\multirow\s*\{[^}]*\}\s*\{[^}]*\}\s*\{([^}]*)\}/g, '$1')
        .replace(/\\(?:hline|toprule|midrule|bottomrule)\b/g, '')
        .trim())
}

function padRow(row: string[], columnCount: number) {
    return Array.from({ length: columnCount }, (_, index) => row[index] || '')
}

function looksLikeHeader(firstRow: string[], remainingRows: string[][]) {
    if (firstRow.length === 0 || remainingRows.length === 0) return false
    const nonEmptyHeaders = firstRow.filter(cell => cell.trim() !== '')
    if (nonEmptyHeaders.length === 0) return false

    const alphaHeaders = nonEmptyHeaders.filter(cell => /[A-Za-z_\s]/.test(cell) && !isNumericLike(cell))
    if (alphaHeaders.length >= Math.ceil(nonEmptyHeaders.length / 2)) return true

    return remainingRows.some(row => row.some((cell, index) => isNumericLike(cell) && !isNumericLike(firstRow[index] || '')))
}

function isNumericLike(value: string) {
    return /^[-+]?\d+(?:[.,]\d+)?%?$/.test(value.trim())
}

function normalizeHeaders(headers: string[]) {
    const seen = new Map<string, number>()

    return headers.map((header, index) => {
        const base = header.trim() || `Column ${index + 1}`
        const count = seen.get(base) || 0
        seen.set(base, count + 1)
        return count === 0 ? base : `${base} ${count + 1}`
    })
}

function rowToRecord(headers: string[]) {
    return (row: string[]) => headers.reduce<TableRecord>((record, header, index) => {
        record[header] = row[index] || ''
        return record
    }, {})
}

function latexToPlainText(source: string) {
    let text = replaceLatexAccents(source)
    text = text
        .replace(/\\(?:section|chapter)\*?\s*\{([^}]*)\}/g, '\n\n$1\n')
        .replace(/\\subsection\*?\s*\{([^}]*)\}/g, '\n\n$1\n')
        .replace(/\\subsubsection\*?\s*\{([^}]*)\}/g, '\n\n$1\n')
        .replace(/\\title\s*\{([^}]*)\}/g, '\n$1\n')
        .replace(/\\author\s*\{([^}]*)\}/g, '\n$1\n')
        .replace(/\\date\s*\{([^}]*)\}/g, '\n$1\n')
        .replace(/\\href\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '$2 ($1)')
        .replace(/\\url\s*\{([^}]*)\}/g, '$1')
        .replace(/\\includegraphics(?:\[[^\]]*\])?\s*\{([^}]*)\}/g, '[image: $1]')
        .replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '($1)/($2)')
        .replace(/\\sqrt\s*\{([^}]*)\}/g, 'sqrt($1)')
        .replace(/\\begin\s*\{(?:itemize|enumerate|description)\}/g, '\n')
        .replace(/\\end\s*\{(?:itemize|enumerate|description)\}/g, '\n')
        .replace(/\\item(?:\[[^\]]*\])?/g, '\n- ')
        .replace(/\\\(|\\\)|\\\[|\\\]|\$\$/g, '')
        .replace(/\$/g, '')

    text = unwrapKnownTextCommands(text)
    text = text
        .replace(/\\(?:begin|end)\s*\{[^}]*\}/g, '\n')
        .replace(/\\(?:cite|ref|label)\s*\{([^}]*)\}/g, '$1')
        .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{([^{}]*)\})?/g, '$1')
        .replace(/\\([&%$#_{}])/g, '$1')
        .replace(/[{}]/g, '')
        .replace(/~+/g, ' ')
        .replace(/\\,/g, ' ')

    return normalizeWhitespace(text)
}

function latexToMarkdown(source: string) {
    let markdown = replaceLatexAccents(source)
    markdown = markdown
        .replace(/\\(?:chapter|section)\*?\s*\{([^}]*)\}/g, '\n# $1\n')
        .replace(/\\subsection\*?\s*\{([^}]*)\}/g, '\n## $1\n')
        .replace(/\\subsubsection\*?\s*\{([^}]*)\}/g, '\n### $1\n')
        .replace(/\\textbf\s*\{([^}]*)\}/g, '**$1**')
        .replace(/\\(?:textit|emph)\s*\{([^}]*)\}/g, '*$1*')
        .replace(/\\texttt\s*\{([^}]*)\}/g, '`$1`')
        .replace(/\\href\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '[$2]($1)')
        .replace(/\\url\s*\{([^}]*)\}/g, '<$1>')
        .replace(/\\includegraphics(?:\[[^\]]*\])?\s*\{([^}]*)\}/g, '![image]($1)')
        .replace(/\\begin\s*\{(?:itemize|enumerate|description)\}/g, '\n')
        .replace(/\\end\s*\{(?:itemize|enumerate|description)\}/g, '\n')
        .replace(/\\item(?:\[[^\]]*\])?/g, '\n- ')
        .replace(/\\\(|\\\)|\\\[|\\\]|\$\$/g, '`')
        .replace(/\$/g, '`')

    markdown = unwrapKnownTextCommands(markdown)
        .replace(/\\(?:begin|end)\s*\{[^}]*\}/g, '\n')
        .replace(/\\(?:cite|ref|label)\s*\{([^}]*)\}/g, '$1')
        .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{([^{}]*)\})?/g, '$1')
        .replace(/\\([&%$#_{}])/g, '$1')
        .replace(/[{}]/g, '')
        .replace(/~+/g, ' ')

    return normalizeMarkdown(markdown)
}

function unwrapKnownTextCommands(text: string) {
    let current = text
    let previous = ''

    while (current !== previous) {
        previous = current
        current = current.replace(/\\([a-zA-Z]+)\*?(?:\[[^\]]*\])?\s*\{([^{}]*)\}/g, (match, command: string, value: string) => {
            return TEXT_COMMANDS.has(command) ? value : match
        })
    }

    return current
}

function replaceLatexAccents(source: string) {
    const accentMap: Record<string, string> = {
        '\\`a': 'à', "\\'a": 'á', '\\^a': 'â', '\\"a': 'ä', '\\~a': 'ã', '\\c{c}': 'ç',
        '\\`e': 'è', "\\'e": 'é', '\\^e': 'ê', '\\"e': 'ë',
        '\\`i': 'ì', "\\'i": 'í', '\\^i': 'î', '\\"i': 'ï',
        '\\`o': 'ò', "\\'o": 'ó', '\\^o': 'ô', '\\"o': 'ö', '\\~o': 'õ',
        '\\`u': 'ù', "\\'u": 'ú', '\\^u': 'û', '\\"u': 'ü',
        '\\`A': 'À', "\\'A": 'Á', '\\^A': 'Â', '\\"A': 'Ä', '\\~A': 'Ã', '\\c{C}': 'Ç',
        '\\`E': 'È', "\\'E": 'É', '\\^E': 'Ê', '\\"E': 'Ë',
        '\\`I': 'Ì', "\\'I": 'Í', '\\^I': 'Î', '\\"I': 'Ï',
        '\\`O': 'Ò', "\\'O": 'Ó', '\\^O': 'Ô', '\\"O': 'Ö', '\\~O': 'Õ',
        '\\`U': 'Ù', "\\'U": 'Ú', '\\^U': 'Û', '\\"U': 'Ü',
    }

    return Object.entries(accentMap).reduce((result, [latex, value]) => (
        result.replaceAll(latex, value)
    ), source)
}

function normalizeWhitespace(text: string) {
    return text
        .split('\n')
        .map(line => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function normalizeMarkdown(markdown: string) {
    return markdown
        .split('\n')
        .map(line => line.replace(/[ \t]+$/g, ''))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function formatLatex(content: string) {
    const normalized = stripLatexComments(normalizeLineEndings(content))
    let indent = 0

    return normalized.split('\n').map(line => {
        const trimmed = line.trim()
        if (!trimmed) return ''
        if (/^\\end\{/.test(trimmed)) indent = Math.max(0, indent - 1)
        const formatted = `${'  '.repeat(indent)}${trimmed}`
        if (/^\\begin\{/.test(trimmed) && !/^\\begin\{(?:document|center)\}/.test(trimmed)) indent++
        return formatted
    }).join('\n').trim()
}

function tableToMarkdown(table: LatexTable) {
    const header = `| ${table.headers.map(escapeMarkdownCell).join(' | ')} |`
    const separator = `| ${table.headers.map(() => '---').join(' | ')} |`
    const rows = table.rows.map(row => `| ${row.map(escapeMarkdownCell).join(' | ')} |`).join('\n')
    return [header, separator, rows].filter(Boolean).join('\n')
}

function markdownToHtml(markdown: string) {
    const lines = markdown.split('\n')
    const html: string[] = []
    let listOpen = false

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index]
        const trimmed = line.trim()
        if (!trimmed) {
            if (listOpen) {
                html.push('</ul>')
                listOpen = false
            }
            continue
        }

        if (isMarkdownTableStart(lines, index)) {
            if (listOpen) {
                html.push('</ul>')
                listOpen = false
            }

            const table = readMarkdownTable(lines, index)
            html.push(markdownTableToHtml(table.headers, table.rows))
            index = table.nextIndex - 1
        } else if (trimmed.startsWith('### ')) html.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`)
        else if (trimmed.startsWith('## ')) html.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`)
        else if (trimmed.startsWith('# ')) html.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`)
        else if (trimmed.startsWith('- ')) {
            if (!listOpen) {
                html.push('<ul>')
                listOpen = true
            }
            html.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`)
        } else {
            if (listOpen) {
                html.push('</ul>')
                listOpen = false
            }
            html.push(`<p>${escapeHtml(trimmed)}</p>`)
        }
    }

    if (listOpen) html.push('</ul>')
    return html.join('\n')
}

function isMarkdownTableStart(lines: string[], index: number) {
    return lines[index]?.trim().startsWith('|') && isMarkdownTableSeparator(lines[index + 1] || '')
}

function isMarkdownTableSeparator(line: string) {
    const cells = parseMarkdownTableRow(line)
    return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell.trim()))
}

function readMarkdownTable(lines: string[], startIndex: number) {
    const headers = parseMarkdownTableRow(lines[startIndex])
    const rows: string[][] = []
    let index = startIndex + 2

    while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(parseMarkdownTableRow(lines[index]))
        index++
    }

    return { headers, rows, nextIndex: index }
}

function parseMarkdownTableRow(line: string) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim().replace(/\\\|/g, '|'))
}

function markdownTableToHtml(headers: string[], rows: string[][]) {
    const head = headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')
    const body = rows.map(row => `<tr>${headers.map((_, index) => `<td>${escapeHtml(row[index] || '')}</td>`).join('')}</tr>`).join('')

    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function recordsToXml(records: TableRecord[]) {
    const rows = records.map(record => {
        const entries = Object.entries(record).map(([key, value]) => (
            `    <${sanitizeXmlName(key)}>${escapeXml(String(value ?? ''))}</${sanitizeXmlName(key)}>`
        )).join('\n')
        return `  <row>\n${entries}\n  </row>`
    }).join('\n')

    return `<root>\n${rows}\n</root>`
}

function documentToXml(document: LatexDocument) {
    return `<document>\n  <content>${escapeXml(document.plainText)}</content>\n</document>`
}

function recordsToYaml(records: TableRecord[]) {
    return records.map(record => {
        const values = Object.entries(record).map(([key, value]) => `  ${safeYamlKey(key)}: ${quoteYaml(value)}`).join('\n')
        return `-\n${values}`
    }).join('\n')
}

function documentToYaml(document: LatexDocument) {
    return `content: ${quoteYaml(document.plainText)}\n`
}

function recordsToToml(records: TableRecord[]) {
    return records.map(record => {
        const values = Object.entries(record).map(([key, value]) => `${safeTomlKey(key)} = ${quoteToml(String(value ?? ''))}`).join('\n')
        return `[[rows]]\n${values}`
    }).join('\n\n')
}

function recordsToIni(records: TableRecord[]) {
    return records.map((record, index) => {
        const values = Object.entries(record).map(([key, value]) => `${safeIniKey(key)}=${quoteIni(String(value ?? ''))}`).join('\n')
        return `[row.${index + 1}]\n${values}`
    }).join('\n\n')
}

function tableToSql(table: LatexTable, sourceName: string) {
    if (table.records.length === 0) return '-- No table rows found'
    const tableName = quoteSqlIdentifier(sourceName || 'latex_table')
    const columns = table.headers.map(quoteSqlIdentifier)
    const values = table.rows.map(row => `(${row.map(quoteSqlValue).join(', ')})`).join(',\n')

    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values};`
}

function tableToAsciiDoc(table: LatexTable) {
    return [
        '[cols="' + table.headers.map(() => '1').join(',') + '", options="header"]',
        '|===',
        `| ${table.headers.join(' | ')}`,
        ...table.rows.map(row => `| ${row.join(' | ')}`),
        '|===',
    ].join('\n')
}

function markdownToAsciiDoc(markdown: string) {
    return markdown
        .replace(/^### (.*)$/gm, '==== $1')
        .replace(/^## (.*)$/gm, '=== $1')
        .replace(/^# (.*)$/gm, '== $1')
}

function tableToRst(table: LatexTable) {
    const rows = [table.headers, ...table.rows]
    const widths = table.headers.map((_, index) => Math.max(...rows.map(row => (row[index] || '').length), 3))
    const separator = `+${widths.map(width => '-'.repeat(width + 2)).join('+')}+`
    const formatRow = (row: string[]) => `|${row.map((cell, index) => ` ${(cell || '').padEnd(widths[index])} `).join('|')}|`

    return [separator, formatRow(table.headers), separator, ...table.rows.map(formatRow), separator].join('\n')
}

function markdownToRst(markdown: string) {
    return markdown.replace(/^# (.*)$/gm, (_match, title: string) => `${title}\n${'='.repeat(title.length)}`)
}

function tableToMediaWiki(table: LatexTable) {
    const header = `! ${table.headers.join(' !! ')}`
    const rows = table.rows.map(row => `|-\n| ${row.join(' || ')}`).join('\n')
    return `{| class="wikitable"\n${header}\n|-\n${rows}\n|}`
}

function markdownToMediaWiki(markdown: string) {
    return markdown
        .replace(/^### (.*)$/gm, '=== $1 ===')
        .replace(/^## (.*)$/gm, '== $1 ==')
        .replace(/^# (.*)$/gm, '= $1 =')
        .replace(/^- /gm, '* ')
}

function tableToJira(table: LatexTable) {
    return [`|| ${table.headers.join(' || ')} ||`, ...table.rows.map(row => `| ${row.join(' | ')} |`)].join('\n')
}

function tableToTextile(table: LatexTable) {
    return [`|_. ${table.headers.join(' |_. ')} |`, ...table.rows.map(row => `| ${row.join(' | ')} |`)].join('\n')
}

function markdownToTextile(markdown: string) {
    return markdown.replace(/^# (.*)$/gm, 'h1. $1').replace(/^## (.*)$/gm, 'h2. $1')
}

function tableToTracWiki(table: LatexTable) {
    return [`||= ${table.headers.join(' =||= ')} =||`, ...table.rows.map(row => `|| ${row.join(' || ')} ||`)].join('\n')
}

function tableToBBCode(table: LatexTable) {
    const header = `[tr]${table.headers.map(header => `[th]${escapeBBCode(header)}[/th]`).join('')}[/tr]`
    const rows = table.rows.map(row => `[tr]${row.map(cell => `[td]${escapeBBCode(cell)}[/td]`).join('')}[/tr]`).join('\n')
    return `[table]\n${header}\n${rows}\n[/table]`
}

function markdownToBBCode(markdown: string) {
    return markdown
        .replace(/\*\*([^*]+)\*\*/g, '[b]$1[/b]')
        .replace(/\*([^*]+)\*/g, '[i]$1[/i]')
        .replace(/^# (.*)$/gm, '[b]$1[/b]')
}

function tableToPandas(table: LatexTable) {
    return `import pandas as pd\n\ndata = ${jsonForCode(table.records)}\ndf = pd.DataFrame(data)\nprint(df)`
}

function tableToRDataFrame(table: LatexTable) {
    const columns = table.headers.map((header, index) => {
        const values = table.rows.map(row => quoteR(row[index] || '')).join(', ')
        return `  ${safeRName(header)} = c(${values})`
    }).join(',\n')

    return `df <- data.frame(\n${columns},\n  stringsAsFactors = FALSE\n)`
}

function tableToMatlab(table: LatexTable) {
    const rows = table.rows.map(row => `    ${row.map(quoteMatlab).join(', ')}`).join(';\n')
    const headers = table.headers.map(quoteMatlab).join(', ')
    return `headers = {${headers}};\ndata = {\n${rows}\n};\nT = cell2table(data, 'VariableNames', matlab.lang.makeValidName(headers));`
}

function tableToAvroSchema(table: LatexTable, sourceName: string) {
    return {
        type: 'record',
        name: toPascalCase(sourceName || 'LatexRow'),
        fields: table.headers.map(header => ({
            name: safeCodeName(header),
            type: ['null', 'string'],
            default: null,
        })),
    }
}

function documentAvroSchema(sourceName: string) {
    return {
        type: 'record',
        name: toPascalCase(sourceName || 'LatexDocument'),
        fields: [{ name: 'content', type: 'string' }],
    }
}

function tableToProtobuf(table: LatexTable) {
    const fields = table.headers.map((header, index) => `  string ${safeCodeName(header)} = ${index + 1};`).join('\n')
    return `syntax = "proto3";\n\nmessage LatexRow {\n${fields}\n}\n\nmessage LatexRows {\n  repeated LatexRow rows = 1;\n}`
}

function documentToProtobuf() {
    return 'syntax = "proto3";\n\nmessage LatexDocument {\n  string content = 1;\n}'
}

function tableToRdf(table: LatexTable) {
    return table.records.map((record, rowIndex) => {
        const subject = `_:row${rowIndex + 1}`
        return Object.entries(record).map(([key, value]) => `${subject} <#${safeCodeName(key)}> ${quoteRdfLiteral(String(value ?? ''))} .`).join('\n')
    }).join('\n')
}

function documentToRdf(document: LatexDocument) {
    return `_:document <#content> ${quoteRdfLiteral(document.plainText)} .`
}

function tableToQlik(table: LatexTable, sourceName: string) {
    const rows = table.rows.map(row => row.map(escapeQlik).join(',')).join('\n')
    return `${safeCodeName(sourceName || 'LatexTable')}:\nLOAD * INLINE [\n${table.headers.map(escapeQlik).join(',')}\n${rows}\n];`
}

function tableToDax(table: LatexTable, sourceName: string) {
    const columns = table.headers.map(header => `${quoteDax(header)}, STRING`).join(', ')
    const rows = table.rows.map(row => `{ ${row.map(quoteDax).join(', ')} }`).join(',\n        ')
    return `${safeCodeName(sourceName || 'LatexTable')} =\n    DATATABLE(\n        ${columns},\n        {\n        ${rows}\n        }\n    )`
}

function createSummary(document: LatexDocument) {
    if (!document.table) {
        return document.plainText
    }

    return [
        `LaTeX table detected: ${document.table.rows.length} rows, ${document.table.headers.length} columns`,
        '',
        tableToMarkdown(document.table),
    ].join('\n')
}

function documentToJson(document: LatexDocument) {
    return {
        content: document.plainText,
        markdown: document.markdown,
    }
}

function escapeMarkdownCell(value: string) {
    return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}

function escapeHtml(value: unknown) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function escapeXml(value: string) {
    return escapeHtml(value)
}

function escapeBBCode(value: string) {
    return value.replace(/\[/g, '&#91;').replace(/]/g, '&#93;')
}

function quoteSqlIdentifier(value: string) {
    return `"${sanitizeBaseName(value).replace(/"/g, '""')}"`
}

function quoteSqlValue(value: unknown) {
    const text = String(value ?? '').trim()
    if (text === '') return "''"
    if (/^[-+]?\d+(?:\.\d+)?$/.test(text)) return text
    return `'${text.replace(/'/g, "''")}'`
}

function sanitizeBaseName(value: string) {
    const base = value.replace(/\.[^.]+$/, '').trim() || 'latex_data'
    return base.replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'latex_data'
}

function sanitizeXmlName(value: string) {
    const name = safeCodeName(value).replace(/_/g, '-')
    return /^[A-Za-z]/.test(name) ? name : `field-${name}`
}

function safeCodeName(value: string) {
    const name = value.trim().replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase()
    return /^[A-Za-z_]/.test(name) ? name : `field_${name || 'value'}`
}

function safeRName(value: string) {
    const name = safeCodeName(value).replace(/^field_/, '')
    return /^[A-Za-z.]/.test(name) ? name : `x_${name}`
}

function safeYamlKey(value: string) {
    return /^[A-Za-z0-9_-]+$/.test(value) ? value : JSON.stringify(value)
}

function safeTomlKey(value: string) {
    return /^[A-Za-z0-9_-]+$/.test(value) ? value : JSON.stringify(value)
}

function safeIniKey(value: string) {
    return value.replace(/[=\n\r]/g, '_') || 'value'
}

function quoteYaml(value: unknown) {
    const text = String(value ?? '')
    if (!text) return '""'
    if (/^[A-Za-z0-9_. -]+$/.test(text) && !/^(true|false|null|[-+]?\d)/i.test(text)) return text
    return JSON.stringify(text)
}

function quoteToml(value: string) {
    return JSON.stringify(value)
}

function quoteIni(value: string) {
    return value.replace(/\n/g, '\\n')
}

function quotePython(value: string) {
    return JSON.stringify(value)
}

function quoteR(value: string) {
    return JSON.stringify(value)
}

function quoteMatlab(value: string) {
    return `'${value.replace(/'/g, "''")}'`
}

function quotePhp(value: string) {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function quoteRuby(value: string) {
    return JSON.stringify(value)
}

function quoteActionScript(value: string) {
    return JSON.stringify(value)
}

function quoteVBScript(value: string) {
    return `"${value.replace(/"/g, '""').replace(/\n/g, '" & vbCrLf & "')}"`
}

function quoteDax(value: string) {
    return `"${value.replace(/"/g, '""')}"`
}

function quoteRdfLiteral(value: string) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
}

function escapeQlik(value: string) {
    return value.replace(/[\n\r,]/g, ' ')
}

function phpValue(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(phpValue).join(', ')}]`
    if (value && typeof value === 'object') {
        return `[${Object.entries(value as Record<string, unknown>).map(([key, item]) => `${quotePhp(key)} => ${phpValue(item)}`).join(', ')}]`
    }
    return quotePhp(String(value ?? ''))
}

function rubyValue(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(rubyValue).join(', ')}]`
    if (value && typeof value === 'object') {
        return `{ ${Object.entries(value as Record<string, unknown>).map(([key, item]) => `${quoteRuby(key)} => ${rubyValue(item)}`).join(', ')} }`
    }
    return quoteRuby(String(value ?? ''))
}

function jsonForCode(value: unknown) {
    return JSON.stringify(value, null, 2)
}

function prefixLines(value: string, prefix: string) {
    return value.split('\n').map(line => `${prefix}${line}`).join('\n')
}

function toPascalCase(value: string) {
    const pascal = value
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('')
    return /^[A-Za-z]/.test(pascal) ? pascal : `Latex${pascal || 'Data'}`
}

function toAscii(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x00-\x7F]/g, '')
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
