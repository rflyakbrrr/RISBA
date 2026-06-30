/**
 * RISBA - app.js
 * Core Application Logic: Tab Navigation, UI Controller, Utilities
 */

'use strict';

// ─── App State ────────────────────────────────────────────────────────────────
const App = {
  currentTab: 'beranda',
  userLocation: null,
  isOnline: navigator.onLine,

  init() {
    this.setupNavigation();
    this.setupMenuToggle();
    this.setupOnlineStatus();
    this.setupCardClicks();
    this.handleHashNavigation();
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
    console.log('[RISBA] App initialized ✓');
  },

  // ─── Tab Navigation ───────────────────────────────────────────────────────
  setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn[data-tab]');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
        // Close mobile menu
        document.getElementById('main-nav').classList.remove('open');
      });
    });
  },

  switchTab(tabId) {
    if (this.currentTab === tabId) return;

    // Deactivate current
    const prevSection = document.getElementById(`tab-${this.currentTab}`);
    const prevBtn     = document.querySelector(`.nav-btn[data-tab="${this.currentTab}"]`);
    if (prevSection) prevSection.classList.remove('active');
    if (prevBtn)     prevBtn.classList.remove('active');

    // Activate new
    const nextSection = document.getElementById(`tab-${tabId}`);
    const nextBtn     = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (nextSection) nextSection.classList.add('active');
    if (nextBtn)     nextBtn.classList.add('active');

    this.currentTab = tabId;
    history.pushState(null, '', `#${tabId}`);

    // Trigger tab-specific init
    this.onTabActivated(tabId);
  },

  onTabActivated(tabId) {
    switch (tabId) {
      case 'sholat': SholatModule.onActivate(); break;
      case 'qiblat': QiblatModule.onActivate(); break;
      case 'peta':   MapsModule.onActivate();   break;
    }
  },

  handleHashNavigation() {
    const hash = location.hash.replace('#', '');
    const validTabs = ['beranda', 'sholat', 'qiblat', 'peta'];
    if (hash && validTabs.includes(hash)) {
      this.switchTab(hash);
    }
  },

  // ─── Mobile Menu Toggle ────────────────────────────────────────────────────
  setupMenuToggle() {
    const toggle = document.getElementById('menu-toggle');
    const nav    = document.getElementById('main-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  },

  // ─── Card Clicks (Beranda) ─────────────────────────────────────────────────
  setupCardClicks() {
    document.querySelectorAll('.card[data-tab]').forEach(card => {
      card.addEventListener('click', () => {
        this.switchTab(card.dataset.tab);
      });
    });
  },

  // ─── Online Status ─────────────────────────────────────────────────────────
  setupOnlineStatus() {
    const showStatus = (online) => {
      this.isOnline = online;
      const msg = online
        ? '🟢 Koneksi tersambung'
        : '🔴 Offline — Data dari cache';
      App.showToast(msg, online ? 'success' : 'warning');
    };
    window.addEventListener('online',  () => showStatus(true));
    window.addEventListener('offline', () => showStatus(false));
  },

  // ─── Date & Time ───────────────────────────────────────────────────────────
  updateDateTime() {
    const now = new Date();
    // Update any datetime elements
    document.querySelectorAll('[data-current-time]').forEach(el => {
      el.textContent = now.toLocaleTimeString('id-ID');
    });
    document.querySelectorAll('[data-current-date]').forEach(el => {
      el.textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    });
  },

  // ─── Geolocation ───────────────────────────────────────────────────────────
  getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolokasi tidak didukung browser ini'));
        return;
      }
      if (this.userLocation) {
        resolve(this.userLocation);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          };
          resolve(this.userLocation);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  },

  // ─── Toast Notification ───────────────────────────────────────────────────
  showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        z-index: 9999; display: flex; flex-direction: column; gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const colors = {
      info:    '#1a6b3c',
      success: '#27a05a',
      warning: '#c79d1a',
      error:   '#c0392b'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 24px;
      border-radius: 999px;
      font-size: 14px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      animation: fadeInUp 0.3s ease forwards;
      pointer-events: auto;
      white-space: nowrap;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // ─── Format Time ──────────────────────────────────────────────────────────
  formatTime(date) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
};

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
