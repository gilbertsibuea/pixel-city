# PRD — Kota Pixel: Dynamic SVG API

**Versi:** 2.0  
**Tanggal:** 2 November 2026  
**Status:** Draft untuk implementasi MVP  
**Produk:** Kota Pixel  
**Platform target:** GitHub Profile README  
**Model distribusi MVP:** Public HTTP API yang menghasilkan SVG secara dinamis

---

## 1. Ringkasan Produk

Kota Pixel adalah layanan yang menghasilkan gambar SVG kota pixel-art berdasarkan aktivitas publik GitHub seorang developer. Setiap repository ditampilkan sebagai bangunan. Aktivitas commit menentukan tahap bangunan, bahasa pemrograman memengaruhi warna jendela, dan aktivitas lain ditampilkan melalui elemen kota seperti lampu, asap cerobong, mobil, dan pohon.

Pada versi produk baru, Kota Pixel **tidak mengharuskan pengguna memasang GitHub Actions, menjalankan script, atau melakukan deployment sendiri**. Pengguna cukup menambahkan satu URL gambar ke `README.md` profil GitHub.

Contoh pemasangan:

```markdown
![Kota Pixel](https://<API-DOMAIN>/v1/city/<GITHUB_USERNAME>.svg)
```

Saat gambar diminta, API Kota Pixel mengambil atau membaca cache statistik publik GitHub, memetakan statistik tersebut ke model kota, lalu mengembalikan SVG.

### Perubahan utama dari PRD sebelumnya

| Aspek | PRD sebelumnya | PRD baru |
|---|---|---|
| Cara menjalankan | GitHub Actions di repository pengguna | API ter-host milik Kota Pixel |
| Cara memasang | Menyalin workflow dan Markdown | Satu baris Markdown |
| Output | `city.svg` di-commit ke repository pengguna | SVG dikirim sebagai HTTP response |
| Penjadwalan | Cron GitHub Actions | On-demand dengan cache; tidak membutuhkan scheduler untuk MVP |
| Data GitHub | `GITHUB_TOKEN` milik workflow pengguna | Token layanan Kota Pixel untuk membaca data publik |
| Hosting | Tidak ada backend | Cloudflare Workers + Workers KV/cache |
| Pengguna perlu mengelola token | Tidak untuk public repo | Tidak; token layanan dikelola oleh operator Kota Pixel |

---

## 2. Visi dan Masalah Pengguna

### Visi

Membuat developer dapat menampilkan representasi visual aktivitas GitHub mereka tanpa perlu mengatur workflow, server, atau proses build.

### Masalah yang diselesaikan

Saat ini, developer yang ingin menampilkan visualisasi aktivitas GitHub di README sering harus memasang workflow, mengatur token, atau meng-host hasil gambar sendiri. Proses tersebut menambah hambatan, terutama bagi pengguna yang hanya ingin memasang satu visual di profil.

Kota Pixel mengurangi proses tersebut menjadi satu tindakan: menempelkan URL gambar.

### Prinsip produk

1. **One-line installation:** pengguna cukup menambahkan satu baris Markdown.
2. **No user-side automation:** pengguna tidak perlu GitHub Actions, cron, server, atau CLI.
3. **Public-data-only MVP:** hanya membaca data GitHub yang tersedia secara publik.
4. **Design-first continuity:** desain kota yang sudah ada dipertahankan; pekerjaan MVP adalah mengintegrasikan desain tersebut ke generator API, bukan membuat desain baru.
5. **Cache by default:** request gambar tidak boleh selalu menghasilkan request baru ke GitHub GraphQL API.
6. **Graceful degradation:** ketika GitHub API bermasalah, Kota Pixel sebisa mungkin menampilkan hasil cache terakhir.

---

## 3. Tujuan dan Non-Tujuan

### 3.1 Tujuan MVP

- Menyediakan endpoint HTTP `GET` yang menghasilkan SVG untuk username GitHub.
- Memungkinkan pengguna memasang gambar melalui satu baris Markdown.
- Mengambil statistik repository dan kontribusi publik GitHub.
- Menggunakan desain pixel-art yang sudah tersedia dalam prototipe.
- Mendukung maksimal 18 bangunan/repository.
- Mendukung tema otomatis siang/malam melalui `prefers-color-scheme`, sepanjang kompatibel dengan renderer GitHub.
- Menyimpan cache data GitHub dan/atau hasil SVG untuk mengurangi pemanggilan API eksternal.
- Menghasilkan SVG valid, aman, deterministik, dan berukuran di bawah 100 KB.
- Menyediakan respons fallback ketika data belum tersedia atau GitHub API mengalami gangguan.
- Menyediakan dokumentasi pemasangan yang dapat dipahami tanpa pengetahuan teknis mendalam.

### 3.2 Non-tujuan MVP

- Tidak membuat dashboard, editor visual, atau akun pengguna.
- Tidak membaca source code atau isi file repository.
- Tidak mengakses repository privat atau kontribusi privat.
- Tidak meminta pengguna memberikan Personal Access Token.
- Tidak mendukung GitLab atau Bitbucket.
- Tidak menyediakan tema visual baru. Tema dan sprite yang sudah ada menjadi baseline.
- Tidak menjanjikan pembaruan real-time; data diperbarui sesuai kebijakan cache.
- Tidak membutuhkan GitHub Actions di repository pengguna.
- Tidak menyediakan GitHub App installation atau OAuth flow pada MVP.
- Tidak menjanjikan bahwa animasi pasti berjalan di semua tampilan README GitHub; kompatibilitas harus dibuktikan melalui pengujian.

---

## 4. Target Pengguna dan User Stories

### Target pengguna utama

Developer yang memiliki akun GitHub dan ingin mempercantik profile README menggunakan visualisasi aktivitas repository.

### User stories

- Sebagai developer, saya ingin menambahkan kota pixel ke README hanya dengan satu baris Markdown.
- Sebagai developer, saya ingin kota saya merepresentasikan repository publik yang paling aktif.
- Sebagai developer, saya ingin kota tetap tampil meskipun GitHub API sedang mengalami gangguan sementara.
- Sebagai pengunjung profil, saya ingin memahami repository dan aktivitas developer melalui visual kota.
- Sebagai pengguna mode gelap, saya ingin kota menyesuaikan tampilan siang/malam jika renderer mendukungnya.

---

## 5. Spesifikasi Visual yang Dipertahankan

**Bagian ini bukan brief redesign.** Sprite grid, bentuk bangunan, palet warna, susunan kota, keyframe animasi, dan karakter visual yang sudah ada pada prototipe harus digunakan kembali. Implementasi baru perlu memindahkan atau membungkus desain tersebut agar dapat menghasilkan string SVG di runtime API.

Jika prototipe memiliki file atau modul visual yang sudah bekerja, modul tersebut menjadi sumber utama. Jangan mengganti visual dengan desain baru tanpa keputusan produk terpisah.

### 5.1 Pemetaan data ke elemen visual

| Data GitHub | Elemen visual | Ketentuan MVP |
|---|---|---|
| Repository publik milik pengguna | Satu bangunan per repository | Maksimal 18 repository teratas berdasarkan jumlah kontribusi commit pengguna pada periode data |
| Jumlah commit kontribusi pengguna dalam 12 bulan terakhir | Tahap bangunan | 1–19: gubuk; 20–99: rumah kayu; 100–299: toko batu; 300–799: gedung bertingkat; 800+: pencakar langit |
| Bahasa utama repository | Warna jendela | Menggunakan warna bahasa dari metadata GitHub; fallback ke warna netral jika bahasa tidak tersedia |
| Commit dalam 30 hari terakhir | Persentase/intensitas jendela menyala | Mengikuti rumus visual pada prototipe; jika rumus belum ditentukan, tetapkan dan uji sebelum renderer dinyatakan selesai |
| Aktivitas harian beruntun minimal 7 hari | Asap cerobong dan bendera aktif | Streak dihitung dari kalender kontribusi publik yang tersedia |
| Pull request yang di-merge dalam 30 hari terakhir | Mobil di jalan | Maksimal 3 mobil; hanya PR yang benar-benar merged, bukan sekadar dibuat atau dibuka |
| Total stars repository publik | Pohon di tepi kota | Maksimal 6 pohon; jumlah stars dihitung dari repository publik yang termasuk dalam cakupan agregasi MVP |
| Preferensi warna pembaca | Siang/malam | Menggunakan `prefers-color-scheme` jika didukung oleh konteks gambar GitHub |

### 5.2 Animasi yang dipertahankan

- Matahari bergerak.
- Awan melayang.
- Jendela berkedip.
- Antena berkedip.
- Mobil bergerak melewati jalan.
- Pohon bergoyang.
- Gerakan menggunakan timing patah-patah/stepped agar tetap terasa seperti pixel art.
- Animasi menghormati `prefers-reduced-motion`.

### 5.3 Kompatibilitas GitHub README — risiko desain yang wajib diuji

GitHub mendokumentasikan dukungan tampilan SVG, tetapi menyatakan bahwa SVG yang dilihat di GitHub saat ini tidak mendukung inline scripting atau animasi. Oleh karena itu:

- SVG wajib tetap terlihat baik dalam keadaan statis.
- Jangan mengandalkan JavaScript, `<script>`, external image, external font, atau resource eksternal.
- CSS animation boleh tetap ada dalam output jika sesuai dengan desain prototipe, tetapi animasi tidak boleh menjadi syarat agar informasi utama dapat dipahami.
- Lakukan proof-of-concept dengan URL API sungguhan yang ditanam di profile README GitHub.
- Uji tampilan pada GitHub web, mode terang/gelap, serta browser utama.
- Jika animasi tidak berjalan pada README, rilis MVP tetap dapat menampilkan city art statis; keputusan format animasi alternatif (misalnya GIF) berada di luar MVP dan memerlukan evaluasi tersendiri.

---

## 6. Pengalaman Pengguna

### 6.1 Alur pemasangan

1. Pengguna membuka dokumentasi Kota Pixel.
2. Pengguna memasukkan username GitHub pada contoh URL atau menyalin Markdown dengan mengganti placeholder username.
3. Pengguna menempelkan Markdown ke profile `README.md` (`username/username`).
4. Pengguna menyimpan perubahan.
5. GitHub meminta SVG dari endpoint Kota Pixel dan menampilkan gambar di README.

### 6.2 Contoh Markdown

```markdown
![Kota Pixel](https://<API-DOMAIN>/v1/city/gilbertsibuea.svg)
```

### 6.3 Prinsip UX

- Tidak ada setup token di sisi pengguna.
- Tidak ada konfigurasi wajib selain username.
- Pengguna tidak perlu mengerti GraphQL, Cloudflare, atau proses rendering.
- URL stabil agar pengguna tidak perlu mengubah README saat ada update internal.
- Dokumentasi menjelaskan bahwa data dapat tertunda karena cache dan proxy gambar GitHub.

---

## 7. API Contract

### 7.1 Endpoint utama

```http
GET /v1/city/{username}.svg
```

Contoh:

```http
GET /v1/city/gilbertsibuea.svg
```

### 7.2 Query parameters

| Parameter | Tipe | Default | Ketentuan |
|---|---|---|---|
| `limit` | integer | `18` | Jumlah bangunan, rentang 1–18 |
| `theme` | `auto`, `light`, `dark` | `auto` | `auto` menggunakan `prefers-color-scheme`; `light`/`dark` memaksa tema jika didukung renderer |

Parameter kustomisasi lain tidak termasuk MVP. Jangan menambahkan parameter untuk mengubah sprite/palet sebelum fitur konfigurasi produk dirancang.

### 7.3 Respons sukses

- Status: `200 OK`
- `Content-Type: image/svg+xml; charset=utf-8`
- `Cache-Control` disetel sesuai kebijakan cache API.
- `ETag` dapat disediakan untuk membantu validasi cache.
- Body berisi SVG lengkap, bukan HTML dan bukan JSON.

### 7.4 Respons error dan fallback

| Kondisi | Perilaku |
|---|---|
| Username kosong/tidak valid | `400 Bad Request` dengan pesan ringkas atau SVG fallback yang aman |
| User GitHub tidak ditemukan | `404 Not Found` dengan SVG fallback sederhana |
| GitHub API rate limit/temporarily unavailable | Sajikan cache terakhir jika tersedia; jika tidak, `503 Service Unavailable` dengan SVG fallback |
| Data belum memiliki repository/kontribusi | Hasilkan kota minimal yang rapi; jangan gagal hanya karena data kosong |
| Parameter `limit` di luar rentang | `400 Bad Request` atau normalisasi ke batas yang diizinkan; perilaku harus konsisten dan didokumentasikan |

Untuk endpoint gambar yang dipasang di README, fallback SVG lebih baik daripada HTML error page. Status HTTP tetap harus mencerminkan kondisi yang tepat jika memungkinkan.

### 7.5 Validasi input

- Terima username GitHub yang sesuai aturan username GitHub.
- Normalisasi username untuk cache key tanpa mengubah identitas yang dikirim ke GitHub.
- Tolak parameter tak dikenal yang berisiko atau terlalu panjang.
- Tidak menerima URL arbitrer atau path filesystem dari request.
- Seluruh teks dinamis yang dimasukkan ke SVG harus di-escape.

---

## 8. Arsitektur Teknis

### 8.1 Arsitektur tingkat tinggi

```text
GitHub Profile README
        |
        | GET image URL
        v
Cloudflare Workers — HTTP API
        |
        +---- Validate username and query parameters
        |
        +---- Check edge response cache
        |
        +---- Check Workers KV data cache
        |          |
        |          +---- Cache hit: load normalized GitHub metrics
        |          |
        |          +---- Cache miss/expired: query GitHub GraphQL API
        |
        +---- Map metrics to City Model
        |
        +---- Existing Pixel Art / Sprite Renderer
        |
        v
SVG Response (image/svg+xml)
```

MVP berjalan secara on-demand. Cron Trigger bukan komponen wajib karena data diperbarui ketika endpoint diminta setelah cache kedaluwarsa.

### 8.2 Komponen utama

| Komponen | Tanggung jawab |
|---|---|
| HTTP Router | Mem-parsing path, username, dan query parameter |
| GitHub GraphQL Client | Mengirim query ke `https://api.github.com/graphql`, menangani timeout, error, serta rate limit |
| Repository Data Mapper | Menormalisasi data GitHub menjadi `RepositoryMetric` |
| Contribution Aggregator | Menghitung commit 12 bulan, commit 30 hari, streak, dan merged PR 30 hari |
| City Mapper | Mengubah statistik menjadi level bangunan, lampu, mobil, pohon, dan status aktivitas |
| Existing Sprite/Palette Module | Menyediakan sprite, warna, dan asset visual dari prototipe yang sudah ada |
| SVG Renderer | Menghasilkan SVG string yang aman, deterministik, dan sesuai batas ukuran |
| Cache Adapter | Menyimpan data ter-normalisasi dan/atau respons SVG |
| Error/Fallback Renderer | Menghasilkan gambar fallback ketika data tidak tersedia |

### 8.3 Struktur codebase yang diusulkan

```text
pixel-city/
├── src/
│   ├── worker/
│   │   └── index.ts              # Cloudflare Worker entry point
│   ├── api/
│   │   ├── router.ts             # Endpoint and request validation
│   │   └── response.ts           # SVG and HTTP response headers
│   ├── github/
│   │   ├── client.ts             # GraphQL HTTP client
│   │   ├── queries.ts            # GraphQL query documents
│   │   ├── repository.ts         # Repository data extraction
│   │   └── contributions.ts      # Contribution and merged PR aggregation
│   ├── core/
│   │   ├── types.ts              # Normalized domain types
│   │   ├── map.ts                # Metrics -> City Model
│   │   └── config.ts             # Server-side defaults and thresholds
│   ├── visual/                   # Existing design assets; reuse, do not redesign
│   │   ├── sprites.ts
│   │   ├── palette.ts
│   │   └── animations.ts         # If separated in the existing prototype
│   ├── renderer/
│   │   ├── render.ts             # City Model -> SVG string
│   │   └── escape.ts             # XML escaping utilities
│   ├── cache/
│   │   ├── kv.ts                 # Workers KV adapter
│   │   └── keys.ts               # Stable cache key generation
│   └── fallback/
│       └── renderFallback.ts
├── tests/
│   ├── api.test.ts
│   ├── github-mapper.test.ts
│   ├── city-map.test.ts
│   ├── renderer.test.ts
│   └── fixtures/
├── public/
│   └── preview.svg               # Optional local/demo preview
├── wrangler.jsonc
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .dev.vars.example
├── .gitignore
└── README.md
```

Nama dan pembagian file dapat disesuaikan ketika mengintegrasikan prototipe yang ada, tetapi batas tanggung jawab antarkomponen harus dipertahankan.

---

## 9. Data GitHub dan Aturan Agregasi

### 9.1 Cakupan data MVP

- Hanya data publik.
- Repository yang dimiliki user dan dapat diakses secara publik.
- Kontribusi privat tidak dihitung.
- Tidak membaca isi source code.
- Jika bahasa utama tidak tersedia, gunakan warna fallback.

### 9.2 Data yang diperlukan

| Data | Sumber/strategi |
|---|---|
| Username dan keberadaan user | GitHub GraphQL `user(login: ...)` |
| Repository | Repository publik milik user |
| Primary language dan language color | Metadata `primaryLanguage` repository |
| Stars | `stargazerCount` repository |
| Commit kontribusi per repository | `contributionsCollection.commitContributionsByRepository` |
| Commit 30 hari | Kontribusi commit berdasarkan tanggal dalam jendela 30 hari |
| Streak | `contributionCalendar` untuk hari-hari yang tersedia |
| Merged PR 30 hari | Pull request publik yang authored oleh user dan memiliki `mergedAt` dalam 30 hari terakhir |

### 9.3 Definisi periode

- **Commit untuk level bangunan:** 12 bulan terakhir pada MVP. Ini bukan klaim jumlah commit seumur hidup repository.
- **Commit untuk jendela:** 30 hari terakhir.
- **Streak:** jumlah hari kontribusi beruntun yang berakhir pada tanggal evaluasi; indikator aktif menyala saat minimal 7 hari.
- **Merged PR:** PR yang benar-benar memiliki status merged dan waktu merge berada pada 30 hari terakhir.
- **Stars:** total stars dari repository publik dalam cakupan agregasi yang ditentukan. Cakupan agregasi wajib konsisten dan didokumentasikan; jumlah pohon dibatasi maksimal enam.

### 9.4 Catatan akurasi

GitHub contribution data bukan selalu identik dengan seluruh commit yang ada pada repository. Kota Pixel harus menyebut angka tersebut sebagai kontribusi commit pengguna, bukan total commit proyek. Kontribusi privat tidak termasuk dalam MVP.

Query GraphQL wajib meminta field minimum yang dibutuhkan, membatasi jumlah node, menggunakan pagination saat diperlukan, dan membaca metadata rate limit. Implementasi tidak boleh melakukan query satu-per-satu untuk setiap bangunan apabila satu query terencana dapat mengambil data yang sama.

### 9.5 Token dan autentikasi GitHub

GraphQL API memerlukan autentikasi. Untuk MVP one-line installation:

- Gunakan token layanan milik operator Kota Pixel untuk membaca data publik.
- Utamakan fine-grained Personal Access Token dengan akses minimum yang diperlukan untuk public data.
- Simpan token sebagai Cloudflare Worker Secret; jangan pernah commit ke repository atau mengembalikannya ke client.
- Jangan meminta token dari pengguna.
- Jangan meminta izin untuk repository privat pada MVP.
- Pantau penggunaan rate limit karena token layanan dipakai bersama oleh seluruh pengguna API.
- Siapkan rotasi token dan prosedur jika token bocor atau dicabut.

Jika kebutuhan akses privat muncul setelah MVP, desain autentikasi perlu ditinjau ulang menggunakan GitHub App/OAuth dan persetujuan eksplisit pengguna. Fitur tersebut tidak boleh ditambahkan diam-diam.

---

## 10. Strategi Cache dan Rate Limit

Cache adalah bagian inti desain, bukan optimasi tambahan.

### 10.1 Lapisan cache

1. **Edge response cache:** menyimpan SVG final berdasarkan username dan parameter visual. Cache hit seharusnya dapat menghindari eksekusi Worker dan pemanggilan GitHub API.
2. **Workers KV:** menyimpan normalized GitHub metrics agar beberapa request dari lokasi edge berbeda tidak harus mengambil data GitHub setiap kali.
3. **Stale fallback:** jika refresh GitHub gagal, sajikan hasil valid terakhir selama masih tersedia dan tandai secara internal untuk observability.

### 10.2 TTL awal untuk MVP

| Jenis cache | TTL awal | Catatan |
|---|---:|---|
| Normalized GitHub metrics di KV | 6 jam | Dapat diubah setelah melihat pola penggunaan |
| SVG edge cache | 1 jam | Sesuaikan dengan perilaku cache image GitHub |
| Stale fallback | Sampai 24 jam setelah TTL normal | Hanya digunakan saat refresh gagal |

Nilai TTL tersebut adalah konfigurasi awal, bukan janji refresh real-time. GitHub atau perantara gambar dapat menyimpan salinan gambar lebih lama dari TTL internal API.

### 10.3 Cache key

Cache key minimum mencakup:

- versi renderer/schema;
- username yang sudah dinormalisasi;
- `limit`;
- `theme` jika memengaruhi SVG final.

Contoh konseptual: `city:v1:gilbertsibuea:limit18:theme-auto`.

Perubahan pada sprite atau renderer harus menaikkan versi cache agar hasil lama tidak terus dipakai.

### 10.4 Rate limit dan perlindungan upstream

- Cache sebelum memanggil GitHub GraphQL.
- Terapkan timeout dan retry terbatas dengan exponential backoff.
- Hormati `Retry-After` dan informasi reset rate limit dari GitHub.
- Jangan retry berulang ketika rate limit habis.
- Batasi request per IP/username untuk mencegah abuse.
- Batasi concurrency dan hindari request GraphQL paralel yang tidak perlu.
- Catat rate-limit remaining dan jumlah cache hit/miss tanpa menyimpan token.

---

## 11. Keamanan, Privasi, dan Penyalahgunaan

- Data yang diambil dan ditampilkan pada MVP harus publik.
- Tidak ada token GitHub pengguna.
- Token layanan hanya berada di secret store Cloudflare.
- Jangan mencatat token, Authorization header, atau data sensitif ke log.
- Username dan nama repository harus di-escape sebelum dimasukkan ke SVG.
- SVG tidak boleh mengandung `<script>`, event handler JavaScript, `foreignObject`, atau URL eksternal.
- Jangan menerima SVG markup, HTML, atau URL eksternal dari query parameter.
- Terapkan rate limiting, validasi input, dan batas panjang query.
- Endpoint gambar hanya memerlukan `GET` dan boleh mendukung `HEAD`.
- Hindari menyimpan data GitHub yang tidak diperlukan untuk menghasilkan kota.

---

## 12. Kebutuhan Non-Fungsional

| Area | Target MVP |
|---|---|
| Format output | SVG valid dengan MIME type `image/svg+xml` |
| Ukuran SVG | Di bawah 100 KB |
| Beban CPU Worker | Diupayakan tetap dalam batas Cloudflare Workers Free; diukur dengan benchmark nyata |
| Cache hit latency | Target p95 di bawah 500 ms; divalidasi saat uji deployment |
| Cold generation latency | Target p95 di bawah 3 detik; bergantung pada GitHub API dan harus diukur |
| Deterministik | Data dan konfigurasi sama menghasilkan SVG yang sama, kecuali timestamp metadata yang memang diperlukan |
| Aksesibilitas | SVG memiliki `<title>` dan `<desc>` atau label aksesibel yang setara |
| Motion | CSS motion menghormati `prefers-reduced-motion`; tampilan statis tetap utuh |
| Kompatibilitas | SVG tampil pada GitHub profile README; animasi diuji terpisah |
| Ketahanan | Cache terakhir dapat disajikan ketika upstream sedang gagal |
| Observability | Log error, latensi, cache hit/miss, dan rate-limit status tersedia tanpa secret |

### Catatan kapasitas Cloudflare

Batas Cloudflare Workers dapat berubah. Pada pemeriksaan dokumentasi tanggal 2 November 2026, Workers Free mencantumkan 100.000 request per hari, CPU time 10 ms untuk HTTP request, dan memori 128 MB. Angka ini harus diverifikasi kembali sebelum rilis dan dipantau setelah deployment. Kesesuaian generator terhadap batas CPU harus dibuktikan melalui pengujian, bukan diasumsikan.

---

## 13. Kriteria Penerimaan MVP

MVP dinyatakan siap rilis ketika seluruh kondisi berikut terpenuhi:

### API dan onboarding
- [ ] Endpoint menerima username valid dan mengembalikan SVG.
- [ ] Pengguna dapat memasang hasil melalui satu baris Markdown.
- [ ] Tidak diperlukan GitHub Actions atau token di repository pengguna.
- [ ] Dokumentasi menjelaskan cara memasang dan batas data publik.

### Data dan mapping
- [ ] Maksimal 18 repository ditampilkan.
- [ ] Repository diurutkan berdasarkan kontribusi commit pengguna sesuai definisi periode.
- [ ] Ambang level bangunan sesuai spesifikasi visual.
- [ ] Jendela memakai warna bahasa utama dan menanggapi aktivitas 30 hari.
- [ ] Streak minimal 7 hari mengaktifkan efek yang ditentukan desain.
- [ ] Hanya merged PR 30 hari yang memengaruhi jumlah mobil.
- [ ] Stars memengaruhi pohon dengan batas maksimal enam.
- [ ] Akun tanpa repository tetap menghasilkan kota minimal yang rapi.

### Visual dan SVG
- [ ] Sprite, palet, dan keyframe berasal dari desain/prototipe yang sudah tersedia.
- [ ] SVG kurang dari 100 KB.
- [ ] SVG tidak membutuhkan JavaScript atau resource eksternal.
- [ ] Teks dinamis aman dari XML injection.
- [ ] Mode statis terlihat baik di GitHub README.
- [ ] `prefers-reduced-motion` tidak menghilangkan informasi utama.
- [ ] Animasi diuji pada README GitHub; hasil dan batas dukungannya didokumentasikan.

### Cache, rate limit, dan reliability
- [ ] Cache hit tidak memanggil GitHub GraphQL API.
- [ ] Cache miss mengambil data dan menyimpan normalized result.
- [ ] Saat upstream gagal, stale cache digunakan jika tersedia.
- [ ] Rate limit GitHub ditangani tanpa retry loop.
- [ ] Token layanan tidak muncul pada response atau log.
- [ ] Rate limiting dan batas input diuji.

---

## 14. Strategi Pengujian

### Unit test

- Ambang commit ke level bangunan.
- Sorting dan batas maksimal 18 repository.
- Filtering repository yang tidak eligible.
- Perhitungan commit 30 hari.
- Perhitungan streak 7 hari.
- Hanya merged PR dalam rentang tanggal yang dihitung.
- Batas maksimal tiga mobil dan enam pohon.
- Escaping XML untuk username/repository dengan karakter khusus.
- Output SVG deterministik dan valid.

### Integration test

- GitHub GraphQL client dengan mock response.
- Respons GraphQL parsial atau error.
- Rate limit habis dan header retry.
- Cache miss, hit, expired, dan stale fallback.
- Username tidak ditemukan.
- User dengan nol repository publik.

### Acceptance/browser test

- Deploy endpoint test ke Cloudflare Worker.
- Pasang URL SVG pada repository profile README uji.
- Periksa hasil pada GitHub web dan browser utama.
- Uji mode terang dan gelap.
- Uji tampilan ketika animasi tidak dijalankan.
- Uji `prefers-reduced-motion` pada renderer yang mendukungnya.

---

## 15. Tahapan Implementasi

| Tahap | Pekerjaan | Hasil |
|---|---|---|
| 0. Design integration check | Inventarisasi file sprite, palet, grid, dan animasi dari prototipe yang sudah ada | Daftar asset dan kontrak renderer; tanpa redesign |
| 1. Core engine | Buat domain types, City Model, mapper, dan renderer yang mengonsumsi asset existing | SVG dari data dummy |
| 2. GitHub data layer | Buat GraphQL client dan normalisasi data publik | City Metrics dari GitHub |
| 3. Contribution calculations | Implementasi commit window, streak, merged PR, stars | Data mapping teruji |
| 4. HTTP API | Implementasi route `/v1/city/{username}.svg` dan validasi parameter | Endpoint lokal/dev |
| 5. Cloudflare deployment | Konfigurasi Worker, secret, dan KV binding | API staging |
| 6. Cache and resilience | Edge cache, KV TTL, stale fallback, rate limiting | Endpoint tahan terhadap request berulang dan upstream failure |
| 7. GitHub README compatibility | Uji gambar sungguhan pada profile README | Keputusan kompatibilitas SVG/animasi |
| 8. Public MVP | Dokumentasi, contoh Markdown, monitoring, dan release | Kota Pixel dapat dipasang publik |

### Prioritas belajar/pengerjaan

Urutan implementasi sebaiknya tidak dimulai dari Cloudflare. Pastikan renderer dapat menerima City Model dan menghasilkan SVG dari data dummy. Setelah itu baru hubungkan GitHub GraphQL, lalu bungkus generator dengan Worker API. Dengan urutan ini, visual engine tetap bisa dijalankan dan dites secara lokal.

---

## 16. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Token layanan memiliki rate limit bersama | Banyak pengguna dapat menghabiskan kuota API | Cache berlapis, request throttling, monitoring, dan evaluasi GitHub App/OAuth pada skala lebih besar |
| GitHub GraphQL berubah atau membatasi query | Statistik tidak dapat diambil | Query minimum, contract tests, monitoring error, dan versi query terkontrol |
| GitHub membatasi animasi SVG di README | Kota tampil statis | Pastikan city art statis tetap bagus; animasi bukan syarat pemahaman |
| GitHub image proxy menyimpan gambar lebih lama | Perubahan statistik tidak langsung terlihat | Dokumentasikan refresh delay dan uji cache headers aktual |
| Worker CPU melebihi batas plan | Request gagal | Renderer ringan, benchmark, batasi ukuran data, evaluasi plan/hosting bila usage meningkat |
| Banyak cache miss bersamaan untuk username sama | Duplicate GraphQL calls | Cache TTL, deduplication/locking jika terbukti diperlukan, rate limit |
| Data kontribusi tidak sama dengan total commit repo | Interpretasi angka keliru | Label sebagai kontribusi commit pengguna dan jelaskan periode 12 bulan |
| Akun tanpa aktivitas menghasilkan kota kosong | UX kurang menarik | Fallback kota minimal yang sudah ditentukan desain |
| Input tak tervalidasi masuk ke SVG | SVG rusak atau injection | Validasi username dan XML escaping pada semua teks dinamis |

---

## 17. Keputusan Produk yang Dikunci untuk MVP

1. Kota Pixel didistribusikan sebagai **Dynamic SVG API**, bukan GitHub Action.
2. Pengguna memasang Kota Pixel melalui satu URL gambar pada README.
3. Pengguna tidak perlu menambahkan token atau memasang GitHub App.
4. MVP hanya membaca data publik.
5. Cloudflare Workers menjadi runtime API awal; Workers KV dan edge response cache digunakan untuk mengurangi request upstream.
6. Tidak ada Cron Trigger wajib pada MVP; pembaruan terjadi saat request setelah cache kedaluwarsa.
7. Desain kota existing digunakan kembali tanpa redesign.
8. SVG statis yang valid adalah baseline; animasi README harus dibuktikan lewat pengujian nyata.
9. Data level bangunan memakai kontribusi commit pengguna dalam 12 bulan terakhir, bukan total seumur hidup.
10. Fitur private repository, dashboard, OAuth, tema tambahan, dan format PNG/GIF berada di luar MVP.

---

## 18. Pertanyaan Terbuka untuk Validasi Teknis

Pertanyaan berikut tidak menghalangi pembuatan core engine, tetapi harus dijawab sebelum rilis publik:

- Apakah CSS animation dalam SVG benar-benar berjalan ketika SVG API ditampilkan sebagai gambar pada GitHub profile README? Dokumentasi GitHub menyatakan animasi SVG tidak didukung pada tampilan SVG GitHub; perlu uji langsung pada jalur README.
- Apakah semua metrik yang direncanakan tersedia secara konsisten dari satu query GraphQL, atau merged PR perlu query tambahan?
- Bagaimana perilaku cache GitHub image proxy terhadap `Cache-Control`, `ETag`, dan parameter query endpoint?
- Apakah token layanan tunggal cukup untuk kebutuhan awal, atau penggunaan publik membutuhkan autentikasi GitHub App dengan alur persetujuan pengguna?
- Apa cakupan tepat perhitungan total stars: semua repository publik milik user atau hanya repository yang divisualisasikan? Keputusan harus dibuat sebelum angka pohon dijadikan acceptance test.

---

## 19. Referensi Teknis

Dokumentasi resmi yang menjadi acuan awal. Batas dan perilaku layanan harus diperiksa kembali saat implementasi dan sebelum rilis.

- GitHub GraphQL — Forming calls and authentication: https://docs.github.com/en/graphql/guides/forming-calls-with-graphql
- GitHub GraphQL — Rate limits and query limits: https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api
- GitHub GraphQL — User and contribution objects: https://docs.github.com/en/graphql/reference/users
- GitHub GraphQL — Commit contribution objects: https://docs.github.com/en/graphql/reference/commits
- GitHub — Working with non-code files and SVG support: https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files
- Cloudflare Workers — Platform limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers — Workers Cache: https://developers.cloudflare.com/workers/cache/
- Cloudflare Workers KV — Overview: https://developers.cloudflare.com/kv/
- Cloudflare Workers KV — Cache data: https://developers.cloudflare.com/kv/examples/cache-data-with-workers-kv/

---

**Arah akhir MVP:** Kota Pixel harus terasa seperti layanan gambar siap pakai. Developer cukup memasang satu URL di README; semua pengambilan data publik, pemetaan statistik, rendering, dan cache dikelola oleh layanan Kota Pixel.
