import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateAvailability } from './availability.ts';
const slot = (startHour, endHour, day = 0) => ({day, startHour, endHour});
test('erasing 1–2 from 1–3 preserves 2–3', () => {
  assert.deepEqual(updateAvailability([slot(13,16)], slot(13,15), 'remove'), [slot(15,16)]);
});
test('clicking the middle hour splits a selected range', () => {
  assert.deepEqual(updateAvailability([slot(13,16)], slot(14,15), 'remove'), [slot(13,14),slot(15,16)]);
});
test('erasing across gaps preserves other days and does not select gaps', () => {
  assert.deepEqual(updateAvailability([slot(9,11),slot(12,15),slot(9,15,1)], slot(10,14), 'remove'), [slot(9,10),slot(14,15),slot(9,15,1)]);
});
test('adding overlaps preserves both existing ends and merges adjacent ranges', () => {
  const original = [slot(9,12),slot(14,17)];
  assert.deepEqual(updateAvailability(original,slot(11,14),'add'),[slot(9,17)]);
  assert.deepEqual(original,[slot(9,12),slot(14,17)]);
});
test('erasing a whole range clears it', () => {
  assert.deepEqual(updateAvailability([slot(13,16)],slot(13,16),'remove'),[]);
});
