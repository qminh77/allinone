'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface CopyFlashcardTokenMenuItemProps {
    setId: string
    shareToken?: string | null
}

export function CopyFlashcardTokenMenuItem({ setId, shareToken }: CopyFlashcardTokenMenuItemProps) {
    function handleCopy() {
        const code = shareToken || setId
        navigator.clipboard.writeText(code)
        toast.success('Đã copy mã Token!')
    }

    return (
        <DropdownMenuItem
            onClick={(event) => {
                event.preventDefault()
                handleCopy()
            }}
        >
            <Share2 className="mr-2 size-4" />
            Copy Mã Token
        </DropdownMenuItem>
    )
}
