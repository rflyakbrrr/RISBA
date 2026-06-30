/**
 * RISBA - pwa.js
 * Progressive Web App: Service Worker Registration, Install Prompt, Notifications
 */

'use strict';

const PWAModule = {
  deferredPrompt: null,
  swRegistration: null,

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.checkStandaloneMode();
  },

  // ─── Service Worker Registration ──────────────────────────────────────────
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker tidak didukung');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      this.swRegistration = reg;
      console.log('[PWA] Service Worker terdaftar:', reg.scope);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateBanner();
          }
        });
      });

      // Handle messages from SW
      navigator.serviceWorker.addEventListener('message', (e) => {
        console.log('[PWA] Message dari SW:', e.data);
      });

    } catch (err) {
      console.error('[PWA] Gagal mendaftarkan Service Worker:', err);
    }
  },

  // ─── Install Prompt (A2HS) ────────────────────────────────────────────────
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.hideInstallButton();
      App.showToast('✅ RISBA berhasil dipasang!', 'success', 4000);
      console.log('[PWA] App installed');
    });
  },

  async triggerInstall() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    this.deferredPrompt = null;
    this.hideInstallButton();
  },

  showInstallButton() {
    let btn = document.getElementById('pwa-install-btn');
    if (btn) { btn.style.display = 'flex'; return; }

    btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.innerHTML = '📲 Pasang Aplikasi';
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, #1a6b3c, #27a05a);
      color: white;
      border: none;
      border-radius: 999px;
      padding: 12px 20px;
      font-family: Poppins, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      z-index: 9998;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(39,160,90,0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeInUp 0.4s ease;
    `;
    btn.addEventListener('click', () => this.triggerInstall());
    document.body.appendChild(btn);
  },

  hideInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
  },

  // ─── Standalone Mode Detection ────────────────────────────────────────────
  checkStandaloneMode() {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      document.body.classList.add('pwa-standalone');
      console.log('[PWA] Berjalan dalam mode standalone');
    }
  },

  // ─── Update Banner ────────────────────────────────────────────────────────
  showUpdateBanner() {
    let banner = document.getElementById('pwa-update-banner');
    if (banner) return;

    banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #0d4226, #1a6b3c);
      color: white;
      text-align: center;
      padding: 12px;
      font-family: Poppins, sans-serif;
      font-size: 14px;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    `;
    banner.innerHTML = `
      <span>🔄 Versi baru RISBA tersedia!</span>
      <button onclick="window.location.reload()" style="
        background: #f0c040;
        color: #0d2b1a;
        border: none;
        border-radius: 999px;
        padding: 6px 16px;
        font-family: Poppins, sans-serif;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
      ">Perbarui</button>
      <button onclick="this.parentElement.remove()" style="
        background: transparent;
        color: rgba(255,255,255,0.7);
        border: none;
        font-size: 18px;
        cursor: pointer;
        line-height: 1;
      ">✕</button>
    `;
    document.body.prepend(banner);
  },

  // ─── Push Notifications ───────────────────────────────────────────────────
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifikasi tidak didukung');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  async schedulePrayerNotification(prayerName, prayerTime) {
    const granted = await this.requestNotificationPermission();
    if (!granted || !this.swRegistration) return;

    const now    = new Date();
    const delay  = prayerTime.getTime() - now.getTime();
    if (delay <= 0) return;

    // Use setTimeout for simple demo (use Push API in production)
    setTimeout(() => {
      this.swRegistration.showNotification(`🕌 Waktu ${prayerName}`, {
        body: `Saatnya melaksanakan sholat ${prayerName}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: `prayer-${prayerName.toLowerCase()}`,
        vibrate: [200, 100, 200, 100, 200],
        silent: false
      });
    }, delay);
  }
};

// Auto-init PWA when DOM ready
document.addEventListener('DOMContentLoaded', () => PWAModule.init());
