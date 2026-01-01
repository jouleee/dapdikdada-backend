# 🔐 Authentication API Documentation

Dokumentasi API Authentication untuk sistem admin Dashboard Monitoring Pendidikan.

---

## 📋 Auth Endpoints

### Base URL
```
http://localhost:5000/api/auth
```

---

## 🔑 Authentication Flow

1. **Register** - Buat akun admin baru
2. **Login** - Login dan dapat JWT token
3. **Gunakan Token** - Kirim token di header untuk akses protected routes
4. **Manage Profile** - Update profile dan password

---

## API Endpoints

### 1. Register Admin

Membuat akun admin baru.

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "name": "Admin Jabar",
  "email": "admin@jabar.go.id",
  "password": "password123",
  "role": "admin"
}
```

**Fields:**
- `name` (required): Nama lengkap admin
- `email` (required): Email valid dan unique
- `password` (required): Min. 6 karakter
- `role` (optional): "admin" atau "superadmin" (default: "admin")

**Response Success (201):**

```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "Admin Jabar",
    "email": "admin@jabar.go.id",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (400):**

```json
{
  "success": false,
  "error": "Email sudah terdaftar"
}
```

---

### 2. Login Admin

Login dan mendapatkan JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "admin@jabar.go.id",
  "password": "password123"
}
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "Admin Jabar",
    "email": "admin@jabar.go.id",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401):**

```json
{
  "success": false,
  "error": "Email atau password salah"
}
```

---

### 3. Get My Profile

Mendapatkan profile admin yang sedang login.

**Endpoint:** `GET /api/auth/me`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "Admin Jabar",
    "email": "admin@jabar.go.id",
    "role": "admin",
    "isActive": true,
    "lastLogin": "2024-12-31T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-12-31T10:30:00.000Z"
  }
}
```

---

### 4. Update Profile

Update nama dan email admin.

**Endpoint:** `PUT /api/auth/updateprofile`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Admin Jawa Barat",
  "email": "admin.baru@jabar.go.id"
}
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "Admin Jawa Barat",
    "email": "admin.baru@jabar.go.id",
    "role": "admin",
    "isActive": true
  }
}
```

---

### 5. Update Password

Ganti password admin.

**Endpoint:** `PUT /api/auth/updatepassword`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "Admin Jabar",
    "email": "admin@jabar.go.id",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401):**

```json
{
  "success": false,
  "error": "Password lama salah"
}
```

---

### 6. Get All Admins (Superadmin Only)

Mendapatkan list semua admin. Hanya untuk superadmin.

**Endpoint:** `GET /api/auth/admins`

**Headers:**

```
Authorization: Bearer <superadmin_token>
```

**Response Success (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65abc123...",
      "name": "Admin Jabar",
      "email": "admin@jabar.go.id",
      "role": "admin",
      "isActive": true,
      "lastLogin": "2024-12-31T10:30:00.000Z"
    },
    {
      "_id": "65abc124...",
      "name": "Super Admin",
      "email": "super@jabar.go.id",
      "role": "superadmin",
      "isActive": true,
      "lastLogin": "2024-12-31T09:00:00.000Z"
    }
  ]
}
```

**Response Error (403):**

```json
{
  "success": false,
  "error": "Role admin tidak memiliki akses ke resource ini"
}
```

---

## 🔒 Protected Routes

Setelah authentication ditambahkan, beberapa endpoints sekarang **require token**:

### Schools CRUD (Protected)

**Create School:** `POST /api/schools`
```bash
curl -X POST http://localhost:5000/api/schools \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "npsn": "20219999",
    "nama_sekolah": "SD TEST",
    "jenjang": "SD",
    "status_sekolah": "NEGERI",
    ...
  }'
```

**Update School:** `PUT /api/schools/:id`
```bash
curl -X PUT http://localhost:5000/api/schools/65abc123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nama_sekolah": "SD UPDATED"
  }'
```

**Delete School:** `DELETE /api/schools/:id`
```bash
curl -X DELETE http://localhost:5000/api/schools/65abc123 \
  -H "Authorization: Bearer <token>"
```

### Public Routes (Tidak perlu token)

Semua GET endpoints tetap public:
- `GET /api/schools` - List sekolah
- `GET /api/schools/:id` - Detail sekolah
- `GET /api/schools/stats` - Statistik
- `GET /api/dashboard/stats` - Dashboard
- `GET /api/students/*` - Semua student endpoints

---

## 🧪 Testing Flow

### Step 1: Register Admin

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Jabar",
    "email": "admin@jabar.go.id",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "Admin Jabar",
    "email": "admin@jabar.go.id",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YWJjMTIzLi4uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDY2NTkyMDB9.abc123..."
  }
}
```

### Step 2: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jabar.go.id",
    "password": "password123"
  }'
```

### Step 3: Simpan Token

Copy token dari response login:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Gunakan Token untuk CRUD

```bash
# Create School
curl -X POST http://localhost:5000/api/schools \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "npsn": "20219999",
    "nama_sekolah": "SD NEGERI TEST",
    "jenjang": "SD",
    "status_sekolah": "NEGERI",
    "provinsi": "JAWA BARAT",
    "kode_kabupaten_kota": "3273",
    "nama_kabupaten_kota": "KOTA BANDUNG",
    "kemendagri_kode_kecamatan": "327306",
    "kemendagri_nama_kecamatan": "ARCAMANIK",
    "tahun": 2024
  }'
```

---

## 🔐 Admin Model Schema

```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, min: 6, hashed with bcrypt),
  role: String (enum: ['admin', 'superadmin'], default: 'admin'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🛡️ Security Features

1. **Password Hashing** - Menggunakan bcrypt dengan salt rounds 10
2. **JWT Token** - Token expired dalam 30 hari
3. **Password Never Returned** - Password tidak pernah di-return di response
4. **Token Validation** - Setiap request divalidasi tokennya
5. **Role-Based Access** - Superadmin memiliki akses lebih
6. **Account Status** - Admin bisa dinonaktifkan (isActive: false)

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Email dan password wajib diisi"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Token tidak valid atau expired"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Role admin tidak memiliki akses ke resource ini"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 📝 Environment Variables

Tambahkan di file `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sekolah
NODE_ENV=development
JWT_SECRET=dashboard-pendidikan-secret-key-2024
```

**Important:** Ganti `JWT_SECRET` dengan random string yang kompleks di production!

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

Packages baru yang ditambahkan:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation

### 2. Start Server

```bash
npm run dev
```

### 3. Register First Admin

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "super@jabar.go.id",
    "password": "admin123",
    "role": "superadmin"
  }'
```

### 4. Ready to Use!

Gunakan token dari register/login untuk akses protected routes.

---

## 📊 JWT Token Format

Token yang di-generate mengandung payload:

```javascript
{
  id: "65abc123...",  // Admin ID
  iat: 1704067200,    // Issued At
  exp: 1706659200     // Expires (30 days)
}
```

Token harus dikirim di header setiap request ke protected routes:

```
Authorization: Bearer <token>
```

---

**Dashboard Monitoring Pendidikan Jawa Barat - Authentication v1.0**

Made with 🔒 for secure admin management
