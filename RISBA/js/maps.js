/**
 * RISBA - maps.js
 * Mosque Finder Map using Leaflet.js (OpenStreetMap)
 * Finds nearby mosques via Overpass API
 */

'use strict';

const MapsModule = {
  initialized: false,
  map: null,
  userMarker: null,
  mosqueMarkers: [],
  leafletLoaded: false,

  OVERPASS_API: 'https://overpass-api.de/api/interpreter',
  DEFAULT_ZOOM: 15,
  SEARCH_RADIUS: 2000, // meters

  // ─── Activate ────────────────────────────────────────────────────────────
  async onActivate() {
    if (!this.initialized) {
      await this.loadLeaflet();
      await this.initMap();
      this.initialized = true;
    }
  },

  // ─── Load Leaflet Dynamically ─────────────────────────────────────────────
  async loadLeaflet() {
    if (this.leafletLoaded) return;
    return new Promise((resolve) => {
      // CSS
      const link  = document.createElement('link');
      link.rel    = 'stylesheet';
      link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // JS
      const script = document.createElement('script');
      script.src   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        this.leafletLoaded = true;
        resolve();
      };
      document.head.appendChild(script);
    });
  },

  // ─── Initialize Map ───────────────────────────────────────────────────────
  async initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || !window.L) return;

    // Default center: Surabaya
    const defaultCenter = [-7.250445, 112.768845];

    this.map = L.map('map', {
      center: defaultCenter,
      zoom: this.DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true
    });

    // Dark-themed tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add custom CSS for dark map
    this.applyDarkMapFilter();

    // Try to get user location
    try {
      const loc = await App.getLocation();
      this.centerOnUser(loc.lat, loc.lng);
      this.addUserMarker(loc.lat, loc.lng);
      await this.searchNearbyMosques(loc.lat, loc.lng);
    } catch (err) {
      console.warn('[Maps] Menggunakan lokasi default:', err.message);
      this.addUserMarker(defaultCenter[0], defaultCenter[1]);
      await this.searchNearbyMosques(defaultCenter[0], defaultCenter[1]);
      App.showToast('📍 Menampilkan masjid sekitar Surabaya (default)', 'info');
    }
  },

  applyDarkMapFilter() {
    const mapEl = document.getElementById('map');
    if (mapEl) {
      const tiles = mapEl.querySelector('.leaflet-layer');
      if (tiles) {
        tiles.style.filter = 'brightness(0.7) hue-rotate(10deg)';
      }
    }
    // Apply via CSS class
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-tile-pane { filter: brightness(0.65) saturate(0.8) hue-rotate(180deg) invert(1); }
    `;
    document.head.appendChild(style);
  },

  centerOnUser(lat, lng) {
    this.map.setView([lat, lng], this.DEFAULT_ZOOM);
  },

  // ─── User Marker ──────────────────────────────────────────────────────────
  addUserMarker(lat, lng) {
    if (this.userMarker) this.userMarker.remove();

    const userIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:18px; height:18px;
        background: #1a6b3c;
        border: 3px solid #f0c040;
        border-radius: 50%;
        box-shadow: 0 0 12px rgba(240,192,64,0.8);
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    this.userMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('<b>📍 Lokasi Anda</b>')
      .openPopup();
  },

  // ─── Overpass Mosque Search ────────────────────────────────────────────────
  async searchNearbyMosques(lat, lng) {
    App.showToast('🔍 Mencari masjid terdekat...', 'info', 2000);

    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="place_of_worship"]["religion"="muslim"](around:${this.SEARCH_RADIUS},${lat},${lng});
        way["amenity"="place_of_worship"]["religion"="muslim"](around:${this.SEARCH_RADIUS},${lat},${lng});
      );
      out center;
    `;

    try {
      const response = await fetch(this.OVERPASS_API, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`
      });
      const data = await response.json();
      this.renderMosqueMarkers(data.elements);
    } catch (err) {
      console.error('[Maps] Overpass API error:', err);
      App.showToast('❌ Gagal memuat data masjid', 'error');
    }
  },

  // ─── Mosque Markers ───────────────────────────────────────────────────────
  renderMosqueMarkers(elements) {
    // Clear previous
    this.mosqueMarkers.forEach(m => m.remove());
    this.mosqueMarkers = [];

    if (!elements || elements.length === 0) {
      App.showToast('🕌 Tidak ada masjid ditemukan di area ini', 'warning');
      return;
    }

    const mosqueIcon = L.divIcon({
      className: '',
      html: `<div style="
        font-size: 22px;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
        user-select:none;
      ">🕌</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    elements.forEach(el => {
      const lat  = el.lat  || el.center?.lat;
      const lng  = el.lon  || el.center?.lon;
      const name = el.tags?.name || el.tags?.['name:id'] || 'Masjid';

      if (!lat || !lng) return;

      const marker = L.marker([lat, lng], { icon: mosqueIcon })
        .addTo(this.map)
        .bindPopup(`
          <div style="font-family:Poppins,sans-serif;min-width:160px;">
            <b style="color:#1a6b3c">🕌 ${name}</b>
            ${el.tags?.opening_hours ? `<br/><small>⏰ ${el.tags.opening_hours}</small>` : ''}
            <br/>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}"
               target="_blank"
               style="color:#1a6b3c;font-size:0.8rem;">
              🗺️ Petunjuk Arah
            </a>
          </div>
        `);

      this.mosqueMarkers.push(marker);
    });

    App.showToast(`🕌 Ditemukan ${this.mosqueMarkers.length} masjid terdekat`, 'success');
  }
};
