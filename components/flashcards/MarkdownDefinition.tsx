import { cn } from '@/lib/utils'
import type React from 'react'

interface MarkdownDefinitionProps {
    value: string
    className?: string
}

function renderInline(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>
        }

        if (part.startsWith('`') && part.endsWith('`')) {
            return (
                <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
                    {part.slice(1, -1)}
                </code>
            )
        }

        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.slice(1, -1)}</em>
        }

        return <span key={index}>{part}</span>
    })
}

export function MarkdownDefinition({ value, className }: MarkdownDefinitionProps) {
    const lines = value.split(/\r?\n/)
    const blocks: React.ReactNode[] = []
    let listItems: string[] = []

    const flushList = () => {
        if (listItems.length === 0) return
        blocks.push(
            <ul key={`list-${blocks.length}`} className="ml-5 list-disc space-y-1">
                {listItems.map((item, index) => (
                    <li key={index}>{renderInline(item)}</li>
                ))}
            </ul>
        )
        listItems = []
    }

    lines.forEach((line, index) => {
        const bullet = line.match(/^\s*[-*]\s+(.+)$/)
        if (bullet) {
            listItems.push(bullet[1])
            return
        }

        flushList()

        if (!line.trim()) {
            blocks.push(<div key={`br-${index}`} className="h-2" />)
            return
        }

        blocks.push(
            <p key={`p-${index}`} className="leading-relaxed">
                {renderInline(line)}
            </p>
        )
    })

    flushList()

    return <div className={cn('space-y-2 whitespace-pre-wrap break-words', className)}>{blocks}</div>
}
