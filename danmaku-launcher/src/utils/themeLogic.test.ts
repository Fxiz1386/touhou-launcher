import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEffectiveTheme, getAutoThemeReason } from './themeLogic.ts';

test('resolveEffectiveTheme returns explicit theme when not auto', () => {
  const now = new Date('2026-10-19T14:00:00');
  assert.equal(resolveEffectiveTheme('dark', now), 'dark');
  assert.equal(resolveEffectiveTheme('light', now), 'light');
  assert.equal(resolveEffectiveTheme('zun_pastel', now), 'zun_pastel');
});

test('resolveEffectiveTheme calculates auto theme based on hour', () => {
  // Morning 08:30 -> zun_pastel
  const morning = new Date('2026-10-19T08:30:00');
  assert.equal(resolveEffectiveTheme('auto', morning), 'zun_pastel');

  // Noon 13:00 -> zun_pastel
  const noon = new Date('2026-10-19T13:00:00');
  assert.equal(resolveEffectiveTheme('auto', noon), 'zun_pastel');

  // Evening 19:45 -> dark
  const evening = new Date('2026-10-19T19:45:00');
  assert.equal(resolveEffectiveTheme('auto', evening), 'dark');

  // Night 02:15 -> dark
  const night = new Date('2026-10-19T02:15:00');
  assert.equal(resolveEffectiveTheme('auto', night), 'dark');
});

test('getAutoThemeReason explains day and night reasoning', () => {
  const morning = new Date('2026-10-19T10:00:00');
  assert.match(getAutoThemeReason(morning), /diurno/i);

  const night = new Date('2026-10-19T23:00:00');
  assert.match(getAutoThemeReason(night), /nocturno/i);
});
