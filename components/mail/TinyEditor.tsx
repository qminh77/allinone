'use client'

import { Editor } from '@tinymce/tinymce-react';

interface TinyEditorProps {
    value: string
    onChange: (value: string) => void
}

export default function TinyEditor({ value, onChange }: TinyEditorProps) {
    return (
        <div className="border rounded-md overflow-hidden">
            <Editor
                apiKey='no-api-key' // Uses open source version/nagware
                value={value}
                onEditorChange={(content) => onChange(content)}
                init={{
                    height: 400,
                    menubar: false,
                    plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                    content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }',
                    branding: false,
                    promotion: false
                }}
            />
        </div>
    )
}
