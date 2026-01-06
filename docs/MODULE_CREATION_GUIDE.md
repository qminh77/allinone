# Hướng dẫn Tạo Module Mới

Tài liệu này hướng dẫn chi tiết quy trình thêm một công cụ (module) mới vào hệ thống, đảm bảo tuân thủ kiến trúc Modules V2.

## Quy trình tóm tắt
1.  **Khai báo Config**: Thêm thông tin module vào `config/modules.ts`.
2.  **Server Actions (Logic)**: Viết logic xử lý tại `lib/actions/`.
3.  **Client Component (UI)**: Tạo giao diện tại `components/tools/`.
4.  **Page Wrapper**: Tạo trang tại `app/tools/[slug]/page.tsx`.

---

## Chi tiết từng bước

### Bước 1: Khai báo Module Config
Mở file `config/modules.ts` và thêm object module mới vào mảng `modules`.

```typescript
// config/modules.ts
import { YourIcon } from 'lucide-react'

export const modules: Module[] = [
    // ... các module cũ
    {
        key: 'your-tool-key',         // ID duy nhất (dùng cho database settings)
        name: 'Tên Công Cụ',          // Hiển thị trên UI
        description: 'Mô tả ngắn gọn chức năng.',
        href: '/tools/your-tool-slug', // Đường dẫn routing
        icon: YourIcon,               // Icon từ lucide-react
        category: 'Utilities',        // Danh mục (Utilities, Network, DevTools, Media...)
        isNew: true                   // (Optional) Hiện badge NEW
    }
]
```

### Bước 2: Tạo Server Actions (Nếu cần xử lý Backend)
Nếu công cụ cần gọi API hoặc xử lý server-side, hãy tạo file action.

**File:** `lib/actions/your-tool.ts`
```typescript
'use server'

import { z } from 'zod' // Khuyên dùng Zod để validate

export async function performYourAction(input: string) {
    if (!input) return { error: 'Input is required' }

    try {
        // Xử lý logic tại đây (VD: Gọi API bên thứ 3, xử lý file...)
        const result = "Processed Data"
        
        return { success: true, data: result }
    } catch (e: any) {
        return { error: e.message }
    }
}
```

### Bước 3: Tạo Giao diện (Client Component)
Tạo component giao diện chính cho công cụ. Nên chia layout thành 2 phần: Input và Result (nếu có).

**File:** `components/tools/YourToolName.tsx`
```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { performYourAction } from '@/lib/actions/your-tool'

export function YourToolName() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleAction = async () => {
        setLoading(true)
        const res = await performYourAction("input data")
        
        if (res.error) {
            toast.error(res.error)
        } else {
            setResult(res.data)
            toast.success('Thành công!')
        }
        setLoading(false)
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Input</CardTitle></CardHeader>
                <CardContent>
                    {/* Form Controls */}
                    <Button onClick={handleAction} disabled={loading}>
                        Thực hiện
                    </Button>
                </CardContent>
            </Card>

            {/* Kết quả */}
            {result && (
                <Card>
                    <CardHeader><CardTitle>Kết quả</CardTitle></CardHeader>
                    <CardContent>{result}</CardContent>
                </Card>
            )}
        </div>
    )
}
```

### Bước 4: Tạo Page Wrapper
Tạo trang Next.js để hiển thị công cụ. Bắt buộc sử dụng `ToolShell` để đảm bảo đồng bộ giao diện.

**File:** `app/tools/your-tool-slug/page.tsx`
```typescript
import { YourToolName } from '@/components/tools/YourToolName'
import { ToolShell } from '@/components/dashboard/ToolShell'
import { YourIcon } from 'lucide-react' // Import Icon tương ứng
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Tên Công Cụ - UMTers Tools',
    description: 'Mô tả chuẩn SEO cho công cụ.'
}

export default function YourToolPage() {
    return (
        <ToolShell
            title="Tên Công Cụ"
            description="Mô tả chi tiết hơn về cách sử dụng công cụ này."
            icon={YourIcon}
        >
            <YourToolName />
        </ToolShell>
    )
}
```

### Bước 5: Kiểm tra
1.  Truy cập Dashboard -> Công cụ mới sẽ tự động xuất hiện.
2.  Kiểm tra trang Admin (`/admin/modules`) -> Công cụ sẽ có trong danh sách quản lý Bật/Tắt.
3.  Thử chức năng Bật/Tắt để đảm bảo logic hiển thị hoạt động đúng.
