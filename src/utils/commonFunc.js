// Seconds -> "HH:MM:SS", or "MM:SS" when under an hour.
function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}

// 1500 -> "1.5K", 2000000 -> "2M".
function convertNumberToSuffix(num) {
  if (num < 1e3) return num;

  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(num) / 3);
  const scaled = num / Math.pow(1000, magnitude);
  return (scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1)) + suffixes[magnitude];
}

function timeAgo(dateString) {
  const diffInSeconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  const units = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const unit of units) {
    const value = Math.floor(diffInSeconds / unit.seconds);
    if (value > 0) {
      return `${value} ${unit.label}${value !== 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}

const pad = (n) => String(n).padStart(2, '0');

// Local datetime -> UTC "YYYY-MM-DD HH:mm:ss" for the API.
function toUTC(datetimeStr) {
  const d = new Date(datetimeStr);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// UTC datetime -> local "YYYY-MM-DDTHH:MM" for datetime-local inputs.
function toLocal(utcString) {
  const d = new Date(utcString);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Names -> react-select options.
function toOptions(names = []) {
  return names.map((name) => ({ value: name, label: name }));
}

// Stable background color for an avatar/initial, picked from the name.
function getColorFromName(name) {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Removes both copies of the admin token: localStorage (sent by axios) and the cookie (checked by middleware).
function clearAuthToken() {
  localStorage.removeItem('token');
  document.cookie =
    'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
}

const NO_THUMBNAIL_IMAGE =
  'https://media.istockphoto.com/id/1147544806/vector/no-thumbnail-image-vector-graphic.jpg';

export {
  formatDuration,
  convertNumberToSuffix,
  timeAgo,
  toUTC,
  toLocal,
  toOptions,
  getColorFromName,
  clearAuthToken,
  NO_THUMBNAIL_IMAGE,
};
