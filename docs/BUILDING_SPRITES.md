# Pixel Cityscape — Building Sprite Guide

Dokumentasi lengkap gaya visual, shading, dan palette untuk seluruh sprite bangunan di `src/visual/buildings/`.

Sumber kebenaran kode:

- Palette: `src/visual/buildings/palette.ts`
- Legend & `defineSprite`: `src/visual/buildings/types.ts`
- Generator tower: `src/visual/buildings/tower.ts`
- Stage thresholds: `src/core/config.ts` → `BUILDING_STAGE_DEFS`

---

## 1. Prinsip gaya umum

| Aspek | Aturan |
|---|---|
| Medium | Pixel art 1 karakter = 1 pixel grid |
| Render | Tiap pixel → `<rect>` SVG; scale kota = **4×** |
| Siluet | Readable di ukuran kecil; proporsi membesar seiring tahap |
| Shading | Hampir selalu **pasangan light/shadow** (huruf kecil / kapital) |
| Depth | Shadow di atap (band tengah/bawah), fondasi, dan frame tepi tower |
| Transparansi | `.` = kosong (langit tembus) |
| Konsistensi | Satu palette bersama; jangan menambah warna tanpa alasan kuat |

### Legend karakter khusus

| Char | Arti | Render |
|---|---|---|
| `.` | Transparent | dilewati |
| `w` | Window | `<rect class="win">` / `win on` (warna bahasa repo saat menyala) |
| `A` | Beacon / antena | `<rect class="blink">` kuning `#ffd84a` |
| `d` | Door | warna palette `d`; jadi target pejalan kaki |
| lainnya | Solid fill | `PALETTE[ch]` |

### Pola shading (konvensi)

Pixel Cityscape memakai **dua tingkat** per material:

1. **Body / light** — huruf kecil (`r`, `k`, `t`, `c`, `m`, …)
2. **Shadow / frame** — huruf kapital pasangan (`R`, `K`, `T`, `C`, `M`, …)

Shadow dipakai untuk:

- **Atap**: pita gelap di bawah ridge / eaves
- **Fondasi**: baris paling bawah lebih gelap
- **Tepi tower**: kolom kiri–kanan + roof/base strip
- **Cerobong / aksen**: `O` lebih gelap dari `o`

Tidak ada highlight ketiga (tidak ada “rim light” terpisah). Kontras datang dari pasangan light/shadow + jendela `w`.

### Windows & lighting runtime

- Grid menyimpan `w` (unlit day blue `#8fb4d6`).
- Saat render kota, sebagian `w` diganti warna `languageColor` repo dan class `win on` (flicker) menurut `litRatio` (commits 30 hari).
- Fallback bahasa: `#c9d1d9`.
- Mode konstruksi: semua jendela tetap unlit.

---

## 2. Palette lengkap

### Material bangunan (retouch: highlight + body + shadow)

Cahaya dari **kiri atas**. Tiap material punya highlight (tepi kiri / ledge), body, dan shadow (tepi kanan / fondasi). Shadow cenderung lebih cool (biru/ungu halus).

| Key | Hex | Nama | Dipakai di |
|---|---|---|---|
| `j` | `#e6c765` | Thatch highlight | Hut — atap sisi terang |
| `r` | `#c9a24d` | Thatch (jerami) | Hut — atap |
| `R` | `#7b5636` | Thatch shadow | Hut — pita / sisi gelap atap |
| `i` | `#c99a5e` | Wood highlight | Hut, rumah kayu — tepi kiri dinding |
| `k` | `#a8794a` | Wood | Hut, rumah kayu — dinding; konstruksi timber |
| `K` | `#6b4a3a` | Wood shadow | Tepi kanan / fondasi kayu |
| `d` | `#4a3020` | Door | Semua bangunan berpintu |
| `u` | `#e07a5f` | Roof/awning highlight | Atap & kanopi sisi terang |
| `o` | `#c0504a` | Roof / awning (merah bata) | Rumah kayu atap; toko kanopi |
| `O` | `#7e3640` | Roof shadow / chimney | Atap gelap, cerobong |
| `s` | `#e6e0cf` | Stone highlight | Toko — tepi kiri |
| `t` | `#cfc8b4` | Stone | Toko batu — dinding |
| `T` | `#8d8794` | Stone shadow | Toko — tepi kanan & fondasi |
| `h` | `#b4c2d4` | Concrete highlight | Mid-rise — tepi kiri / roof ledge |
| `c` | `#8e9bb0` | Concrete | Mid-rise — dinding |
| `C` | `#56627c` | Concrete shadow / frame | Mid-rise — tepi kanan, sill, base |
| `l` | `#6c86a8` | Tower glass highlight | Skyscraper/landmark — tepi kiri, streak |
| `m` | `#3f5273` | Tower glass / body | Skyscraper, landmark |
| `M` | `#232c47` | Tower frame | Skyscraper, landmark — tepi kanan & spire |
| `B` | `#2e2a3d` | Contact shadow | Garis tanah / under eaves |
| `w` | `#8fb4d6` | Window unlit | Semua bangunan berjendela |

### Lingkungan & kendaraan (palette bersama, bukan dinding)

| Key | Hex | Nama |
|---|---|---|
| `g` | `#4f8a3a` | Foliage |
| `b` | `#6b4a2b` | Trunk |
| `y` | `#ffd84a` | Sun |
| `q` | `#ffffff` | Cloud |
| `e` | `#d94f4f` | Car body |
| `n` | `#222222` | Wheels |
| `f` | `#f4f0cf` | Moon |

### Konstruksi & builders

| Key | Hex | Nama |
|---|---|---|
| `P` | `#d0b06a` | Scaffold boards |
| `Q` | `#6b6f78` | Steel beam / rebar |
| `X` | `#f08a24` | Crane orange |
| `H` | `#ffd23f` | Hard hat |
| `V` | `#ff6a1a` | Hi-vis vest |
| `F` | `#e0b48a` | Builder skin |

---

## 3. Tahapan commit → bangunan

| Commits (12 bulan) | ID | Nama | File |
|---|---|---|---|
| 1–19 | `hut` | Gubuk | `hut.ts` |
| 20–40 | `wood-house` | Rumah kayu | `wood-house.ts` |
| 41–50 | `stone-shop` | Toko batu | `stone-shop.ts` |
| 51–99 | `midrise` | Gedung bertingkat | `midrise.ts` |
| 100–199 | `skyscraper` | Pencakar langit | `skyscraper.ts` |
| 200+ | `landmark` | Menara landmark | `landmark.ts` |

---

## 4. Detail per bangunan

### 4.1 Hut — Gubuk (`hut`)

| | |
|---|---|
| Ukuran | **12 × 8** |
| Mood | Pedesaan, material organik, rendah |
| Material utama | Jerami (`r`/`R`) + kayu (`k`) + pintu (`d`) |
| Fitur ekstra | Tidak ada smoke/flag/beacon |

**Struktur vertikal (atas → bawah)**

1. Atap jerami melengkung/bertingkat (`r`), melebar ke bawah
2. Pita bayangan atap (`R`) di ridge bawah
3. Badan kayu (`k`) 4 baris
4. Jendela `w` di kiri; pintu `dd` di kanan-bawah

**Shading**

- Atap: light `r` di crest, shadow `R` di seam atap–dinding
- Dinding: flat `k` (tidak ada `K` di hut) — kedalaman dari atap saja
- Pintu gelap `d` sebagai aksen terkuat di kaki bangunan

**Gaya**

- Siluet “mound + box”: atap lebih lebar dari badan
- Padding `.` kiri/kanan agar atap tidak full-bleed

```
....rrrr....
..rrrrrrrr..
.rrrrrrrrrr.
rrrRRRRRRrrr
.kkkkkkkkkk.
.kkwwkkkkkk.
.kkwwkkddkk.
.kkkkkkddkk.
```

---

### 4.2 Wood house — Rumah kayu (`wood-house`)

| | |
|---|---|
| Ukuran | **14 × 9** |
| Mood | Rumah tinggal, atap genteng merah, cerobong |
| Material | Atap `o`/`O`, dinding `k`, fondasi `K`, pintu `d` |
| Fitur ekstra | `smokeX: 10` — asap cerobong saat streak aktif |

**Struktur**

1. Atap pelana merah (`o`) + cerobong `OO` di kanan
2. Eaves / bayangan atap full-width (`O`)
3. Badan kayu 4 baris dengan 2 pasangan jendela `ww`
4. Pintu tengah `dd`
5. Fondasi gelap `K`

**Shading**

- Atap: `o` body, `O` untuk underslope + chimney (shadow material yang sama keluarga)
- Dinding: `k` body
- Fondasi: `K` full strip — bangunan “duduk” di tanah
- Simetri jendela kiri/kanan, pintu center-weighted

**Gaya**

- Lebih “rumah” dari hut: atap merah tegas, proporsi lebih lebar
- Cerobong jadi vertical accent di kanan atas

---

### 4.3 Stone shop — Toko batu (`stone-shop`)

| | |
|---|---|
| Ukuran | **16 × 10** |
| Mood | Komersial 2 lantai, kanopi toko |
| Material | Batu `t`/`T`, atap/kanopi `o`/`O`, pintu `d` |
| Fitur ekstra | — |

**Struktur**

1. Atap datar gelap `O` (2 baris, sedikit inset)
2. Lantai atas batu `t` + 3 jendela `ww`
3. Kanopi merah `o` full (awning)
4. Lantai bawah: etalase `www` + pintu `dd` + aksen `T`
5. Fondasi `T`

**Shading**

- Atap/kanopi: `O` (gelap) di atap, `o` (lebih terang) di awning — awning “lebih hidup”
- Batu: `t` body, `T` fondasi + satu kolom aksen kanan bawah
- Kursus batu horizontal terbaca dari baris solid vs baris berjendela

**Gaya**

- Lebar (16) → kesan ruko
- Awning membagi jelas lantai atas / bawah
- Etalase lebar di ground floor

---

### 4.4 Mid-rise — Gedung bertingkat (`midrise`)

| | |
|---|---|
| Ukuran | **14 × 28** (`makeTowerRows(14, 26, "c", "C")`) |
| Mood | Kantor/apartemen beton modern |
| Material | Concrete `c`, frame `C`, pintu `d`, jendela `w` |
| Fitur ekstra | `flag: true` — bendera atap saat streak |

**Generator** (`tower.ts`)

- Roof strip: `C` full width
- Body 26 baris: tepi `C`, isi `c`, jendela 2-baris di kolom ganjil setiap 4 baris
- Door 2 kolom di 2 baris terbawah body
- Base strip: `C` full width

**Shading**

- Frame gelap `C` = outline + roof + base (membaca sebagai struktur)
- Fill `c` lebih terang = slab beton
- Tidak ada glass biru — mid-rise terasa “masonry/concrete”, bukan curtain wall

**Gaya**

- Kotak tegak, ritme jendela teratur
- Proporsi lebih gemuk dari skyscraper (14 vs 12 lebar, body lebih pendek)

---

### 4.5 Skyscraper — Pencakar langit (`skyscraper`)

| | |
|---|---|
| Ukuran | **12 × 46** (`makeTowerRows(12, 40, "m", "M", true)`) |
| Mood | Tower kaca gelap, antena |
| Material | Glass body `m`, frame `M`, door `d`, beacon `A` |
| Fitur ekstra | Antena 4 baris + `A` berkedip di puncak |

**Generator**

- Antenna: kolom tengah, tip `A`, batang `M`
- Sama seperti mid-rise tapi wall=`m`, frame=`M`, bodyHeight=40

**Shading**

- `M` hampir navy — frame tegas di siluet sempit
- `m` biru-abu — “glass” tanpa highlight specular
- Kontras jendela `w` lebih kuat di body gelap daripada di concrete mid-rise

**Gaya**

- Lebih ramping & tinggi dari mid-rise
- Beacon memberi life di skyline malam

---

### 4.6 Landmark — Menara landmark (`landmark`)

| | |
|---|---|
| Ukuran | **16 × 87** |
| Mood | Supertall tapering, spire, tier mengecil ke atas |
| Material | Sama keluarga tower: `m`/`M`/`w`/`d`/`A` |
| Fitur ekstra | Spire + banyak tier centered |

**Struktur**

1. **Needle**: `A` lalu batang `M` (1→3 kolom)
2. **Tiers** (lebar 4→14): tiap tier punya cap `M` + body berjendela; tepi selalu `M`
3. **Base** full 16: entrance `dd` di tengah, windows di baris atas base

**Shading**

- Frame `M` di tepi tiap tier + cap = “steel outline”
- Fill `m` di dalam = glass mass
- Padding `.` di kiri/kanan tier atas → siluet meruncing
- Spire `A` = satu-satunya beacon animasi di puncak

**Gaya**

- Satu-satunya bangunan non-rectangular massing
- Grid fixed width 16; centering via transparent pad
- Jendela: kolom ganjil, skip setiap baris ke-3 di dalam tier (`i % 3 !== 2`)

---

## 5. Perbandingan visual cepat

| Stage | W×H | Palette inti | Shadow strategy | Signature |
|---|---|---|---|---|
| Hut | 12×8 | `r R k d w` | Atap `R` saja | Jerami mound |
| Wood house | 14×9 | `o O k K d w` | Eaves `O` + base `K` | Cerobong + asap |
| Stone shop | 16×10 | `t T o O d w` | Atap `O` + base `T` | Awning merah |
| Mid-rise | 14×28 | `c C d w` | Frame `C` roof/edges/base | Bendera atap |
| Skyscraper | 12×46 | `m M d w A` | Frame `M` + antena | Beacon blink |
| Landmark | 16×87 | `m M d w A` | Frame per-tier + spire | Taper + needle |

---

## 6. Under construction (ringkas)

Saat progress ≥ 70% menuju tahap berikutnya, sprite **target berikutnya** digambar dalam bentuk konstruksi (`src/visual/construction.ts`):

| Phase | Progress | Built height (approx) |
|---|---|---|
| 0 | 70–79% | ~35% dari bawah |
| 1 | 80–89% | ~60% |
| 2 | 90–99% | ~85% (+ atap/awning/spire sesuai override) |

- Bagian terbangun: facade finished, jendela **tidak** menyala
- Bagian atas: skeleton (`Q` / timber `k`) dalam siluet
- Scaffold: `P` (poles + planks, tidak menutupi `w`/`d`)
- Crane (mid-rise+): mast `X`, jib `Q`, beacon opsional `A`, hook SVG class `hook`
- Builders: `H`/`V`/`F` via `src/visual/builders.ts`

Hut tidak punya fase konstruksi (tidak ada bangunan sebelum hut). Landmark tidak punya konstruksi setelahnya.

---

## 7. Aturan menjaga gaya saat menambah sprite

1. Pakai pasangan light/shadow yang sudah ada; jangan menambah hue baru kecuali material baru benar-benar perlu.
2. Jaga lebar tetap; tinggi boleh naik seiring tahap.
3. Selalu sediakan `d` (pintu) jika pejalan kaki harus masuk.
4. `w` hanya untuk jendela yang boleh di-light runtime.
5. `A` hanya untuk beacon yang boleh blink.
6. Validasi dengan `defineSprite` (semua baris sama lebar).
7. Preview: `/v1/preview/building/{id}.svg` atau LinkedIn sheet `npm run linkedin-sheet`.

---

## 8. File terkait

```
src/visual/buildings/
  palette.ts      # semua warna
  types.ts        # legend + defineSprite
  tower.ts        # generator mid-rise & skyscraper
  hut.ts
  wood-house.ts
  stone-shop.ts
  midrise.ts
  skyscraper.ts
  landmark.ts
  index.ts        # BUILDINGS, BUILDING_BY_ID
src/visual/construction.ts
src/visual/builders.ts
```
