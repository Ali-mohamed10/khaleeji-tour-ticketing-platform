const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  HST_RATE,
  calculateDiscountedTotal,
  extractTicketCode,
} = require('../utils/pricing');

describe('calculateDiscountedTotal', () => {
  it('uses 13% HST rate', () => {
    assert.equal(HST_RATE, 0.13);
  });

  it('preserves original total when discount is 0%', () => {
    const result = calculateDiscountedTotal(113, 0);
    assert.equal(result.ticketTotal, 100);
    assert.equal(result.discountAmount, 0);
    assert.equal(result.serviceFee, 13);
    assert.equal(result.grandTotal, 113);
  });

  it('applies percentage discount on base ticket total before recalculating HST', () => {
    const result = calculateDiscountedTotal(113, 20);
    assert.equal(result.ticketTotal, 100);
    assert.equal(result.discountAmount, 20);
    assert.equal(result.netTicketTotal, 80);
    assert.equal(result.serviceFee, 10.4);
    assert.equal(result.grandTotal, 90.4);
  });

  it('clamps discount percentage above 100% and below 0%', () => {
    const overDiscount = calculateDiscountedTotal(113, 150);
    assert.equal(overDiscount.netTicketTotal, 0);
    assert.equal(overDiscount.grandTotal, 0);

    const negativeDiscount = calculateDiscountedTotal(113, -10);
    assert.equal(negativeDiscount.discountAmount, 0);
    assert.equal(negativeDiscount.grandTotal, 113);
  });
});

describe('extractTicketCode', () => {
  it('returns plain ticket and registration codes trimmed', () => {
    assert.equal(extractTicketCode('  KT-8F2A1B  '), 'KT-8F2A1B');
    assert.equal(extractTicketCode('PC4-2026-0042'), 'PC4-2026-0042');
  });

  it('extracts code from JSON QR payloads', () => {
    assert.equal(extractTicketCode('{"ticketCode":"KT-9988"}'), 'KT-9988');
    assert.equal(extractTicketCode('{"regNum":"PC4-2026-0010"}'), 'PC4-2026-0010');
    assert.equal(extractTicketCode('{"ticket_code":"KT-1122"}'), 'KT-1122');
  });

  it('falls back safely on malformed JSON or empty input', () => {
    assert.equal(extractTicketCode('{broken-json'), '{broken-json');
    assert.equal(extractTicketCode(''), '');
    assert.equal(extractTicketCode(null), '');
  });
});
