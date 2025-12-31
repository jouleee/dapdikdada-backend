# 📚 API Documentation - Dashboard Monitoring Pendidikan Jawa Barat

Dokumentasi lengkap REST API untuk sistem monitoring pendidikan daerah Jawa Barat.

---

## 📋 Table of Contents

- [Base Information](#-base-information)
- [Dashboard API](#-dashboard-api)
- [Schools API](#-schools-api)
- [Student Statistics API](#-student-statistics-api)
- [Education Programs API](#-education-programs-api)
- [Data Models](#-data-models)
- [Error Handling](#-error-handling)

---

## 🌐 Base Information

### Base URL
```
http://localhost:5000/api
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 10) |
| `jenjang` | string | Filter by level (SD/SMP/SMA/SMK/SLB) |
| `status_sekolah` | string | Filter by status (NEGERI/SWASTA) |

### Response Format

#### Success Response
```json
{
  "success": true,
  "count": 100,
  "pagination": {
    "current": 1,
    "total": 10,
    "pages": 10
  },
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 📊 Dashboard API

### Get Dashboard Statistics

Mendapatkan statistik overview dashboard dengan aggregasi data sekolah dan siswa.

**Endpoint:** `GET /api/dashboard/stats`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tahun_ajaran` | string | No | Filter tahun ajaran (format: 2024/2025) |

**MongoDB Operators Used:**
- `$facet` - Multiple aggregation pipelines
- `$lookup` - Self-join untuk persentase
- `$cond` - Conditional aggregation
- `$addToSet` - Unique values
- `$push` - Array aggregation
- `$slice` - Limit array results

**Response:**

```json
{
  "success": true,
  "data": {
    "totalSekolah": 30485,
    "totalSiswa": 48512149,
    "persebaranJenjang": [
      {
        "_id": "SD",
        "total": 19457,
        "negeri": 18234,
        "swasta": 1223,
        "persentase": 63.8
      },
      {
        "_id": "SMP",
        "total": 5966,
        "negeri": 4123,
        "swasta": 1843,
        "persentase": 19.6
      }
    ],
    "persebaranKabupaten": [
      {
        "_id": "KOTA BANDUNG",
        "total": 2543,
        "jenjang": {
          "SD": 1234,
          "SMP": 567,
          "SMA": 234,
          "SMK": 456,
          "SLB": 52
        }
      }
    ],
    "statistikSiswa": {
      "total": 48512149,
      "byJenjang": [
        {
          "_id": "SD",
          "jumlah_siswa": 26986184
        }
      ],
      "byStatus": [
        {
          "_id": "NEGERI",
          "jumlah_siswa": 35234567
        }
      ]
    },
    "trendAkreditasi": [
      {
        "_id": "A",
        "count": 5234,
        "persentase": 17.2
      }
    ],
    "recentSchools": [
      {
        "_id": "ObjectId",
        "nama_sekolah": "SD NEGERI 1 BANDUNG",
        "jenjang": "SD",
        "kabupaten": "KOTA BANDUNG"
      }
    ],
    "uniqueKecamatan": ["BANDUNG WETAN", "SUMUR BANDUNG", "..."]
  }
}
```

**Example:**

```bash
# Get dashboard stats for tahun ajaran 2024/2025
curl http://localhost:5000/api/dashboard/stats?tahun_ajaran=2024/2025
```

---

## 🏫 Schools API

### 1. Get All Schools

Mendapatkan daftar sekolah dengan filter, search, dan pagination.

**Endpoint:** `GET /api/schools`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10, max: 100) |
| `jenjang` | string | No | Filter by jenjang (SD/SMP/SMA/SMK/SLB) |
| `status_sekolah` | string | No | Filter by status (NEGERI/SWASTA) |
| `kabupaten` | string | No | Filter by kabupaten name |
| `kecamatan` | string | No | Filter by kecamatan name |
| `akreditasi` | string | No | Filter by akreditasi (A/B/C/TT) |
| `search` | string | No | Search in nama_sekolah, NPSN, kabupaten, kecamatan |

**MongoDB Operators Used:**
- `$or` - Multiple search conditions
- RegExp - Case-insensitive search
- `$skip`, `$limit` - Pagination

**Response:**

```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 30485,
    "pages": 3049
  },
  "data": [
    {
      "_id": "ObjectId",
      "npsn": "20219488",
      "nama_sekolah": "SD NEGERI CISARANTEN KIDUL",
      "jenjang": "SD",
      "status_sekolah": "NEGERI",
      "provinsi": "JAWA BARAT",
      "kode_kabupaten_kota": "3273",
      "nama_kabupaten_kota": "KOTA BANDUNG",
      "kemendagri_kode_kecamatan": "327306",
      "kemendagri_nama_kecamatan": "ARCAMANIK",
      "tahun": 2024,
      "jumlah_siswa": 456,
      "akreditasi": "A"
    }
  ]
}
```

**Examples:**

```bash
# Get all SD schools in KOTA BANDUNG
curl "http://localhost:5000/api/schools?jenjang=SD&kabupaten=KOTA BANDUNG&page=1&limit=20"

# Search schools
curl "http://localhost:5000/api/schools?search=NEGERI&page=1"

# Filter by akreditasi
curl "http://localhost:5000/api/schools?akreditasi=A&status_sekolah=NEGERI"
```

### 2. Get School Statistics

Mendapatkan statistik komprehensif sekolah dengan multiple aggregation pipelines.

**Endpoint:** `GET /api/schools/stats`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jenjang` | string | No | Filter by jenjang |
| `kabupaten` | string | No | Filter by kabupaten |

**MongoDB Operators Used:**
- `$facet` - 6 parallel pipelines
- `$cond` - Conditional counting
- `$setUnion` - Unique value union
- `$round` - Rounding decimals
- Nested `$group` - Multi-level grouping

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": [
      {
        "totalSekolah": 30485,
        "totalNegeri": 25678,
        "totalSwasta": 4807,
        "persentaseNegeri": 84.2,
        "persentaseSwasta": 15.8
      }
    ],
    "byJenjang": [
      {
        "_id": "SD",
        "total": 19457,
        "negeri": 18234,
        "swasta": 1223,
        "persentase": 63.8
      }
    ],
    "byStatus": [
      {
        "_id": "NEGERI",
        "total": 25678,
        "persentase": 84.2
      }
    ],
    "byAkreditasi": [
      {
        "_id": "A",
        "count": 5234,
        "persentase": 17.2
      }
    ],
    "byKabupaten": [
      {
        "_id": "KOTA BANDUNG",
        "total": 2543,
        "breakdown": {
          "SD": 1234,
          "SMP": 567,
          "SMA": 234,
          "SMK": 456,
          "SLB": 52
        }
      }
    ],
    "uniqueLocations": [
      {
        "totalKabupaten": 27,
        "totalKecamatan": 626,
        "kabupatenList": ["KOTA BANDUNG", "KABUPATEN BANDUNG", "..."],
        "kecamatanList": ["ARCAMANIK", "ANTAPANI", "..."]
      }
    ]
  }
}
```

**Example:**

```bash
# Get stats for SD schools
curl "http://localhost:5000/api/schools/stats?jenjang=SD"

# Get stats for specific kabupaten
curl "http://localhost:5000/api/schools/stats?kabupaten=KOTA BANDUNG"
```

### 3. Get Persebaran Analysis

Analisis persebaran sekolah dengan histogram dan density calculation.

**Endpoint:** `GET /api/schools/analysis/persebaran`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jenjang` | string | No | Filter by jenjang |

**MongoDB Operators Used:**
- `$bucket` - Histogram grouping
- `$size` - Array length
- `$divide` - Ratio calculation

**Response:**

```json
{
  "success": true,
  "data": {
    "perKabupaten": [
      {
        "_id": "KOTA BANDUNG",
        "totalSekolah": 2543,
        "density": "high",
        "breakdown": {
          "SD": 1234,
          "SMP": 567,
          "SMA": 234,
          "SMK": 456,
          "SLB": 52
        },
        "persentase": 8.3
      }
    ],
    "histogram": [
      {
        "_id": "0-500",
        "count": 12,
        "kabupatenList": ["KABUPATEN PANGANDARAN", "..."]
      },
      {
        "_id": "500-1000",
        "count": 8,
        "kabupatenList": ["KABUPATEN TASIKMALAYA", "..."]
      },
      {
        "_id": "1000+",
        "count": 7,
        "kabupatenList": ["KOTA BANDUNG", "KOTA BEKASI", "..."]
      }
    ],
    "summary": {
      "totalKabupaten": 27,
      "totalSekolah": 30485,
      "rataRataPerKabupaten": 1129,
      "kabupatenTertinggi": {
        "nama": "KABUPATEN BANDUNG",
        "jumlah": 3456
      },
      "kabupatenTerendah": {
        "nama": "KABUPATEN PANGANDARAN",
        "jumlah": 234
      }
    }
  }
}
```

**Example:**

```bash
# Get persebaran analysis for all schools
curl http://localhost:5000/api/schools/analysis/persebaran

# Get persebaran analysis for SD only
curl "http://localhost:5000/api/schools/analysis/persebaran?jenjang=SD"
```

### 4. Get Comparison Analysis

Membandingkan statistik antara 2 kabupaten.

**Endpoint:** `GET /api/schools/analysis/comparison`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kabupaten1` | string | Yes | Kabupaten pertama |
| `kabupaten2` | string | Yes | Kabupaten kedua |

**MongoDB Operators Used:**
- `$cond` - Conditional aggregation
- `$divide` - Ratio calculation
- Nested object projection

**Response:**

```json
{
  "success": true,
  "data": {
    "kabupaten1": {
      "nama": "KOTA BANDUNG",
      "totalSekolah": 2543,
      "negeri": 2134,
      "swasta": 409,
      "byJenjang": {
        "SD": 1234,
        "SMP": 567,
        "SMA": 234,
        "SMK": 456,
        "SLB": 52
      },
      "persentaseNegeri": 83.9,
      "persentaseSwasta": 16.1
    },
    "kabupaten2": {
      "nama": "KABUPATEN BANDUNG",
      "totalSekolah": 3456,
      "negeri": 3123,
      "swasta": 333,
      "byJenjang": {
        "SD": 2345,
        "SMP": 678,
        "SMA": 123,
        "SMK": 289,
        "SLB": 21
      },
      "persentaseNegeri": 90.4,
      "persentaseSwasta": 9.6
    },
    "comparison": {
      "selisihTotal": 913,
      "rasio": 1.36,
      "kabupatenLebihBanyak": "KABUPATEN BANDUNG"
    }
  }
}
```

**Example:**

```bash
# Compare KOTA BANDUNG vs KABUPATEN BANDUNG
curl "http://localhost:5000/api/schools/analysis/comparison?kabupaten1=KOTA BANDUNG&kabupaten2=KABUPATEN BANDUNG"
```

### 5. Get School by ID

**Endpoint:** `GET /api/schools/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "npsn": "20219488",
    "nama_sekolah": "SD NEGERI CISARANTEN KIDUL",
    "jenjang": "SD",
    "status_sekolah": "NEGERI",
    "provinsi": "JAWA BARAT",
    "kode_kabupaten_kota": "3273",
    "nama_kabupaten_kota": "KOTA BANDUNG",
    "kemendagri_kode_kecamatan": "327306",
    "kemendagri_nama_kecamatan": "ARCAMANIK",
    "tahun": 2024,
    "jumlah_siswa": 456,
    "akreditasi": "A"
  }
}
```

### 6. Get School by NPSN

**Endpoint:** `GET /api/schools/npsn/:npsn`

**Response:** Same as Get School by ID

**Example:**

```bash
curl http://localhost:5000/api/schools/npsn/20219488
```

### 7. Get Kecamatan List

**Endpoint:** `GET /api/schools/kecamatan`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kabupaten` | string | No | Filter kecamatan by kabupaten |

**Response:**

```json
{
  "success": true,
  "count": 626,
  "data": [
    "ARCAMANIK",
    "ANTAPANI",
    "BANDUNG WETAN",
    "SUMUR BANDUNG",
    "..."
  ]
}
```

### 8. Get Kabupaten List

**Endpoint:** `GET /api/schools/kabupaten`

**Response:**

```json
{
  "success": true,
  "count": 27,
  "data": [
    "KOTA BANDUNG",
    "KABUPATEN BANDUNG",
    "KOTA BEKASI",
    "KABUPATEN BEKASI",
    "..."
  ]
}
```

### 9. Create School

**Endpoint:** `POST /api/schools`

**Request Body:**

```json
{
  "npsn": "20219488",
  "nama_sekolah": "SD NEGERI TEST",
  "jenjang": "SD",
  "status_sekolah": "NEGERI",
  "provinsi": "JAWA BARAT",
  "kode_kabupaten_kota": "3273",
  "nama_kabupaten_kota": "KOTA BANDUNG",
  "kemendagri_kode_kecamatan": "327306",
  "kemendagri_nama_kecamatan": "ARCAMANIK",
  "tahun": 2024,
  "jumlah_siswa": 456,
  "akreditasi": "A"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "npsn": "20219488",
    "nama_sekolah": "SD NEGERI TEST",
    "..."
  }
}
```

### 10. Update School

**Endpoint:** `PUT /api/schools/:id`

**Request Body:** Same as Create School (partial update supported)

### 11. Delete School

**Endpoint:** `DELETE /api/schools/:id`

**Response:**

```json
{
  "success": true,
  "data": {}
}
```

---

## 👥 Student Statistics API

### 1. Get All Student Statistics

Mendapatkan list statistik siswa dengan filter dan pagination.

**Endpoint:** `GET /api/students`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10) |
| `jenjang` | string | No | Filter by jenjang |
| `status_sekolah` | string | No | Filter by status |
| `kabupaten` | string | No | Filter by kabupaten code |
| `tahun_ajaran` | string | No | Filter by tahun ajaran |

**Response:**

```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1322,
    "pages": 133
  },
  "data": [
    {
      "_id": "ObjectId",
      "kode_provinsi": "32",
      "nama_provinsi": "JAWA BARAT",
      "kode_kabupaten_kota": "3273",
      "nama_kabupaten_kota": "KOTA BANDUNG",
      "jenjang": "SD",
      "status_sekolah": "NEGERI",
      "jumlah_siswa": 125678,
      "tahun_ajaran": "2024/2025"
    }
  ]
}
```

### 2. Get Overall Statistics

Statistik keseluruhan siswa dengan multiple aggregations.

**Endpoint:** `GET /api/students/stats`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tahun_ajaran` | string | No | Filter tahun ajaran |

**MongoDB Operators Used:**
- `$facet` - 4 parallel pipelines
- `$sum` - Total aggregation
- Conditional grouping

**Response:**

```json
{
  "success": true,
  "data": {
    "totalSiswa": 48512149,
    "byJenjang": [
      {
        "_id": "SD",
        "jumlah_siswa": 26986184,
        "persentase": 55.6
      },
      {
        "_id": "SMP",
        "jumlah_siswa": 12689532,
        "persentase": 26.2
      },
      {
        "_id": "SMK",
        "jumlah_siswa": 8666343,
        "persentase": 17.9
      },
      {
        "_id": "SLB",
        "jumlah_siswa": 170090,
        "persentase": 0.4
      }
    ],
    "byStatus": [
      {
        "_id": "NEGERI",
        "jumlah_siswa": 35234567,
        "persentase": 72.6
      },
      {
        "_id": "SWASTA",
        "jumlah_siswa": 13277582,
        "persentase": 27.4
      }
    ],
    "byKabupaten": [
      {
        "_id": "3273",
        "nama": "KOTA BANDUNG",
        "jumlah_siswa": 456789
      }
    ],
    "byTahun": [
      {
        "_id": "2024/2025",
        "jumlah_siswa": 5234567
      }
    ]
  }
}
```

### 3. Get Students by Kabupaten

Summary statistik siswa per kabupaten.

**Endpoint:** `GET /api/students/summary/kabupaten`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jenjang` | string | No | Filter by jenjang |
| `tahun_ajaran` | string | No | Filter by tahun ajaran |

**MongoDB Operators Used:**
- `$facet` - Multiple aggregations
- `$cond` - Conditional sum for status breakdown

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "3273",
      "nama_kabupaten_kota": "KOTA BANDUNG",
      "total_siswa": 456789,
      "negeri": 334567,
      "swasta": 122222,
      "persentase_negeri": 73.2,
      "persentase_swasta": 26.8,
      "jenjang_count": {
        "SD": 234567,
        "SMP": 123456,
        "SMA": 45678,
        "SMK": 52088,
        "SLB": 1000
      }
    }
  ]
}
```

### 4. Get Students by Jenjang

Summary statistik siswa per jenjang.

**Endpoint:** `GET /api/students/summary/jenjang`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kabupaten` | string | No | Filter by kabupaten code |
| `tahun_ajaran` | string | No | Filter by tahun ajaran |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "SD",
      "total_siswa": 26986184,
      "negeri": 24567890,
      "swasta": 2418294,
      "persentase_negeri": 91.0,
      "persentase_swasta": 9.0,
      "jumlah_kabupaten": 27
    }
  ]
}
```

### 5. Get Student Trends

Analisis trend siswa dari tahun ke tahun.

**Endpoint:** `GET /api/students/trends`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jenjang` | string | No | Filter by jenjang |
| `kabupaten` | string | No | Filter by kabupaten code |

**MongoDB Operators Used:**
- Multi-field grouping (tahun × jenjang)
- `$sort` - Time series ordering

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": {
        "tahun_ajaran": "2024/2025",
        "jenjang": "SD"
      },
      "jumlah_siswa": 2654321,
      "negeri": 2423456,
      "swasta": 230865
    },
    {
      "_id": {
        "tahun_ajaran": "2023/2024",
        "jenjang": "SD"
      },
      "jumlah_siswa": 2598765,
      "negeri": 2367890,
      "swasta": 230875
    }
  ]
}
```

### 6. Get Tahun Ajaran List

List tahun ajaran yang tersedia.

**Endpoint:** `GET /api/students/tahun-ajaran`

**Response:**

```json
{
  "success": true,
  "count": 11,
  "data": [
    "2024/2025",
    "2023/2024",
    "2022/2023",
    "2021/2022",
    "2020/2021",
    "2019/2020",
    "2018/2019",
    "2017/2018",
    "2016/2017",
    "2015/2016",
    "2014/2015"
  ]
}
```

---

## 📖 Education Programs API

### 1. Get All Programs

**Endpoint:** `GET /api/programs`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 10) |

**Response:**

```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "data": [
    {
      "_id": "ObjectId",
      "nama_program": "Bantuan Operasional Sekolah",
      "jenis_program": "Bantuan Keuangan",
      "deskripsi": "Program bantuan operasional...",
      "tanggal_mulai": "2024-01-01T00:00:00.000Z",
      "tanggal_selesai": "2024-12-31T00:00:00.000Z",
      "status": "aktif",
      "sekolah_id": {
        "_id": "ObjectId",
        "nama_sekolah": "SD NEGERI 1 BANDUNG",
        "jenjang": "SD"
      },
      "anggaran": 50000000
    }
  ]
}
```

### 2. Get Program Statistics

**Endpoint:** `GET /api/programs/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 100,
    "byJenis": [
      {
        "_id": "Bantuan Keuangan",
        "count": 45
      }
    ],
    "byStatus": [
      {
        "_id": "aktif",
        "count": 78
      }
    ],
    "totalAnggaran": 5000000000
  }
}
```

### 3. Get Programs by School

**Endpoint:** `GET /api/programs/school/:schoolId`

**Response:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "ObjectId",
      "nama_program": "Bantuan Operasional Sekolah",
      "jenis_program": "Bantuan Keuangan",
      "status": "aktif",
      "anggaran": 50000000
    }
  ]
}
```

### 4. Get Program by ID

**Endpoint:** `GET /api/programs/:id`

### 5. Create Program

**Endpoint:** `POST /api/programs`

**Request Body:**

```json
{
  "nama_program": "Bantuan Operasional Sekolah",
  "jenis_program": "Bantuan Keuangan",
  "deskripsi": "Program bantuan operasional untuk sekolah",
  "tanggal_mulai": "2024-01-01",
  "tanggal_selesai": "2024-12-31",
  "status": "aktif",
  "sekolah_id": "ObjectId",
  "anggaran": 50000000
}
```

### 6. Update Program

**Endpoint:** `PUT /api/programs/:id`

**Request Body:** Same as Create Program (partial update supported)

### 7. Delete Program

**Endpoint:** `DELETE /api/programs/:id`

---

## 📦 Data Models

### School Model

```javascript
{
  npsn: String (unique, required),
  nama_sekolah: String (required),
  jenjang: String (required, enum: ['SD', 'SMP', 'SMA', 'SMK', 'SLB']),
  status_sekolah: String (required, enum: ['NEGERI', 'SWASTA']),
  provinsi: String (required),
  kode_kabupaten_kota: String (required),
  nama_kabupaten_kota: String (required),
  kemendagri_kode_kecamatan: String (required),
  kemendagri_nama_kecamatan: String (required),
  tahun: Number,
  jumlah_siswa: Number,
  akreditasi: String (enum: ['A', 'B', 'C', 'TT'])
}
```

**Indexes:**
- npsn (unique)
- jenjang
- status_sekolah
- kemendagri_nama_kecamatan
- nama_kabupaten_kota

### Student Statistic Model

```javascript
{
  kode_provinsi: String (required),
  nama_provinsi: String (required),
  kode_kabupaten_kota: String (required),
  nama_kabupaten_kota: String (required),
  jenjang: String (required, enum: ['SD', 'SMP', 'SMA', 'SMK', 'SLB']),
  status_sekolah: String (required, enum: ['NEGERI', 'SWASTA']),
  jumlah_siswa: Number (required),
  tahun_ajaran: String (required)
}
```

**Indexes:**
- kode_kabupaten_kota
- jenjang
- status_sekolah
- tahun_ajaran
- Compound: (jenjang + status_sekolah + tahun_ajaran)

### Education Program Model

```javascript
{
  nama_program: String (required),
  jenis_program: String (required),
  deskripsi: String,
  tanggal_mulai: Date (required),
  tanggal_selesai: Date,
  status: String (enum: ['aktif', 'selesai', 'ditunda'], default: 'aktif'),
  sekolah_id: ObjectId (ref: 'School', required),
  anggaran: Number
}
```

---

## ❌ Error Handling

### Error Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Errors

#### 400 Bad Request

```json
{
  "success": false,
  "error": "Missing required fields: nama_sekolah, jenjang"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "error": "School not found with id: 123456789"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Database connection failed"
}
```

---

## 🔍 MongoDB Query Features

API ini menggunakan 30+ MongoDB operators untuk tugas Basis Data Non-Relasional:

### Aggregation Operators
- `$facet` - Multiple parallel pipelines
- `$group` - Grouping data
- `$match` - Filtering
- `$project` - Field selection
- `$sort` - Sorting
- `$limit` - Limiting results
- `$lookup` - Join operations
- `$bucket` - Histogram grouping

### Conditional Operators
- `$cond` - If-then-else logic
- `$eq`, `$ne` - Equality checks
- `$in`, `$nin` - Array membership

### Array Operators
- `$addToSet` - Unique values
- `$push` - Array accumulation
- `$slice` - Array slicing
- `$size` - Array length
- `$setUnion` - Set operations

### Arithmetic Operators
- `$sum` - Summation
- `$avg` - Average
- `$divide` - Division
- `$multiply` - Multiplication
- `$round` - Rounding

### Text Search
- RegExp - Case-insensitive pattern matching

---

## 📊 Performance Tips

1. **Use Pagination**: Always use `page` and `limit` parameters untuk dataset besar
2. **Filter First**: Gunakan filter (jenjang, kabupaten, dll) sebelum request untuk reduce data transfer
3. **Specific Fields**: Gunakan aggregation endpoints untuk statistik daripada fetch all data
4. **Indexes**: Semua frequently-queried fields sudah di-index untuk performance optimal

---

## 🚀 Testing Examples

### Using cURL

```bash
# Dashboard Stats
curl http://localhost:5000/api/dashboard/stats

# Get Schools with Filters
curl "http://localhost:5000/api/schools?jenjang=SD&status_sekolah=NEGERI&page=1&limit=20"

# School Statistics
curl http://localhost:5000/api/schools/stats

# Persebaran Analysis
curl "http://localhost:5000/api/schools/analysis/persebaran?jenjang=SD"

# Comparison Analysis
curl "http://localhost:5000/api/schools/analysis/comparison?kabupaten1=KOTA%20BANDUNG&kabupaten2=KABUPATEN%20BANDUNG"

# Student Statistics
curl http://localhost:5000/api/students/stats

# Student Trends
curl "http://localhost:5000/api/students/trends?jenjang=SD"
```

### Using JavaScript (Fetch API)

```javascript
// Get Dashboard Stats
const response = await fetch('http://localhost:5000/api/dashboard/stats?tahun_ajaran=2024/2025');
const data = await response.json();
console.log(data);

// Get Schools with Search
const schools = await fetch('http://localhost:5000/api/schools?search=NEGERI&page=1&limit=10');
const schoolsData = await schools.json();
console.log(schoolsData);

// Create School
const newSchool = await fetch('http://localhost:5000/api/schools', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    npsn: '20219999',
    nama_sekolah: 'SD TEST',
    jenjang: 'SD',
    status_sekolah: 'NEGERI',
    provinsi: 'JAWA BARAT',
    kode_kabupaten_kota: '3273',
    nama_kabupaten_kota: 'KOTA BANDUNG',
    kemendagri_kode_kecamatan: '327306',
    kemendagri_nama_kecamatan: 'ARCAMANIK',
    tahun: 2024
  })
});
```

---

## 📝 Notes

- Semua endpoint sudah dilengkapi dengan **CORS** untuk frontend integration
- Data source: **Real data Jawa Barat** dari 30,485 sekolah dan 48.5M siswa (aggregated)
- Database: **MongoDB** dengan comprehensive indexes
- Semua aggregation menggunakan **advanced MongoDB operators** untuk BDNR assignment

---

**Dashboard Monitoring Pendidikan Jawa Barat API v1.0**

Made with ❤️ for UAS Basis Data Non-Relasional
