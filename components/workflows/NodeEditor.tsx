'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { getWorkflowNodeDefinition, validateWorkflowNodeData } from '@/lib/workflows/registry'
import type { WorkflowCanvasNode, WorkflowNodeType } from '@/types/workflow'
import { useWorkflowStore } from '@/components/workflows/store/useWorkflowStore'

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'switch'

interface FieldDefinition {
    key: string
    label: string
    type: FieldType
    placeholder?: string
    options?: { label: string; value: string }[]
}

const fieldsByNodeType: Record<WorkflowNodeType, FieldDefinition[]> = {
    trigger: [
        { key: 'mode', label: 'Mode', type: 'select', options: ['manual', 'schedule', 'webhook'].map(value => ({ label: value, value })) },
        { key: 'samplePayload', label: 'Sample payload JSON', type: 'textarea', placeholder: '{"text":"hello"}' },
    ],
    httpRequest: [
        { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(value => ({ label: value, value })) },
        { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/{{input.id}}' },
        { key: 'headers', label: 'Headers JSON', type: 'textarea', placeholder: '{"Authorization":"Bearer ..."}' },
        { key: 'body', label: 'Body', type: 'textarea', placeholder: '{"message":"{{input.text}}"}' },
        { key: 'timeoutMs', label: 'Timeout (ms)', type: 'number' },
        { key: 'failOnError', label: 'Fail on non-2xx', type: 'switch' },
    ],
    aiAgent: [
        { key: 'system', label: 'System prompt', type: 'textarea' },
        { key: 'prompt', label: 'User prompt', type: 'textarea', placeholder: 'Summarize: {{input.text}}' },
        { key: 'modelDbId', label: 'AI model DB ID (optional)', type: 'text' },
        { key: 'temperature', label: 'Temperature', type: 'number' },
        { key: 'maxTokens', label: 'Max tokens', type: 'number' },
        { key: 'outputKey', label: 'Output key', type: 'text' },
    ],
    condition: [
        { key: 'left', label: 'Left value/template', type: 'text', placeholder: '{{input.status}}' },
        { key: 'operator', label: 'Operator', type: 'select', options: ['equals', 'notEquals', 'contains', 'exists', 'greaterThan', 'lessThan'].map(value => ({ label: value, value })) },
        { key: 'right', label: 'Right value/template', type: 'text', placeholder: 'approved' },
    ],
    loop: [
        { key: 'itemsPath', label: 'Items path', type: 'text', placeholder: 'input.items' },
        { key: 'maxIterations', label: 'Max iterations', type: 'number' },
    ],
    flashcardGenerator: [
        { key: 'topic', label: 'Topic', type: 'textarea' },
        { key: 'count', label: 'Count', type: 'number' },
        { key: 'language', label: 'Language', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
        { key: 'setId', label: 'Flashcard set ID (optional)', type: 'text' },
        { key: 'modelDbId', label: 'AI model DB ID (optional)', type: 'text' },
    ],
    qrGenerator: [
        { key: 'type', label: 'QR type', type: 'select', options: ['url', 'text', 'email', 'phone', 'sms', 'wifi', 'vcard', 'location', 'event', 'social', 'crypto', 'file', 'app'].map(value => ({ label: value, value })) },
        { key: 'content', label: 'Content', type: 'textarea' },
        { key: 'foreground', label: 'Foreground', type: 'text', placeholder: '#111827' },
        { key: 'background', label: 'Background', type: 'text', placeholder: '#ffffff' },
        { key: 'size', label: 'Size', type: 'number' },
    ],
    supabaseQuery: [
        { key: 'table', label: 'Table', type: 'text', placeholder: 'flashcard_sets' },
        { key: 'operation', label: 'Operation', type: 'select', options: ['select', 'insert', 'update', 'delete'].map(value => ({ label: value, value })) },
        { key: 'columns', label: 'Columns', type: 'text', placeholder: '*' },
        { key: 'filters', label: 'Filters JSON', type: 'textarea', placeholder: '{"id":"{{input.id}}"}' },
        { key: 'payload', label: 'Payload JSON', type: 'textarea', placeholder: '{"title":"New"}' },
        { key: 'limit', label: 'Limit', type: 'number' },
    ],
}

function FieldEditor({ node, field }: { node: WorkflowCanvasNode; field: FieldDefinition }) {
    const updateNodeConfig = useWorkflowStore(state => state.updateNodeConfig)
    const value = node.data.config[field.key]
    const id = `${node.id}-${field.key}`

    if (field.type === 'select') {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Select value={String(value ?? '')} onValueChange={(nextValue) => updateNodeConfig(node.id, field.key, nextValue)}>
                    <SelectTrigger id={id} className="bg-background">
                        <SelectValue placeholder={field.placeholder || field.label} />
                    </SelectTrigger>
                    <SelectContent>
                        {(field.options || []).map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )
    }

    if (field.type === 'switch') {
        return (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                <Label htmlFor={id}>{field.label}</Label>
                <Switch id={id} checked={Boolean(value)} onCheckedChange={(checked) => updateNodeConfig(node.id, field.key, checked)} />
            </div>
        )
    }

    if (field.type === 'textarea') {
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Textarea
                    id={id}
                    value={String(value ?? '')}
                    onChange={(event) => updateNodeConfig(node.id, field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-24 bg-background font-mono text-xs"
                />
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{field.label}</Label>
            <Input
                id={id}
                type={field.type === 'number' ? 'number' : 'text'}
                value={String(value ?? '')}
                onChange={(event) => updateNodeConfig(node.id, field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)}
                placeholder={field.placeholder}
                className="bg-background"
            />
        </div>
    )
}

export function NodeEditor() {
    const selectedNodeId = useWorkflowStore(state => state.selectedNodeId)
    const nodes = useWorkflowStore(state => state.nodes)
    const updateNodeData = useWorkflowStore(state => state.updateNodeData)
    const deleteNode = useWorkflowStore(state => state.deleteNode)
    const node = nodes.find(item => item.id === selectedNodeId)

    if (!node) {
        return (
            <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                Chọn một node trên canvas để chỉnh cấu hình. Dùng template như <code className="rounded bg-muted px-1">{'{{input.text}}'}</code> hoặc <code className="rounded bg-muted px-1">{'{{nodes.nodeId.text}}'}</code>.
            </div>
        )
    }

    const definition = getWorkflowNodeDefinition(node.data.nodeType)
    const validation = validateWorkflowNodeData(node.data)

    return (
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card">
            <div className="space-y-3 border-b p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Node Editor</p>
                        <h2 className="text-base font-semibold">{definition.label}</h2>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => deleteNode(node.id)}>
                        <Trash2 className="size-4" />
                        <span className="sr-only">Xóa node</span>
                    </Button>
                </div>
                {!validation.success && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                        {validation.error.issues[0].message}
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                    <div className="space-y-2">
                        <Label htmlFor="node-label">Label</Label>
                        <Input
                            id="node-label"
                            value={node.data.label}
                            onChange={(event) => updateNodeData(node.id, { label: event.target.value })}
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="node-description">Description</Label>
                        <Textarea
                            id="node-description"
                            value={node.data.description || ''}
                            onChange={(event) => updateNodeData(node.id, { description: event.target.value })}
                            className="min-h-20 bg-background"
                        />
                    </div>

                    <Separator />

                    {fieldsByNodeType[node.data.nodeType].map(field => (
                        <FieldEditor key={field.key} node={node} field={field} />
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
