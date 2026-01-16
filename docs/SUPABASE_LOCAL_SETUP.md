# Supabase Local Setup Guide

## ✅ Hoàn Thành

### Supabase CLI Installation
Supabase CLI **v2.67.1** đã được cài đặt thành công!

```bash
# Verify installation
~/.local/bin/supabase --version
# Output: 2.67.1
```

**Location:** `~/.local/bin/supabase`  
**PATH:** Đã được thêm vào `~/.bashrc`

---

## ⏳ Đang Chờ: Docker Installation  

Command `sudo snap install docker` **đang chờ password**.

### Cách Hoàn Thành Docker Installation:

#### Option A: Nhập Password vào Terminal hiện tại
1. Tìm terminal window đang chạy command `sudo snap install docker`
2. Nhập sudo password của bạn
3. Chờ Docker installation hoàn tất (~5-10 phút)

#### Option B: Hủy và Cài Lại (Khuyến Nghị)
Nếu bạn muốn thấy progress rõ ràng hơn:

```bash
# 1. Hủy command hiện tại (Ctrl+C trong terminal đang chạy)

# 2. Cài Docker Desktop bằng lệnh này (sẽ show progress)\nsudo snap install docker

# 3. Sau khi cài xong, kiểm tra
docker --version

# 4. Start Docker service
sudo systemctl start snap.docker.dockerd.service

# 5. Add user vào docker group (để không cần sudo)
sudo usermod -aG docker $USER

# 6. Logout và login lại để áp dụng group changes
# Hoặc chạy:
newgrp docker

# 7. Test Docker
docker ps
```

---

## 🚀 Các Bước Tiếp Theo (Sau Khi Docker Sẵn Sàng)

### 1. Initialize Supabase Project
```bash
cd /home/qminh77/Downloads/UMTERS.CLUB/tool-website
~/.local/bin/supabase init
```

### 2. Start Supabase Local
```bash
~/.local/bin/supabase start
```

**Expected Output:**
```
Applying migration 001_initial_schema.sql...
Applying migration 002_rls_policies_fixed.sql...
... (all 11 migrations)

Started supabase local development setup.

API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Anon key: eyJhbGci...
Service role key: eyJhbGci...
```

### 3. Update Environment Variables
Copy the keys from `supabase start` output and update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-output>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-output>
```

### 4. Test Application
```bash
npm run dev
```

Open `http://localhost:3000` and verify everything works!

---

## 📊 Current Progress

- [x] Supabase CLI installed (v2.67.1)
- [x] PATH configured
- [/] Docker Desktop installation (waiting for password)
- [ ] Supabase project initialized
- [ ] Local Supabase services started
- [ ] Environment variables configured
- [ ] Application tested

---

## 🐛 Troubleshooting

### If Docker installation fails:
```bash
# Uninstall và thử lại
sudo snap remove docker
sudo snap install docker
```

### If PATH doesn't work:
```bash
# Reload bashrc
source ~/.bashrc

# Or use full path  
~/.local/bin/supabase --version
```

### If Supabase won't start:
```bash
# Kiểm tra Docker đang chạy
docker ps

# Nếu không, start Docker
sudo systemctl start docker

# Thử lại
~/.local/bin/supabase start
```

---

## ⏱️ Ước Tính Thời Gian Còn Lại

- Docker installation: 5-10 phút
- Supabase init: 30 giây
- Supabase start (first time): 10-15 phút (download images)
- Configuration: 5 phút
- Testing: 5 phút

**Total: ~25-35 phút nữa**
