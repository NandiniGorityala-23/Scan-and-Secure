const normalizeText = (value) => String(value || '').trim();

export const parseProductImportRow = (row) => {
  const name = normalizeText(row.name);
  const modelNumber = normalizeText(row.model_number);
  const category = normalizeText(row.category);
  const warrantyDurationMonths = Number(row.warranty_duration_months);

  if (!name || !modelNumber || !category) {
    return { error: 'missing required text fields' };
  }

  if (!Number.isInteger(warrantyDurationMonths) || warrantyDurationMonths < 1) {
    return { error: 'invalid warranty_duration_months' };
  }

  return {
    product: {
      name,
      modelNumber,
      category,
      specifications: normalizeText(row.specifications),
      warrantyDurationMonths,
    },
  };
};

