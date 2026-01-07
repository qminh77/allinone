'use client'

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Share2 } from "lucide-react"
import { toast } from "sonner"

interface CopyLinkMenuItemProps {
    quizId: string
    shareToken?: string
}

export function CopyLinkMenuItem({ quizId, shareToken }: CopyLinkMenuItemProps) {
    const handleCopy = () => {
        // Prefer shareToken if available, else use ID (but ID works best for public)
        // Actually public quizzes use Token logic in public page too if token exists? 
        // Our public page logic: 
        // 1. Try token
        // 2. Try ID (if public)

        // User requested to copy ONLY the token, not the full URL.
        const code = shareToken || quizId

        navigator.clipboard.writeText(code)
        toast.success("Đã copy mã Token!")
    }

    return (
        <DropdownMenuItem onClick={(e) => {
            e.preventDefault()
            handleCopy()
        }}>
            <Share2 className="mr-2 h-4 w-4" />
            Copy Mã Token
        </DropdownMenuItem>
    )
}
