export const calculateWarrantyExpiry = (claimedAt, warrantyDurationMonths) => {
  const expiresAt = new Date(claimedAt);
  expiresAt.setMonth(expiresAt.getMonth() + Number(warrantyDurationMonths || 0));
  return expiresAt;
};

export const maskCustomerName = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

