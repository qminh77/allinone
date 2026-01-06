import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold tracking-tight">
          🛠️ Tool Website
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Hệ thống quản lý công cụ với phân quyền động, được xây dựng bằng Next.js 14 + Supabase
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Button size="lg" asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">Đăng ký</Link>
          </Button>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>✨ Tính năng chính:</p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">
              🔐 Authentication
            </span>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">
              🎭 Phân quyền động
            </span>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">
              ⚡ Row Level Security
            </span>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">
              📊 Audit Logs
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
