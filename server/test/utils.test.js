import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildCsv } from '../src/utils/csv.js';
import { buildPaginationMeta, parsePagination } from '../src/utils/pagination.js';
import { parseProductImportRow } from '../src/utils/productImport.js';
import { calculateWarrantyExpiry, maskCustomerName } from '../src/utils/warranty.js';

describe('pagination helpers', () => {
  it('clamps page and limit values', () => {
    const pagination = parsePagination({ page: '-2', limit: '500' }, { defaultLimit: 10, maxLimit: 50 });

    assert.deepEqual(pagination, { page: 1, limit: 50, skip: 0 });
  });

  it('builds pagination metadata', () => {
    assert.deepEqual(buildPaginationMeta({ total: 101, page: 2, limit: 50 }), {
      total: 101,
      page: 2,
      pages: 3,
    });
  });
});

describe('csv helpers', () => {
  it('escapes comma and quote characters', () => {
    const csv = buildCsv(['name', 'model'], [['Washer, XL', 'Model "A"']]);

    assert.equal(csv, 'name,model\n"Washer, XL","Model ""A"""');
  });
});

describe('product import helpers', () => {
  it('normalizes valid product rows', () => {
    const result = parseProductImportRow({
      name: '  Washer  ',
      model_number: ' W-100 ',
      category: ' Laundry ',
      warranty_duration_months: '24',
    });

    assert.equal(result.product.name, 'Washer');
    assert.equal(result.product.modelNumber, 'W-100');
    assert.equal(result.product.warrantyDurationMonths, 24);
  });

  it('rejects invalid warranty duration', () => {
    const result = parseProductImportRow({
      name: 'Washer',
      model_number: 'W-100',
      category: 'Laundry',
      warranty_duration_months: '0',
    });

    assert.equal(result.error, 'invalid warranty_duration_months');
  });
});

describe('warranty helpers', () => {
  it('calculates warranty expiry from claim date', () => {
    const expiresAt = calculateWarrantyExpiry(new Date('2026-02-17T00:00:00Z'), 12);

    assert.equal(expiresAt.toISOString(), '2027-02-17T00:00:00.000Z');
  });

  it('masks customer names', () => {
    assert.equal(maskCustomerName('Amina Mensah'), 'Amina M.');
    assert.equal(maskCustomerName('Amina'), 'Amina');
    assert.equal(maskCustomerName(''), '');
  });
});

