'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Copy, Trash2, Type, AlignLeft, FileText, Pilcrow, Hash } from 'lucide-react'
import { toast } from 'sonner'

export function CharacterCounter() {
    const [text, setText] = useState('')

    const stats = useMemo(() => {
        if (!text) return { chars: 0, charsNoSpace: 0, words: 0, sentences: 0, lines: 0, paragraphs: 0 }

        return {
            chars: text.length,
            charsNoSpace: text.replace(/\s/g, '').length,
            words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
            lines: text.split(/\r\n|\r|\n/).length,
            sentences: text.split(/[.?!]+/).filter(s => s.trim().length > 0).length,
            paragraphs: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
        }
    }, [text])

    const handleCopy = () => {
        if (!text) return
        navigator.clipboard.writeText(text)
        toast.success('Đã sao chép văn bản!')
    }

    const handleClear = () => {
        setText('')
        toast.info('Đã xóa văn bản')
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Character Counter</CardTitle>
                    <CardDescription>Công cụ đếm ký tự, từ, câu và đoạn văn online.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="Nhập hoặc dán văn bản của bạn vào đây..."
                        className="min-h-[200px] text-base"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={handleClear} disabled={!text}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                        </Button>
                        <Button variant="default" size="sm" onClick={handleCopy} disabled={!text}>
                            <Copy className="h-4 w-4 mr-2" />
                            Sao chép
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={Type} label="Characters" value={stats.chars} subLabel="(With Spaces)" />
                <StatCard icon={Hash} label="Characters" value={stats.charsNoSpace} subLabel="(No Spaces)" />
                <StatCard icon={FileText} label="Words" value={stats.words} />
                <StatCard icon={AlignLeft} label="Sentences" value={stats.sentences} />
                <StatCard icon={AlignLeft} label="Lines" value={stats.lines} />
                <StatCard icon={Pilcrow} label="Paragraphs" value={stats.paragraphs} />
            </div>
        </div>
    )
}

function StatCard({ icon: Icon, label, value, subLabel }: { icon: any, label: string, value: number, subLabel?: string }) {
    return (
        <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold">{value.toLocaleString()}</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase">{label}</p>
                    {subLabel && <p className="text-[10px] text-muted-foreground">{subLabel}</p>}
                </div>
            </CardContent>
        </Card>
    )
}
