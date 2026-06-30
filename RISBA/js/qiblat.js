/**
 * RISBA - qiblat.js
 * Qibla Direction Calculator using device orientation & geomagnetic
 * Kabah coordinates: 21.4225°N, 39.8262°E
 */

'use strict';

const QiblatModule = {
  initialized: false,
  qiblaAngle: null,
  compassSupported: false,
  orientationGranted: false,

  KABAH: { lat: 21.4225, lng: 39.8262 },

  // ─── Activate ────────────────────────────────────────────────────────────
  async onActivate() {
    if (!this.initialized) {
      await this.init();
      this.initialized = true;
    }
  },

  async init() {
    try {
      const location = await App.getLocation();
      this.qiblaAngle = this.calculateQiblaAngle(location.lat, location.lng);
      this.updateQiblaInfo(this.qiblaAngle, location);
      await this.startCompass();
    } catch (err) {
      console.warn('[Qiblat] Gagal mendapat lokasi:', err.message);
      // Default: Surabaya
      const defaultLat = -7.250445;
      const defaultLng = 112.768845;
      this.qiblaAngle = this.calculateQiblaAngle(defaultLat, defaultLng);
      this.updateQiblaInfo(this.qiblaAngle, null, true);
      // Tampilkan kompas statis
      this.setArrowRotation(this.qiblaAngle);
      this.showStaticCompass();
    }
  },

  // ─── Qibla Bearing Calculation ────────────────────────────────────────────
  calculateQiblaAngle(userLat, userLng) {
    const φ1  = this.toRad(userLat);
    const φ2  = this.toRad(this.KABAH.lat);
    const Δλ  = this.toRad(this.KABAH.lng - userLng);

    const y   = Math.sin(Δλ) * Math.cos(φ2);
    const x   = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ   = Math.atan2(y, x);
    const bearing = ((θ * 180 / Math.PI) + 360) % 360;
    return bearing;
  },

  toRad(deg) { return deg * Math.PI / 180; },

  // ─── Compass (Device Orientation) ─────────────────────────────────────────
  async startCompass() {
    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm === 'granted') {
          this.listenOrientation();
          this.compassSupported = true;
        } else {
          this.showStaticCompass();
        }
      } catch (e) {
        this.showStaticCompass();
      }
    } else if ('DeviceOrientationEvent' in window) {
      this.listenOrientation();
      this.compassSupported = true;
    } else {
      this.showStaticCompass();
    }
  },

  listenOrientation() {
    let lastAlpha = 0;
    window.addEventListener('deviceorientationabsolute', (e) => {
      this.onOrientation(e.alpha, e.webkitCompassHeading);
    }, true);

    window.addEventListener('deviceorientation', (e) => {
      // webkitCompassHeading: iOS (true north, clockwise)
      // alpha: Android/others (counter-clockwise from north)
      const heading = e.webkitCompassHeading ?? (360 - e.alpha);
      this.onOrientation(heading);
    });
  },

  onOrientation(compassHeading) {
    if (this.qiblaAngle === null) return;
    // Arrow angle = qibla direction minus current compass heading
    const arrowAngle = (this.qiblaAngle - compassHeading + 360) % 360;
    this.setArrowRotation(arrowAngle);
  },

  setArrowRotation(angle) {
    const arrow = document.getElementById('qiblat-arrow');
    if (!arrow) return;
    // Arrow CSS default points UP (north), so rotate by angle
    arrow.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
  },

  // ─── Static Compass (fallback, no device orientation) ─────────────────────
  showStaticCompass() {
    if (this.qiblaAngle === null) return;
    this.setArrowRotation(this.qiblaAngle);

    const info = document.getElementById('qiblat-info');
    if (info) {
      info.innerHTML = `
        <p id="qiblat-degree">🧭 Arah Kiblat: <strong style="color:var(--color-accent)">${this.qiblaAngle.toFixed(1)}°</strong> dari Utara</p>
        <p style="font-size:0.75rem;margin-top:4px;color:var(--color-text-subtle)">
          (Kompas otomatis tidak tersedia — gunakan kompas manual)
        </p>
      `;
    }
  },

  updateQiblaInfo(angle, location, isDefault = false) {
    const el = document.getElementById('qiblat-degree');
    if (!el) return;

    const direction = this.getCardinalDirection(angle);
    const locText   = isDefault
      ? 'Surabaya (default)'
      : `${location?.lat?.toFixed(4)}°, ${location?.lng?.toFixed(4)}°`;

    el.innerHTML = `
      🕋 Arah Kiblat: <strong style="color:var(--color-accent)">${angle.toFixed(1)}°</strong> (${direction})
      <br/>
      <small style="color:var(--color-text-subtle)">Dari lokasi: ${locText}</small>
    `;
  },

  getCardinalDirection(angle) {
    const dirs = ['Utara','Timur Laut','Timur','Tenggara','Selatan','Barat Daya','Barat','Barat Laut'];
    return dirs[Math.round(angle / 45) % 8];
  }
};
