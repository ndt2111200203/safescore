# SafeScore 🎯

**Học tập cân bằng · Tâm trí khoẻ mạnh**

Nền tảng web giúp sinh viên theo dõi cảm xúc học tập, quản lý deadline và nhận cảnh báo khi quá tải.

---

## ⚡ Cài đặt nhanh (Local)

### 1. Cài dependencies
```bash
cd backend
npm install
```

### 2. Tạo file `.env`
```bash
cp .env.example .env
```

Mở file `.env` và điền thông tin:
```
DATABASE_URL=postgresql://user:password@localhost:5432/safescore
JWT_SECRET=mot_chuoi_ngau_nhien_dai_va_kho_doan
PORT=3000
NODE_ENV=development
```

### 3. Tạo database
```bash
# Tạo database PostgreSQL
createdb safescore

# Chạy schema
psql -d safescore -f db/schema.sql
```

### 4. Chạy server
```bash
npm run dev
```

Mở trình duyệt tại: **http://localhost:3000**

---

## 🚀 Deploy lên Railway (Online)

### Bước 1: Đẩy code lên GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/safescore.git
git push -u origin main
```

### Bước 2: Tạo project trên Railway
1. Truy cập [railway.app](https://railway.app) và đăng nhập bằng GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Chọn repo `safescore`
4. Railway sẽ tự phát hiện Node.js và deploy

### Bước 3: Thêm PostgreSQL database
1. Trong project Railway, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Click vào PostgreSQL service → tab **"Variables"**
3. Copy giá trị `DATABASE_URL`

### Bước 4: Cấu hình biến môi trường
Trong Railway, vào service app → tab **"Variables"**:
```
DATABASE_URL=<dán URL từ bước trên>
JWT_SECRET=<tạo chuỗi random dài, VD: openssl rand -base64 32>
NODE_ENV=production
```

### Bước 5: Chạy schema
Trong Railway, mở **Shell** của PostgreSQL service và chạy:
```sql
-- Dán toàn bộ nội dung file db/schema.sql
```

### Bước 6: Cấu hình Root Directory
Trong Railway → service app → **Settings** → **Root Directory**: đặt thành `backend`

✅ Railway sẽ auto-deploy mỗi khi bạn push code lên GitHub!

---

## 📁 Cấu trúc project

```
safescore/
├── backend/
│   ├── server.js          ← Entry point
│   ├── package.json
│   ├── .env.example
│   ├── db/
│   │   ├── schema.sql     ← Tạo bảng database
│   │   └── pool.js        ← Kết nối PostgreSQL
│   ├── middleware/
│   │   └── auth.js        ← JWT verification
│   └── routes/
│       ├── auth.js        ← Đăng ký/đăng nhập
│       ├── mood.js        ← Mood check-in API
│       ├── deadlines.js   ← Deadline CRUD API
│       ├── stress.js      ← Stress calculation API
│       └── community.js   ← Community wall API
└── frontend/
    ├── index.html         ← SPA shell
    ├── css/
    │   ├── style.css      ← Design system
    │   ├── components.css ← UI components
    │   └── animations.css ← Animations
    └── js/
        ├── app.js         ← Router
        ├── api.js         ← API client
        ├── charts.js      ← Chart helpers
        └── pages/
            ├── auth.js
            ├── dashboard.js
            ├── mood.js
            ├── deadlines.js
            ├── stress.js
            ├── ai.js
            └── community.js
```

---

## 🎯 Tính năng

| Tính năng | Mô tả |
|---|---|
| 🔐 Đăng ký/Đăng nhập | JWT authentication, bcrypt password hashing |
| 🏠 Dashboard | Stress gauge, deadline preview, mood sparkline, AI tip |
| 😊 Mood Check-in | 5 mức cảm xúc, tags, ghi chú, heatmap calendar, trend chart |
| 📅 Deadline Tracker | Kanban board, CRUD, progress tracking, filter |
| 📊 Stress Meter | Gauge tính tự động từ deadlines + mood, factor breakdown |
| 🤖 AI Gợi ý | Rule-based suggestions theo tình trạng thực tế |
| 💬 Tường Ẩn Danh | Post ẩn danh, emoji reactions, content moderation |

---

## 🛠 Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt
- **Frontend**: HTML + CSS + Vanilla JS
- **Charts**: Chart.js
- **Deploy**: Railway
