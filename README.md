# Dashboard Monitoring Pendidikan - Backend API

Backend API untuk Dashboard Monitoring Pendidikan Daerah menggunakan Node.js, Express, dan MongoDB.

> 📖 **Quick Start**: Lihat [QUICKSTART.md](QUICKSTART.md) untuk setup cepat  
> 📚 **API Usage**: Lihat [USAGE.md](USAGE.md) untuk contoh penggunaan API

## 🚀 Teknologi

- Node.js
- Express.js
- MongoDB
- Mongoose
- CORS enabled
- Nodemon (development)

## 📁 Struktur Project

```
backend/
├── config/
│   └── database.js          # Konfigurasi koneksi MongoDB
├── models/
│   ├── School.js            # Model Sekolah
│   ├── Student.js           # Model Siswa
│   └── EducationProgram.js  # Model Program Pendidikan
├── controllers/
│   ├── schoolController.js  # Controller untuk Sekolah
│   ├── studentController.js # Controller untuk Siswa
│   ├── programController.js # Controller untuk Program
│   └── dashboardController.js # Controller untuk Dashboard
├── routes/
│   ├── schoolRoutes.js      # Routes untuk Sekolah
│   ├── studentRoutes.js     # Routes untuk Siswa
│   ├── programRoutes.js     # Routes untuk Program
│   └── dashboardRoutes.js   # Routes untuk Dashboard
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Template environment variables
├── .gitignore
├── package.json
└── server.js                 # Entry point aplikasi
```

## ⚙️ Setup

> **Untuk setup lengkap langkah demi langkah, lihat [QUICKSTART.md](QUICKSTART.md)**

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy file `.env.example` menjadi `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

Edit file `.env`:
```
MONGODB_URI=mongodb://localhost:27017/sekolah
PORT=5000
NODE_ENV=development
```

### 3. Jalankan MongoDB

Pastikan MongoDB sudah berjalan di komputer Anda. Jika menggunakan MongoDB lokal:

```bash
mongod
```

Atau gunakan MongoDB Atlas (cloud database).

### 4. Jalankan Server

Development mode (dengan auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

## 📚 API Endpoints

> **Untuk dokumentasi lengkap dan contoh request, lihat [USAGE.md](USAGE.md)**  
> **Import `postman_collection.json` ke Postman/Thunder Client untuk testing**

### Dashboard
- `GET /api/dashboard/stats` - Get statistik lengkap dashboard

### Sekolah
- `GET /api/schools` - Get semua sekolah
- `GET /api/schools/:id` - Get sekolah berdasarkan ID
- `POST /api/schools` - Tambah sekolah baru
- `PUT /api/schools/:id` - Update sekolah
- `DELETE /api/schools/:id` - Hapus sekolah
- `GET /api/schools/stats` - Get statistik sekolah

### Siswa
- `GET /api/students` - Get semua siswa
- `GET /api/students/:id` - Get siswa berdasarkan ID
- `POST /api/students` - Tambah siswa baru
- `PUT /api/students/:id` - Update siswa
- `DELETE /api/students/:id` - Hapus siswa
- `GET /api/students/school/:schoolId` - Get siswa berdasarkan sekolah
- `GET /api/students/stats` - Get statistik siswa

### Program Pendidikan
- `GET /api/programs` - Get semua program
- `GET /api/programs/:id` - Get program berdasarkan ID
- `POST /api/programs` - Tambah program baru
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Hapus program
- `GET /api/programs/school/:schoolId` - Get program berdasarkan sekolah
- `GET /api/programs/stats` - Get statistik program

## 📝 Contoh Request

### Create Sekolah
```json
POST /api/schools
{
  "_id": "SCH001",
  "nama_sekolah": "SMA Negeri 1 Bandung",
  "jenjang": "SMA",
  "jumlah_siswa": 850,
  "akreditasi": "A",
  "kecamatan": "Coblong"
}
```

### Create Siswa
```json
POST /api/students
{
  "_id": "STD001",
  "nama": "Ahmad Rizki",
  "sekolah_id": "SCH001",
  "kelas": "XI",
  "gender": "L",
  "status": "Aktif"
}
```

### Create Program
```json
POST /api/programs
{
  "_id": "PRG001",
  "nama_program": "Beasiswa Siswa Kurang Mampu",
  "tahun": 2024,
  "jumlah_penerima": 120,
  "sekolah_id": "SCH001",
  "deskripsi": "Program beasiswa untuk siswa kurang mampu"
}
```

## 🔧 Testing dengan Postman/Thunder Client

1. Import collection atau buat request manual
2. Set base URL: `http://localhost:5000`
3. Test endpoint satu per satu
4. Untuk POST/PUT request, gunakan Content-Type: application/json

## 📊 Database Schema

### Schools Collection
- `_id`: String (ID unik)
- `nama_sekolah`: String (required)
- `jenjang`: String (SD/SMP/SMA/SMK)
- `jumlah_siswa`: Number
- `akreditasi`: String (A/B/C/Belum Terakreditasi)
- `kecamatan`: String

### Students Collection
- `_id`: String (ID unik)
- `nama`: String (required)
- `sekolah_id`: String (reference to School)
- `kelas`: String
- `gender`: String (L/P)
- `status`: String (Aktif/Lulus/Pindah/Dropout)

### Education Programs Collection
- `_id`: String (ID unik)
- `nama_program`: String (required)
- `tahun`: Number
- `jumlah_penerima`: Number
- `sekolah_id`: String (reference to School)
- `deskripsi`: String

## 🛠️ Troubleshooting

### MongoDB Connection Error
- Pastikan MongoDB sudah berjalan
- Check connection string di file `.env`
- Pastikan port MongoDB (default: 27017) tidak digunakan aplikasi lain

### Port Already in Use
- Ubah PORT di file `.env` menjadi port lain (misalnya 5001)

## 📄 License

ISC
