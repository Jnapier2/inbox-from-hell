export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function formatClock(isoString) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function sumDeltas(deltas = []) {
  const result = {};
  for (const delta of deltas) {
    for (const [key, value] of Object.entries(delta ?? {})) {
      result[key] = (result[key] ?? 0) + value;
    }
  }
  return result;
}
