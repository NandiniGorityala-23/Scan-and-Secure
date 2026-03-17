export function daysLeft(date) {
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
}

export function formatWarrantyDate(date, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  return new Date(date).toLocaleDateString('en-US', options);
}

export function warrantyStatus(expiresAt) {
  const days = daysLeft(expiresAt);

  if (days < 0) return { tone: 'expired', label: 'Expired', days };
  if (days <= 30) return { tone: 'expiring', label: `Expires in ${days}d`, days };

  return { tone: 'active', label: 'Active', days };
}

