/* ═══════════════════════════════════════════════════════════
   ProposalForge — utils.js
   Shared utility functions used across all modules
═══════════════════════════════════════════════════════════ */

/**
 * Format a number as currency (USD by default)
 */
function formatCurrency(amount, currency = 'USD') {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Debounce: returns a function that delays invoking fn until after `wait` ms
 */
function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Deep clone a plain object / array (JSON-safe)
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a short unique ID (not crypto-grade, just for list keys)
 */
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Format a date string (YYYY-MM-DD) to a readable format
 * e.g. "2025-04-01" → "April 1, 2025"
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get today's date as YYYY-MM-DD
 */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get a date N days from today as YYYY-MM-DD
 */
function futureDateISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Convert a File object to a base64 data URL
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Escape HTML characters to prevent XSS in preview rendering
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert newlines to <br> tags for HTML rendering
 */
function nl2br(str) {
  if (!str) return '';
  return escapeHTML(str).replace(/\n/g, '<br>');
}

/**
 * Parse newline-separated text into timeline items
 * Each non-empty line becomes a timeline point
 */
function parseTimeline(text) {
  if (!text) return [];
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

/**
 * Clamp a number between min and max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Save data to localStorage with error handling
 */
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.warn('ProposalForge: localStorage write failed');
    return false;
  }
}

/**
 * Read data from localStorage with error handling
 */
function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Remove item from localStorage
 */
function lsRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

/**
 * Lighten a hex color by a percentage (0–1)
 * Used for generating tinted backgrounds from accent color
 */
function hexLighten(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round((num >> 16) + (255 - (num >> 16)) * amount));
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.round((num & 0xff) + (255 - (num & 0xff)) * amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Convert hex color to rgba string
 */
function hexToRgba(hex, alpha = 1) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Truncate a string to maxLen characters
 */
function truncate(str, maxLen = 60) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Sleep: resolves after ms milliseconds
 */
function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}
