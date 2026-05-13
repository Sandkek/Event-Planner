export function getUserInitials(fullName) {
  if (!fullName) return '?';

  return fullName
    .trim()
    .split(/\s+/)
    .map(part => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

export function formatShortDate(isoString) {
  const date = new Date(isoString);

  const day = date.getDate();
  const month = date.toLocaleString('ru-RU', { month: 'short' });
  const time = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${day} ${month} · ${time}`;
}

export function formatFullDate(isoString) {
  const date = new Date(isoString);

  return date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

export function getEventPlaceholderSvg(
  width = 320,
  height = 180,
  text = '🖼️'
) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#e9ecef"/>
      <text x="50%" y="50%" fill="#aaa" font-size="18" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `)}`;
}

export function getUrlParamNumber(name) {
  const value = new URLSearchParams(window.location.search).get(name);
  const parsed = Number(value);

  return Number.isNaN(parsed) ? null : parsed;
}