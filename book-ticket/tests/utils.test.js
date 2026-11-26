import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeStatus, TABLE_CATEGORIES } from '../src/utils/seatMapConstants.js';
import { deriveSiblingThumbUrl, getCardImageSrc, getCardImageFallback } from '../src/utils/imageUrl.js';

describe('seatMapConstants', () => {
  it('computes available, reserved, and sold statuses accurately', () => {
    assert.equal(computeStatus(0, 6), 'available');
    assert.equal(computeStatus(2, 6), 'reserved');
    assert.equal(computeStatus(6, 6), 'sold');
    assert.equal(computeStatus(8, 6), 'sold');
  });

  it('defines expected permanent table categories', () => {
    assert.ok(TABLE_CATEGORIES.vip_room);
    assert.ok(TABLE_CATEGORIES.vip_premium);
    assert.ok(TABLE_CATEGORIES.vip_standard);
    assert.ok(TABLE_CATEGORIES.general);
  });
});

describe('imageUrl helpers', () => {
  it('derives sibling thumbnail URL for cover images', () => {
    assert.equal(
      deriveSiblingThumbUrl('https://cdn.example.com/events/cover_1700000000.webp'),
      'https://cdn.example.com/events/cover-thumb_1700000000.webp'
    );
    assert.equal(deriveSiblingThumbUrl('https://cdn.example.com/events/legacy.webp'), null);
  });

  it('prefers stored thumbnail_url for event covers and falls back to cover_image_url', () => {
    const event = {
      cover_image_url: 'https://cdn.example.com/cover.webp',
      thumbnail_url: 'https://cdn.example.com/thumb.webp',
    };
    assert.equal(getCardImageSrc(event), 'https://cdn.example.com/thumb.webp');
    assert.equal(getCardImageFallback(event), 'https://cdn.example.com/cover.webp');
  });
});
