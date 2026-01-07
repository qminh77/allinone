# 🛠️ Ultimate Tool Website

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Shadcn UI](https://img.shields.io/badge/Shadcn_UI-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

> **Motto:** Hệ thống công cụ trực tuyến mạnh mẽ, đa năng và bảo mật cao dành cho Developer và Power Users.

---

## 📖 Giới thiệu (Introduction)

**Tool Website** là một nền tảng "All-in-One" cung cấp hơn 50+ công cụ tiện ích từ chuyển đổi dữ liệu, mã hóa, format code đến kiểm tra mạng và SEO. Dự án được xây dựng với kiến trúc hiện đại, tập trung vào **hiệu năng**, **bảo mật** và **trải nghiệm người dùng (UX)**.

Điểm đặc biệt của hệ thống là khả năng **Quản lý phân quyền động (Dynamic RBAC)**, cho phép Admin kiểm soát chi tiết quyền hạn truy cập của từng người dùng đối với từng module cụ thể.

## ✨ Tính năng nổi bật (Key Features)

### 🔐 Bảo mật & Xác thực (Security & Auth)
- **Supabase Auth**: Đăng ký/Đăng nhập an toàn, hỗ trợ Social Login.
- **Session Management**: Quản lý phiên làm việc bảo mật với HttpOnly Cookies.
- **Row Level Security (RLS)**: Bảo vệ dữ liệu người dùng ở cấp độ Database.
- **Security Audit Logs**: Ghi lại mọi hành động quan trọng (Login, đổi quyền, truy cập admin).

### 🎭 Hệ thống phân quyền (Dynamic Permission System)
- **Roles**: Admin, User, Guest (Customizable).
- **Permissions**: Hơn 20+ quyền hạn chi tiết (e.g., `users.view`, `tools.manage`).
- **Role Assignment**: Dễ dàng gán quyền cho Groups hoặc User cụ thể.

### 🛠️ Kho công cụ khổng lồ (Tool Modules)
Hệ thống tích hợp sẵn hơn 45 công cụ được chia thành các nhóm:

| 🔄 Converters | ⚡ Generators | 🧹 Formatters & Minifiers | 🔍 Lookups & Checkers | 🛠️ Utilities |
| :--- | :--- | :--- | :--- | :--- |
| **JSON** ↔ XML/YAML | **UUID/ULID** | **JSON/SQL** Formatter | **DNS** Lookup | **Diff** Viewer |
| **Base64** Encode/Decode | **Bcrypt/MD5** Hash | **JS/CSS/HTML** Minifier | **Whois** Domain | **Color** Picker |
| **Hex** / **Binary** | **Password** Strong | **Duplicate** Remover | **SSL** Checker | **QR Code** Gen |
| **Image** Converter | **Slug** Generator | **Text** Cleaner | **IP** Info | **Unit** Converter |
| **PDF** Tools | **Lorem Ipsum** | **Case** Converter | **HTTP** Headers | **Spin Wheel** |
| ... và nhiều hơn nữa | | | | |

### 🎨 Giao diện hiện đại (Modern UI/UX)
- **Dark/Light Mode**: Tự động theo hệ thống hoặc tùy chỉnh.
- **Responsive**: Hoạt động mượt mà trên Mobile, Tablet và Desktop.
- **Interactive**: Hiệu ứng mượt mà, phản hồi tức thì.

---

## 🧰 Danh sách công cụ chi tiết (Tool Catalog)

### 🔄 Converters (Chuyển đổi)
*   **Base64Converter**: Mã hóa/Giải mã chuỗi Base64.
*   **Binary/Hex/Decimal**: Chuyển đổi qua lại giữa các hệ cơ số.
*   **ColorConverter**: HEX ↔ RGB ↔ HSL ↔ CMYK.
*   **CSV/Excel/JSON**: Chuyển đổi dữ liệu bảng tính.
*   **HTML/Markdown**: Render và chuyển đổi định dạng văn bản.
*   **SQL/XML/YAML**: Chuyển đổi cấu trúc dữ liệu.
*   **Temperature/Speed**: Chuyển đổi đơn vị vật lý.

### ⚡ Generators (Tạo dữ liệu)
*   **UuidGenerator**: Tạo UUID v4 ngẫu nhiên.
*   **BcryptGenerator**: Hash mật khẩu chuẩn Bcrypt.
*   **Md5Generator**: Tạo mã băm MD5.
*   **Strong Password**: Tạo mật khẩu mạnh, tùy chỉnh độ dài/ký tự.
*   **LoremIpsum**: Tạo văn bản giả (dummy text).
*   **SlugGenerator**: Tạo URL slug chuẩn SEO.
*   **Signature**: Tạo chữ ký điện tử.

### 🧹 Formatters & Minifiers (Định dạng & Tối ưu)
*   **Css/Js/Html Minifier**: Nén code web để tối ưu tốc độ.
*   **SqlFormatter**: Format câu lệnh SQL dễ đọc.
*   **TextSeparator**: Tách/Gộp văn bản.
*   **DuplicateLinesRemover**: Loại bỏ dòng trùng lặp.

### 🔍 Lookups (Tra cứu)
*   **WhoisLookup**: Kiểm tra thông tin chủ sở hữu tên miền.
*   **DNSLookup**: Tra cứu bản ghi DNS (A, MX, CNAME...).
*   **IPLookup**: Xác định vị trí và thông tin IP.
*   **SSLLookup**: Kiểm tra chứng chỉ bảo mật.
*   **UserAgentParser**: Phân tích thông tin trình duyệt.

---

## 🚀 Cài đặt & Sử dụng (Installation)

### Yêu cầu (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 trở lên)
- [npm](https://www.npmjs.com/) hoặc `yarn`/`pnpm`
- Tài khoản [Supabase](https://supabase.com/)

### 1. Clone dự án

```bash
git clone https://github.com/qminh77/tool-website.git
cd tool-website
```

### 2. Cài đặt thư viện

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env.local` tại thư mục gốc và điền thông tin từ Supabase:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Lưu ý:** `SUPABASE_SERVICE_ROLE_KEY` là khóa bí mật, **KHÔNG** được để lộ ra ngoài client-side.

### 4. Khởi tạo Database

Vào Supabase SQL Editor và chạy các file trong thư mục `supabase/migrations`:
1.  `001_initial_schema.sql`: Tạo bảng users, roles, permissions.
2.  `002_rls_policies.sql`: Thiết lập bảo mật RLS.
3.  `003_seed_data.sql`: Dữ liệu mẫu ban đầu.

### 5. Chạy dự án

```bash
npm run dev
```

Truy cập `http://localhost:3000` để trải nghiệm!

---

## 📂 Cấu trúc dự án (Project Structure)

```
tool-website/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Route đăng nhập/đăng ký
│   ├── (dashboard)/      # Dashboard chính
│   ├── admin/            # Trang quản trị (Admin only)
│   └── api/              # API Endpoints
├── components/           # UI Components
│   ├── tools/            # Source code của 50+ tools
│   ├── ui/               # Shadcn UI base components
│   └── ...
├── lib/                  # Utilities & Helpers
│   ├── auth/             # Auth logic
│   ├── supabase/         # Supabase client
│   └── utils.ts          # Helper functions
├── public/               # Static assets
└── supabase/             # Database migrations & types
```

---

## 🤝 Đóng góp (Contributing)

Mọi đóng góp đều được hoan nghênh! Vui lòng:
1.  Fork dự án.
2.  Tạo branch mới (`git checkout -b feature/AmazingFeature`).
3.  Commit thay đổi (`git commit -m 'Add some AmazingFeature'`).
4.  Push lên branch (`git push origin feature/AmazingFeature`).
5.  Tạo Pull Request.

---

## 📜 License

Dự án này được phân phối dưới giấy phép **MIT**. Xem file `LICENSE` để biết thêm chi tiết.

---

<div align="center">
  Made with ❤️ by <b>QMinh77</b>
</div>
