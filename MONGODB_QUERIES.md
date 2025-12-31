# Dokumentasi Query MongoDB - Dashboard Monitoring Pendidikan Jawa Barat

## Daftar Fitur MongoDB yang Digunakan

### 1. Aggregation Pipeline Operators
- **$facet** - Multiple aggregation pipelines dalam satu query
- **$group** - Grouping data berdasarkan field tertentu
- **$match** - Filtering documents
- **$project** - Projection fields
- **$sort** - Sorting results
- **$limit** - Membatasi jumlah hasil
- **$lookup** - Join antar collection
- **$bucket** - Bucketing data berdasarkan ranges
- **$cond** - Conditional expressions
- **$sum**, **$avg**, **$min**, **$max** - Aggregation operators
- **$addToSet** - Unique array elements
- **$push** - Array accumulator
- **$slice** - Array slicing
- **$size** - Array size
- **$setUnion** - Set operations
- **$round**, **$divide**, **$multiply** - Arithmetic operators

### 2. Query Operators
- **$eq**, **$ne** - Equality operators
- **$in**, **$nin** - Array membership
- **$or**, **$and** - Logical operators
- **$regex** - Pattern matching
- **$gte**, **$lte**, **$gt**, **$lt** - Comparison operators

### 3. Index Optimization
- Single field indexes pada: `jenjang`, `status_sekolah`, `npsn`
- Compound indexes pada: `kode_kabupaten_kota + jenjang`

---

## Query Examples dari Controller

### 1. Dashboard Statistics (dashboardController.js)

**Endpoint:** `GET /api/dashboard/stats`

**MongoDB Query:**
```javascript
// $facet - Multiple pipelines dalam satu aggregation
School.aggregate([
  {
    $facet: {
      // Pipeline 1: Overview dengan $group
      overview: [{
        $group: {
          _id: null,
          total_sekolah: { $sum: 1 },
          total_siswa_registered: { $sum: '$jumlah_siswa' }
        }
      }],
      
      // Pipeline 2: Conditional aggregation dengan $cond
      byJenjang: [{
        $group: {
          _id: '$jenjang',
          jumlah_sekolah: { $sum: 1 },
          sekolah_negeri: {
            $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, 1, 0] }
          },
          sekolah_swasta: {
            $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, 1, 0] }
          },
          avg_siswa_per_sekolah: { $avg: '$jumlah_siswa' }
        }
      }],
      
      // Pipeline 3: $lookup untuk join dengan collection lain
      byStatus: [{
        $group: {
          _id: '$status_sekolah',
          count: { $sum: 1 }
        }
      }, {
        $lookup: {
          from: 'schools',
          pipeline: [{ $count: 'total' }],
          as: 'totalSchools'
        }
      }, {
        $project: {
          status: '$_id',
          count: 1,
          percentage: {
            $multiply: [
              { $divide: ['$count', { $arrayElemAt: ['$totalSchools.total', 0] }] },
              100
            ]
          }
        }
      }],
      
      // Pipeline 4: $push untuk array accumulation
      byAkreditasi: [{
        $group: {
          _id: '$akreditasi',
          count: { $sum: 1 },
          sekolah_list: {
            $push: {
              nama: '$nama_sekolah',
              kabupaten: '$nama_kabupaten_kota'
            }
          }
        }
      }, {
        $project: {
          akreditasi: '$_id',
          count: 1,
          sample_schools: { $slice: ['$sekolah_list', 5] }
        }
      }],
      
      // Pipeline 5: $addToSet untuk unique values
      topKabupaten: [{
        $group: {
          _id: '$nama_kabupaten_kota',
          total_sekolah: { $sum: 1 },
          jenjang_tersedia: { $addToSet: '$jenjang' }
        }
      }, {
        $sort: { total_sekolah: -1 }
      }, {
        $limit: 10
      }]
    }
  }
])
```

**Penjelasan:**
- Menggunakan **$facet** untuk menjalankan 5 pipeline berbeda secara parallel
- **$cond** untuk conditional aggregation (hitung sekolah negeri/swasta)
- **$lookup** untuk self-join menghitung persentase
- **$push** dan **$slice** untuk sampling data
- **$addToSet** untuk mendapatkan unique jenjang per kabupaten

---

### 2. School Statistics (schoolController.js)

**Endpoint:** `GET /api/schools/stats`

**MongoDB Query:**
```javascript
School.aggregate([
  {
    $facet: {
      byJenjang: [{
        $group: {
          _id: '$jenjang',
          count: { $sum: 1 },
          // Multiple conditional sums
          negeri_count: {
            $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, 1, 0] }
          },
          swasta_count: {
            $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, 1, 0] }
          },
          akreditasi_A: {
            $sum: { $cond: [{ $eq: ['$akreditasi', 'A'] }, 1, 0] }
          },
          akreditasi_B: {
            $sum: { $cond: [{ $eq: ['$akreditasi', 'B'] }, 1, 0] }
          },
          akreditasi_C: {
            $sum: { $cond: [{ $eq: ['$akreditasi', 'C'] }, 1, 0] }
          }
        }
      }],
      
      // $setUnion untuk unique set operations
      byAkreditasi: [{
        $group: {
          _id: '$akreditasi',
          by_jenjang: { $push: '$jenjang' }
        }
      }, {
        $project: {
          jenjang_list: { $setUnion: ['$by_jenjang', []] }
        }
      }],
      
      // Nested object projection
      topKabupaten: [{
        $group: {
          _id: '$nama_kabupaten_kota',
          avg_siswa_per_sekolah: { $avg: '$jumlah_siswa' }
        }
      }, {
        $project: {
          avg_siswa_per_sekolah: { $round: ['$avg_siswa_per_sekolah', 0] }
        }
      }],
      
      // Complex nested grouping
      kabupatenJenjangMatrix: [{
        $group: {
          _id: {
            kabupaten: '$nama_kabupaten_kota',
            jenjang: '$jenjang'
          },
          count: { $sum: 1 }
        }
      }]
    }
  }
])
```

**Penjelasan:**
- Multiple **$cond** untuk breakdown detail per kategori
- **$setUnion** untuk unique list dari array
- **$round** untuk formatting angka desimal
- Nested **_id** untuk grouping multi-dimensional (matrix kabupaten × jenjang)

---

### 3. Persebaran Analysis (schoolController.js)

**Endpoint:** `GET /api/schools/analysis/persebaran`

**MongoDB Query:**
```javascript
School.aggregate([
  { $match: matchStage },
  {
    $facet: {
      // $bucket untuk grouping berdasarkan range
      byStudentSize: [{
        $bucket: {
          groupBy: '$jumlah_siswa',
          boundaries: [0, 100, 500, 1000, 2000, 5000],
          default: '5000+',
          output: {
            count: { $sum: 1 },
            schools: {
              $push: {
                nama: '$nama_sekolah',
                kabupaten: '$nama_kabupaten_kota',
                siswa: '$jumlah_siswa'
              }
            }
          }
        }
      }],
      
      // $size untuk array length calculation
      densityPerKecamatan: [{
        $group: {
          _id: {
            kecamatan: '$kemendagri_nama_kecamatan',
            kabupaten: '$nama_kabupaten_kota'
          },
          jenjang_list: { $addToSet: '$jenjang' },
          status_list: { $addToSet: '$status_sekolah' }
        }
      }, {
        $project: {
          kelengkapan_jenjang: { $size: '$jenjang_list' },
          variasi_status: { $size: '$status_list' }
        }
      }]
    }
  }
])
```

**Penjelasan:**
- **$bucket** untuk histogram/distribution analysis
- **$size** untuk menghitung jumlah unique elements
- Custom **boundaries** untuk bucketing

---

### 4. Comparison Analysis (schoolController.js)

**Endpoint:** `GET /api/schools/analysis/comparison`

**MongoDB Query:**
```javascript
School.aggregate([
  {
    $match: {
      nama_kabupaten_kota: { 
        $in: [new RegExp(kabupaten1, 'i'), new RegExp(kabupaten2, 'i')] 
      }
    }
  },
  {
    $group: {
      _id: '$nama_kabupaten_kota',
      // Multiple conditional counts per jenjang
      sd_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SD'] }, 1, 0] } },
      smp_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SMP'] }, 1, 0] } },
      sma_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SMA'] }, 1, 0] } },
      smk_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SMK'] }, 1, 0] } },
      slb_count: { $sum: { $cond: [{ $eq: ['$jenjang', 'SLB'] }, 1, 0] } },
      kecamatan_list: { $addToSet: '$kemendagri_nama_kecamatan' }
    }
  },
  {
    $project: {
      // Arithmetic operations untuk rasio
      rasio_negeri_swasta: {
        $round: [
          { $divide: ['$sekolah_negeri', '$sekolah_swasta'] },
          2
        ]
      },
      // Nested object construction
      distribusi_jenjang: {
        SD: '$sd_count',
        SMP: '$smp_count',
        SMA: '$sma_count',
        SMK: '$smk_count',
        SLB: '$slb_count'
      },
      jumlah_kecamatan: { $size: '$kecamatan_list' }
    }
  }
])
```

**Penjelasan:**
- **$in** dengan **RegExp** untuk case-insensitive matching
- Multiple **$cond** untuk breakdown per kategori
- **$divide** dan **$round** untuk rasio calculation
- Nested object construction dalam **$project**

---

### 5. Student Statistics (studentController.js)

**Endpoint:** `GET /api/students/stats`

**MongoDB Query:**
```javascript
StudentStatistic.aggregate([
  { $match: matchStage },
  {
    $facet: {
      totalSiswa: [{
        $group: {
          _id: null,
          total: { $sum: '$jumlah_siswa' }
        }
      }],
      
      byJenjang: [{
        $group: {
          _id: '$jenjang',
          total_siswa: { $sum: '$jumlah_siswa' },
          siswa_negeri: {
            $sum: { $cond: [{ $eq: ['$status_sekolah', 'NEGERI'] }, '$jumlah_siswa', 0] }
          },
          siswa_swasta: {
            $sum: { $cond: [{ $eq: ['$status_sekolah', 'SWASTA'] }, '$jumlah_siswa', 0] }
          }
        }
      }],
      
      topKabupaten: [{
        $group: {
          _id: '$nama_kabupaten_kota',
          total_siswa: { $sum: '$jumlah_siswa' },
          breakdown: {
            $push: {
              jenjang: '$jenjang',
              jumlah: '$jumlah_siswa',
              status: '$status_sekolah'
            }
          }
        }
      }, {
        $sort: { total_siswa: -1 }
      }, {
        $limit: 10
      }]
    }
  }
])
```

**Penjelasan:**
- Conditional sum dengan field value: `{ $cond: [..., '$jumlah_siswa', 0] }`
- **$push** untuk detailed breakdown array
- Combined **$sort** dan **$limit** untuk top-N queries

---

### 6. Student Trends (studentController.js)

**Endpoint:** `GET /api/students/trends`

**MongoDB Query:**
```javascript
StudentStatistic.aggregate([
  { $match: matchStage },
  {
    $group: {
      _id: {
        tahun_ajaran: '$tahun_ajaran',
        jenjang: '$jenjang'
      },
      total_siswa: { $sum: '$jumlah_siswa' }
    }
  },
  { $sort: { '_id.tahun_ajaran': 1, '_id.jenjang': 1 } }
])
```

**Penjelasan:**
- Multi-field grouping (compound _id)
- Sorting pada nested fields

---

### 7. Text Search dengan Pagination (schoolController.js)

**Endpoint:** `GET /api/schools`

**MongoDB Query:**
```javascript
// Build dynamic query dengan $or operator
const query = {};
if (search) {
  query.$or = [
    { nama_sekolah: new RegExp(search, 'i') },
    { npsn: new RegExp(search, 'i') },
    { alamat_sekolah: new RegExp(search, 'i') }
  ];
}
if (jenjang) query.jenjang = jenjang.toUpperCase();
if (status_sekolah) query.status_sekolah = status_sekolah.toUpperCase();
if (kabupaten) query.nama_kabupaten_kota = new RegExp(kabupaten, 'i');

// Pagination dengan skip dan limit
const skip = (page - 1) * limit;
const schools = await School.find(query)
  .limit(parseInt(limit))
  .skip(skip)
  .sort({ nama_sekolah: 1 });
```

**Penjelasan:**
- **$or** untuk multiple field search
- **RegExp** untuk case-insensitive search
- **skip** dan **limit** untuk pagination
- Dynamic query building

---

## Performance Optimization

### Indexes yang Digunakan:

**School Collection:**
```javascript
schoolSchema.index({ jenjang: 1 });
schoolSchema.index({ status_sekolah: 1 });
schoolSchema.index({ kemendagri_nama_kecamatan: 1 });
schoolSchema.index({ nama_kabupaten_kota: 1 });
schoolSchema.index({ npsn: 1 }, { unique: true });
```

**StudentStatistic Collection:**
```javascript
studentStatisticSchema.index({ kode_kabupaten_kota: 1 });
studentStatisticSchema.index({ jenjang: 1 });
studentStatisticSchema.index({ status_sekolah: 1 });
studentStatisticSchema.index({ tahun_ajaran: 1 });
studentStatisticSchema.index({ jenjang: 1, status_sekolah: 1, tahun_ajaran: 1 });
```

---

## Summary Query Complexity

| Endpoint | Aggregation Stages | Operators Used | Complexity |
|----------|-------------------|----------------|------------|
| `/api/dashboard/stats` | $facet (6 pipelines) | $group, $cond, $lookup, $push, $addToSet, $slice | **High** |
| `/api/schools/stats` | $facet (6 pipelines) | $group, $cond, $setUnion, $round, $project | **High** |
| `/api/schools/analysis/persebaran` | $facet (3 pipelines) | $bucket, $size, $addToSet | **Medium-High** |
| `/api/schools/analysis/comparison` | 3 stages | $match, $group, $project, $divide | **Medium** |
| `/api/students/stats` | $facet (4 pipelines) | $group, $cond, $push, $sum | **Medium** |
| `/api/students/trends` | 2 stages | $group, $sort | **Low-Medium** |
| `/api/schools` (search) | 1 stage | $or, RegExp, pagination | **Low** |

---

## Kesimpulan

Sistem ini mengimplementasikan berbagai fitur MongoDB untuk Basis Data Non-Relasional:

✅ **Aggregation Pipeline** dengan multiple stages
✅ **$facet** untuk parallel pipeline execution
✅ **Conditional Operators** ($cond, $eq, $ne, dll)
✅ **Array Operators** ($push, $addToSet, $slice, $size, $setUnion)
✅ **Arithmetic Operators** ($sum, $avg, $divide, $multiply, $round)
✅ **Bucketing** untuk histogram analysis
✅ **Lookup** untuk cross-collection reference
✅ **Text Search** dengan RegExp
✅ **Pagination** dengan skip dan limit
✅ **Indexes** untuk query optimization
✅ **Dynamic Query Building** berdasarkan parameter

Total: **30+ MongoDB operators** dan **15+ aggregation stages** yang berbeda digunakan dalam sistem ini.
