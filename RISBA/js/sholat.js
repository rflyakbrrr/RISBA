/**
 * RISBA - sholat.js
 * Prayer Time Calculator using Adhan.js algorithm
 * Supports: Subuh, Dhuha, Dzuhur, Ashar, Maghrib, Isya
 */

'use strict';

const SholatModule = {
  initialized: false,
  prayerData: null,
  countdownInterval: null,

  // ─── Calculation Method ──────────────────────────────────────────────────
  // Referensi: Kementerian Agama Indonesia (MUI)
  CALC_PARAMS: {
    fajrAngle: 20,
    ishaAngle: 18,
    maghribMinutes: 0,
    midnight: 'Standard'
  },

  PRAYER_NAMES: {
    fajr:    { id: 'Subuh',   icon: '🌙' },
    dhuhr:   { id: 'Dzuhur',  icon: '☀️' },
    asr:     { id: 'Ashar',   icon: '🌤️' },
    maghrib: { id: 'Maghrib', icon: '🌅' },
    isha:    { id: 'Isya',    icon: '⭐' }
  },

  // ─── Activate ────────────────────────────────────────────────────────────
  async onActivate() {
    if (!this.initialized) {
      await this.loadPrayerTimes();
      this.initialized = true;
    }
  },

  // ─── Load Prayer Times ────────────────────────────────────────────────────
  async loadPrayerTimes() {
    this.showSkeletonLoader();
    try {
      const location = await App.getLocation();
      this.updateLocationInfo(location);
      const times = this.calculatePrayerTimes(location.lat, location.lng);
      this.prayerData = times;
      this.renderPrayerTimes(times);
      this.startCountdown(times);
    } catch (err) {
      console.warn('[Sholat] Geolokasi gagal, menggunakan lokasi default:', err.message);
      // Default: Baiturrahim Mosque (Lokasi contoh)
      const defaultLocation = { lat: -7.250445, lng: 112.768845 };
      this.updateLocationInfo(defaultLocation, true);
      const times = this.calculatePrayerTimes(defaultLocation.lat, defaultLocation.lng);
      this.prayerData = times;
      this.renderPrayerTimes(times);
      this.startCountdown(times);
    }
  },

  // ─── Prayer Time Algorithm ────────────────────────────────────────────────
  calculatePrayerTimes(lat, lng) {
    const now = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;
    const day   = now.getDate();

    // Julian Date calculation
    const jd = this.julianDate(year, month, day);

    // Equation of time & sun declination
    const { equation, declination } = this.sunPosition(jd);
    const noon = 12 - lng / 15 - equation;
    const tz   = this.getTimezoneOffset();

    // Fajr & Isha angles
    const fajrAngle  = -20;
    const ishaAngle  = -18;

    const fajrT    = noon + (1 / 15) * this.acosD((this.sinD(fajrAngle) - this.sinD(lat) * this.sinD(declination)) / (this.cosD(lat) * this.cosD(declination)));
    const sunriseT = noon - (1 / 15) * this.acosD((-this.sinD(0.833) - this.sinD(lat) * this.sinD(declination)) / (this.cosD(lat) * this.cosD(declination)));
    const dhuhrT   = noon;
    const asrT     = noon + (1 / 15) * this.acosD((this.sinD(this.cotD(1 + Math.tan(Math.abs(lat - declination) * Math.PI / 180))) - this.sinD(lat) * this.sinD(declination)) / (this.cosD(lat) * this.cosD(declination)));
    const maghribT = noon + (1 / 15) * this.acosD((-this.sinD(0.833) - this.sinD(lat) * this.sinD(declination)) / (this.cosD(lat) * this.cosD(declination)));
    const ishaT    = noon - (1 / 15) * this.acosD((this.sinD(ishaAngle) - this.sinD(lat) * this.sinD(declination)) / (this.cosD(lat) * this.cosD(declination)));

    const toDate = (fractionalHour) => {
      const total = fractionalHour + tz;
      const h = Math.floor(total);
      const m = Math.round((total - h) * 60);
      const d = new Date(year, month - 1, day, h, m, 0);
      return d;
    };

    return {
      fajr:    toDate(fajrT),
      sunrise: toDate(sunriseT),
      dhuhr:   toDate(dhuhrT),
      asr:     toDate(asrT),
      maghrib: toDate(maghribT),
      isha:    toDate(ishaT)
    };
  },

  // ─── Astronomical Helpers ─────────────────────────────────────────────────
  julianDate(year, month, day) {
    if (month <= 2) { year -= 1; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  },

  sunPosition(jd) {
    const D = jd - 2451545.0;
    const g = (357.529 + 0.98560028 * D) % 360;
    const q = (280.459 + 0.98564736 * D) % 360;
    const L = (q + 1.915 * this.sinD(g) + 0.020 * this.sinD(2 * g)) % 360;
    const R = 1.00014 - 0.01671 * this.cosD(g) - 0.00014 * this.cosD(2 * g);
    const e = 23.439 - 0.00000036 * D;
    const RA = this.atan2D(this.cosD(e) * this.sinD(L), this.cosD(L)) / 15;
    const equation = q / 15 - RA;
    const declination = this.asinD(this.sinD(e) * this.sinD(L));
    return { equation, declination };
  },

  getTimezoneOffset() {
    return -new Date().getTimezoneOffset() / 60;
  },

  sinD(d) { return Math.sin(d * Math.PI / 180); },
  cosD(d) { return Math.cos(d * Math.PI / 180); },
  tanD(d) { return Math.tan(d * Math.PI / 180); },
  cotD(d) { return 1 / Math.tan(d * Math.PI / 180); },
  acosD(x) { return Math.acos(x) * 180 / Math.PI; },
  asinD(x) { return Math.asin(x) * 180 / Math.PI; },
  atan2D(y, x) { return Math.atan2(y, x) * 180 / Math.PI; },

  // ─── Render ───────────────────────────────────────────────────────────────
  renderPrayerTimes(times) {
    const container = document.getElementById('prayer-times');
    if (!container) return;

    const now = new Date();
    const prayerList = [
      { key: 'fajr',    ...this.PRAYER_NAMES.fajr,    time: times.fajr },
      { key: 'dhuhr',   ...this.PRAYER_NAMES.dhuhr,   time: times.dhuhr },
      { key: 'asr',     ...this.PRAYER_NAMES.asr,     time: times.asr },
      { key: 'maghrib', ...this.PRAYER_NAMES.maghrib, time: times.maghrib },
      { key: 'isha',    ...this.PRAYER_NAMES.isha,    time: times.isha }
    ];

    // Find next prayer
    const nextIdx = prayerList.findIndex(p => p.time > now);

    container.innerHTML = prayerList.map((p, idx) => `
      <div class="prayer-card ${idx === nextIdx ? 'active-prayer' : ''}">
        <div class="prayer-name">${p.icon} ${p.id}</div>
        <div class="prayer-time">${App.formatTime(p.time)}</div>
        ${idx === nextIdx ? '<div style="font-size:0.7rem;color:var(--color-accent);margin-top:4px;">Berikutnya</div>' : ''}
      </div>
    `).join('');

    // Update next prayer box
    this.updateNextPrayer(prayerList, nextIdx);
  },

  updateNextPrayer(list, idx) {
    const box = document.getElementById('next-prayer');
    if (!box) return;
    if (idx < 0) {
      box.innerHTML = `<p style="color:var(--color-accent);font-weight:600">✅ Semua waktu sholat hari ini telah berlalu</p>`;
      return;
    }
    const next = list[idx];
    box.innerHTML = `
      <p style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:4px">Waktu sholat berikutnya</p>
      <p style="color:var(--color-accent);font-size:1.5rem;font-weight:700">${next.icon} ${next.id}</p>
      <p id="countdown-timer" style="color:white;font-size:1.1rem;font-weight:500;margin-top:8px">–</p>
    `;
  },

  startCountdown(times) {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      const now = new Date();
      const el  = document.getElementById('countdown-timer');
      if (!el) return;

      const prayerList = [times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha];
      const next = prayerList.find(t => t > now);
      if (!next) {
        el.textContent = '–';
        clearInterval(this.countdownInterval);
        return;
      }
      const diff = Math.floor((next - now) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
  },

  updateLocationInfo(loc, isDefault = false) {
    const el = document.getElementById('location-text');
    if (!el) return;
    if (isDefault) {
      el.textContent = '📍 Lokasi: Surabaya (default) — Aktifkan GPS untuk lokasi akurat';
    } else {
      el.textContent = `📍 Koordinat: ${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°`;
    }
  },

  showSkeletonLoader() {
    const container = document.getElementById('prayer-times');
    if (!container) return;
    container.innerHTML = Array(5).fill(0).map(() => `
      <div class="prayer-card">
        <div class="prayer-name skeleton" style="height:16px;width:60%;margin:0 auto 8px;">&nbsp;</div>
        <div class="prayer-time skeleton" style="height:28px;width:80%;margin:0 auto;">&nbsp;</div>
      </div>
    `).join('');
  }
};
