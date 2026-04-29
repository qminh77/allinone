'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const AiAssistantChat = dynamic(
    () => import('@/components/ai/AiAssistantChat').then(module => module.AiAssistantChat),
    {
        ssr: false,
        loading: () => (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Đang tải trợ lý AI...
            </div>
        ),
    }
)

export function AiAssistantDock() {
    const [open, setOpen] = useState(false)

    return (
        <TooltipProvider delayDuration={100}>
            <Sheet open={open} onOpenChange={setOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            size="icon-lg"
                            className="fixed bottom-5 right-5 z-40 size-12 rounded-full shadow-lg"
                            onClick={() => setOpen(true)}
                        >
                            <Sparkles className="size-5" />
                            <span className="sr-only">Open AI assistant</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">AI Assistant</TooltipContent>
                </Tooltip>

                <SheetContent side="right" className="w-[min(100vw,520px)] gap-0 p-0 sm:max-w-none">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Allinone AI Assistant</SheetTitle>
                        <SheetDescription>Chat với trợ lý AI trong dashboard.</SheetDescription>
                    </SheetHeader>
                    <div className="flex h-full min-h-0 flex-col">
                        {open && <AiAssistantChat variant="sheet" />}
                    </div>
                </SheetContent>
            </Sheet>
        </TooltipProvider>
    )
}
