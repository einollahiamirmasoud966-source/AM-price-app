import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_ASSETS, ASSET_MAP, CRYPTO_ASSETS, CURRENCY_ASSETS, GOLD_ASSETS } from '../data/catalog';
import {
  buildQuoteFromTgju,
  convertQuantityToToman,
  convertTomanToQuantity,
  formatToman,
  parseChangeSpan,
  parseHistoryRows,
  rialToToman,
  sumBasketToman,
  toPersianDigits,
} from './marketMath';

test('catalog enforces exact 5 gold items, 5 crypto items, and rich currency variety', () => {
  assert.equal(GOLD_ASSETS.length, 5);
  assert.equal(CRYPTO_ASSETS.length, 5);
  assert.ok(CURRENCY_ASSETS.length >= 60, `Expected >= 60 currencies, got ${CURRENCY_ASSETS.length}`);

  const slugs = new Set(ALL_ASSETS.map((a) => a.slug));
  assert.equal(slugs.size, ALL_ASSETS.length, 'All asset slugs must be unique');

  assert.equal(ASSET_MAP['rob'].emblem, 'fraction-1/4');
  assert.equal(ASSET_MAP['nim'].emblem, 'fraction-1/2');
  assert.equal(ASSET_MAP['sekeb'].emblem, 'animated-coin');
  assert.equal(ASSET_MAP['geram18'].emblem, 'number-18');
  assert.equal(ASSET_MAP['geram24'].emblem, 'number-24');

  for (const crypto of CRYPTO_ASSETS) {
    assert.ok(crypto.emblem.startsWith('crypto-'));
  }
  for (const currency of CURRENCY_ASSETS) {
    assert.equal(currency.emblem, 'flag');
    assert.ok(currency.flagCode && currency.flagCode.length === 2);
  }
});

test('rialToToman converts TGJU comma-formatted Rials accurately', () => {
  assert.equal(rialToToman('2,709,700'), 270970);
  assert.equal(rialToToman('240,884,000'), 24088400);
  assert.equal(rialToToman('1,742'), 174.2);
});

test('parseChangeSpan extracts high/low direction, Toman change, and percentage', () => {
  const high = parseChangeSpan('<span class="high" dir="ltr">35950</span>', '<span class="high" dir="ltr">1.34%</span>');
  assert.equal(high.direction, 'up');
  assert.equal(high.changeToman, 3595);
  assert.equal(high.changePercent, 1.34);

  const low = parseChangeSpan('<span class="low" dir="ltr">15850</span>', '<span class="low" dir="ltr">0.59%</span>');
  assert.equal(low.direction, 'down');
  assert.equal(low.changeToman, -1585);
  assert.equal(low.changePercent, -0.59);
});

test('buildQuoteFromTgju uses dailySummaryRow when ajax.json change is zero', () => {
  const quote = buildQuoteFromTgju(
    'price_dollar_rl',
    { p: '2,709,700', h: '2,719,700', l: '2,707,300', d: '0', dp: 0, dt: '', t: '۲ آذر', t_en: '23 Nov', ts: '2026-11-23' },
    undefined,
    ['2,714,750', '2,707,300', '2,719,700', '2,709,700', '<span class="high">35950</span>', '<span class="high">1.34%</span>', '2026/11/23', '1405/09/02'],
  );
  assert.equal(quote.priceToman, 270970);
  assert.equal(quote.changeToman, 3595);
  assert.equal(quote.changePercent, 1.34);
  assert.equal(quote.direction, 'up');
});

test('parseHistoryRows orders oldest-to-newest for charting', () => {
  const rows = [
    ['2,714,750', '2,707,300', '2,719,700', '2,709,700', '<span class="high">35950</span>', '<span class="high">1.34%</span>', '2026/11/23', '1405/09/02'],
    ['2,687,800', '2,666,300', '2,689,700', '2,673,750', '<span class="low">15850</span>', '<span class="low">0.59%</span>', '2026/11/22', '1405/09/01'],
  ];
  const parsed = parseHistoryRows(rows);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].dateGregorian, '2026/11/22');
  assert.equal(parsed[1].dateGregorian, '2026/11/23');
  assert.equal(parsed[1].closeToman, 270970);
});

test('calculator conversions handle standard and 100-unit currencies plus basket sum', () => {
  // $100 USD at 270,970 Toman
  assert.equal(convertQuantityToToman(100, 270970, 1), 27097000);
  // 1000 JPY when TGJU quotes 170,435 Toman per 100 JPY -> 1,704,350 Toman
  assert.equal(convertQuantityToToman(1000, 170435, 100), 1704350);
  assert.equal(convertTomanToQuantity(1704350, 170435, 100), 1000);

  const total = sumBasketToman(
    [
      { id: '1', slug: 'price_dollar_rl', quantity: 10 },
      { id: '2', slug: 'geram18', quantity: 2 },
    ],
    {
      price_dollar_rl: {
        slug: 'price_dollar_rl',
        priceToman: 270000,
        highToman: 270000,
        lowToman: 270000,
        changeToman: 0,
        changePercent: 0,
        direction: 'neutral',
        updatedAtFa: '',
        updatedAtEn: '',
        timestamp: '',
      },
      geram18: {
        slug: 'geram18',
        priceToman: 24000000,
        highToman: 24000000,
        lowToman: 24000000,
        changeToman: 0,
        changePercent: 0,
        direction: 'neutral',
        updatedAtFa: '',
        updatedAtEn: '',
        timestamp: '',
      },
    },
    ASSET_MAP,
  );
  assert.equal(total, 2700000 + 48000000);
});

test('toPersianDigits and formatToman format numbers cleanly', () => {
  assert.equal(toPersianDigits('270,970'), '۲۷۰,۹۷۰');
  assert.equal(formatToman(270970, 'fa', true), '۲۷۰,۹۷۰');
  assert.equal(formatToman(270970, 'en', false), '270,970');
});
