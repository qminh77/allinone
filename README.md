# Tool Website - Supabase + Next.js

Hệ thống quản lý công cụ (tools) với phân quyền động, được xây dựng bằng **Next.js 14** (App Router) + **TypeScript** + **Supabase** + **Shadcn UI**.

## 📋 Tính năng chính

### 🔐 Authentication & Authorization
- ✅ Đăng ký / Đăng nhập với Supabase Auth
- ✅ Middleware bảo vệ routes (dashboard, admin)
- ✅ Row Level Security (RLS) ở database level
- ✅ Session management với cookies (httpOnly, secure)

### 🎭 Hệ thống phân quyền động
- ✅ **Roles động**: Admin, User, Guest (có thể thêm/sửa/xóa)
- ✅ **Permissions**: 24 quyền hạn được chia theo module
- ✅ **Role-Permission mapping**: Gán quyền linh hoạt cho từng role
- ✅ **Permission checking**:
  - Server-side: `hasPermission()`, `requirePermission()`
  - Client-side: `usePermissions()` hook
  - UI components: `<ProtectedFeature permission="...">`

### ⚙️ Admin Control Panel
- ✅ Quản lý Users (xem danh sách, gán role)
- ✅ Quản lý Roles & Permissions
- ✅ Quản lý Modules (bật/tắt tools)
- ✅ Settings: Bật/tắt đăng ký, đăng nhập
- ✅ Audit Logs viewer

### 🛠️ Tool Modules (Examples)
- ✅ Text Formatter (uppercase, lowercase, capitalize, reverse)
- ⏳ Image Compressor (placeholder)
- ⏳ JSON Validator (placeholder)

### 📊 Audit Logging
- ✅ Ghi lại các hành động quan trọng:
  - Login, register, logout
  - Thay đổi role, permissions
  - Bật/tắt modules, settings
- ✅ Lưu metadata: user_id, action, IP, user agent, timestamp

### 🔒 Bảo mật
- ✅ SQL Injection: Parameterized queries (Supabase ORM)
- ✅ XSS: React auto-escape HTML
- ✅ CSRF: Next.js built-in protection
- ✅ Secrets management: `.env.local` (không commit lên Git)
- ✅ RLS policies cho tất cả bảng nhạy cảm

---

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies

```bash
cd tool-website
npm install
```

### 2. Tạo Supabase Project

1. Truy cập [https://supabase.com](https://supabase.com)
2. Tạo project mới
3. Lấy thông tin:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role key)

### 3. Cấu hình môi trường

Tạo file `.env.local`:

```env
# Public keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key (DANGEROUS - only for API routes!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Config
NEXT_PUBLIC_APP_NAME=Tool Website
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Chạy Database Migrations

Vào Supabase Dashboard → SQL Editor, chạy từng file migration theo thứ tự:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed_data.sql`

### 5. Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt: [http://localhost:3000](http://localhost:3000)

---

## 👤 Tạo tài khoản Admin đầu tiên

1. Đăng ký tài khoản mới qua UI (mặc định có role User)
2. Vào Supabase Dashboard → Table Editor → `user_profiles`
3. Update `role_id` = ID của role "Admin"

Hoặc chạy SQL:

```sql
-- Lấy user_id từ auth.users
SELECT id, email FROM auth.users;

-- Update role thành Admin
UPDATE user_profiles
SET role_id = (SELECT id FROM roles WHERE name = 'Admin')
WHERE id = 'user-id-here';
```

---

## 📊 Database Schema

### Bảng chính

| Bảng | Mô tả |
|------|-------|
| `user_profiles` | Hồ sơ người dùng (mở rộng từ auth.users) |
| `roles` | Các vai trò (Admin, User, Guest...) |
| `permissions` | Danh sách quyền hạn |
| `role_permissions` | Gán quyền cho role |
| `modules` | Danh sách tool modules |
| `settings` | Cấu hình hệ thống |
| `audit_logs` | Nhật ký hành động |
| `backups` | Metadata backup (chưa implement) |

---

## 🔐 Row Level Security (RLS)

Tất cả bảng đều có RLS policies:

- **user_profiles**: User xem/sửa profile của mình, Admin xem tất cả
- **roles, permissions**: Tất cả đọc được, chỉ Admin sửa được
- **audit_logs**: User xem logs của mình, Admin xem tất cả
- **settings**: Tất cả đọc được, chỉ Admin sửa được

---

## 🛡️ Bảo mật - Lưu ý quan trọng

### ❌ KHÔNG BAO GIỜ:
1. Commit file `.env.local` lên Git
2. Expose `SUPABASE_SERVICE_ROLE_KEY` ở client-side
3. Import `lib/supabase/admin.ts` vào Client Components
4. Cho phép user tự ghi audit logs (phải qua API)

### ✅ NÊN:
1. Kiểm tra permissions ở cả frontend VÀ backend
2. Dùng RLS làm lớp bảo vệ cuối cùng
3. Validate input trước khi gửi vào database
4. Ghi audit log cho mọi hành động quan trọng

---

## 📚 Cách sử dụng

### Kiểm tra quyền trong Component

```tsx
import { usePermissions } from '@/lib/permissions/hooks'
import { ProtectedFeature } from '@/components/auth/ProtectedFeature'

function MyComponent() {
  const { hasPermission, loading } = usePermissions()

  if (loading) return <div>Loading...</div>

  // Cách 1: Kiểm tra manual
  if (!hasPermission('users.edit')) {
    return <div>Không có quyền</div>
  }

  // Cách 2: Dùng component
  return (
    <ProtectedFeature permission="users.edit">
      <Button>Chỉnh sửa</Button>
    </ProtectedFeature>
  )
}
```

### Kiểm tra quyền trong API Route

```ts
import { getCurrentUser } from '@/lib/auth/session'
import { requirePermission } from '@/lib/permissions/check'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Require permission
  await requirePermission(user.id, 'users.edit')

  // ... xử lý logic
}
```

---

## 💡 Giải thích thuật ngữ đơn giản

**Row Level Security (RLS):** Bảo mật ở mức hàng (row) trong database. PostgreSQL tự động kiểm tra quyền mỗi khi user query dữ liệu. Ngay cả khi hacker bypass frontend/backend, họ vẫn không đọc được data không được phép.

**Permission Key:** Mã định danh duy nhất cho mỗi quyền (ví dụ: `users.edit`). Dùng string thay vì ID để dễ đọc code.

**Service Role Key:** Key có quyền "god mode", bỏ qua mọi RLS. Chỉ dùng trong API routes khi cần thao tác admin (như ghi audit log).

**Middleware:** Code chạy trước khi vào page. Next.js dùng để check auth, redirect nếu chưa login.

**Audit Log:** Nhật ký ghi lại "ai làm gì, khi nào". Quan trọng để điều tra sự cố hoặc vi phạm.

---

**Chúc bạn code vui vẻ! 🚀**
