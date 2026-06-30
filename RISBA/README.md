# RISBA — Aplikasi Islami PWA

> **Rumah Ibadah & Sosial Baiturrahim**  
> Aplikasi Progressive Web App (PWA) berbasis HTML/CSS/JavaScript murni

---

## 📋 Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🕌 **Jadwal Sholat** | Perhitungan waktu sholat akurat menggunakan algoritma astronomi berdasarkan GPS |
| 🧭 **Arah Kiblat** | Kompas digital dengan DeviceOrientation API (iOS & Android) |
| 🗺️ **Peta Masjid** | Cari masjid terdekat via Leaflet.js + OpenStreetMap + Overpass API |
| 📲 **PWA / A2HS** | Bisa dipasang ke layar utama HP tanpa App Store |
| 🔔 **Notifikasi** | Pengingat waktu sholat via Push Notification |
| 📶 **Offline** | Berjalan tanpa internet via Service Worker + Cache API |

---

## 📁 Struktur Folder

```
RISBA/
├── index.html              ← Halaman utama (Tab: Beranda, Sholat, Kiblat, Peta)
├── offline.html            ← Halaman fallback saat offline
├── manifest.json           ← PWA manifest (ikon, theme color, shortcuts)
├── service-worker.js       ← Cache strategi & push notification
├── favicon.ico
├── README.md
│
├── css/
│   ├── style.css           ← Design system & komponen utama
│   ├── responsive.css      ← Breakpoints mobile/tablet/desktop
│   └── animation.css       ← Keyframes & utility animasi
│
├── js/
│   ├── app.js              ← Core controller (navigasi, toast, geolokasi)
│   ├── sholat.js           ← Kalkulasi waktu sholat (algoritma Julian Date)
│   ├── qiblat.js           ← Arah kiblat + DeviceOrientation API
│   ├── maps.js             ← Peta Leaflet + pencarian masjid Overpass
│   └── pwa.js              ← Service Worker, install prompt, notifikasi
│
├── images/
│   ├── logo.png            ← Logo RISBA
│   ├── banner.jpg          ← Banner hero halaman beranda
│   ├── background.jpg      ← Background aplikasi
│   └── masjid.jpg          ← Gambar masjid
│
├── icons/                  ← Ikon PWA berbagai ukuran
│   ├── icon-72.png ... icon-512.png
│   ├── maskable-icon.png
│   └── apple-touch-icon.png
│
└── assets/
    ├── audio/
    │   ├── adzan.mp3       ← Audio adzan
    │   └── murattal.mp3    ← Audio murattal
    └── font/
        └── Poppins.ttf     ← Font lokal fallback
```

---

## 🚀 Cara Menjalankan

### Lokal (Development)
```bash
# Gunakan Live Server (VS Code extension) atau Python HTTP Server:
python -m http.server 8080
# Lalu buka: http://localhost:8080/RISBA/
```

> ⚠️ Harus dijalankan melalui HTTP server (bukan `file://`) agar Service Worker dan Geolokasi berfungsi.

### Deploy ke Hosting
Upload seluruh folder `RISBA/` ke:
- GitHub Pages
- Netlify
- Vercel
- Atau hosting apapun yang mendukung HTTPS

---

## 🛠️ Teknologi

- **HTML5** — Struktur semantik
- **CSS3 Vanilla** — Custom Properties, Grid, Flexbox, Animations
- **JavaScript ES6+** — Modules, Async/Await, Geolocation API
- **Leaflet.js** — Peta interaktif (dimuat dinamis)
- **OpenStreetMap** — Tile layer gratis
- **Overpass API** — Data masjid terdekat
- **Service Worker** — Offline cache & push notification
- **Google Fonts** — Poppins

---

## 🔧 Konfigurasi

### Mengubah Metode Hisab
Edit `js/sholat.js` → `CALC_PARAMS`:
```js
CALC_PARAMS: {
  fajrAngle: 20,   // Kemenag Indonesia
  ishaAngle: 18,
}
```

### Mengubah Radius Pencarian Masjid
Edit `js/maps.js` → `SEARCH_RADIUS`:
```js
SEARCH_RADIUS: 2000, // meter
```

### Menambah Ikon PWA
Letakkan file PNG di folder `icons/` sesuai nama yang terdaftar di `manifest.json`.

---

## 📱 Instalasi PWA

1. Buka aplikasi di browser Chrome/Safari
2. Tekan tombol **"📲 Pasang Aplikasi"** yang muncul
3. Konfirmasi pemasangan
4. Aplikasi tersedia di layar utama HP

---

## 📄 Lisensi

© 2024 RISBA — Rumah Ibadah & Sosial Baiturrahim  
Dikembangkan untuk keperluan komunitas Muslim.
