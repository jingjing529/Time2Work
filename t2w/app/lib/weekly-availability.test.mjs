import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dragRange,weeklyAvailability} from './weekly-availability.ts';
test('drag works in both directions and snaps to 15 minutes',()=>{assert.deepEqual(dragRange(9,11),[9,11]);assert.deepEqual(dragRange(11,9),[9,11]);assert.deepEqual(dragRange(9.1,10.3),[9,10.25]);});
test('drag clamps boundaries and always keeps a positive duration',()=>{assert.deepEqual(dragRange(7,21),[8,19]);assert.deepEqual(dragRange(19,19),[18.75,19]);assert.deepEqual(dragRange(9,9),[9,9.25]);});
test('migration picks latest weekday, includes weekends and preserves weekly overrides',()=>{const slots=[{startHour:9,endHour:11}];const data={availability:{a:{'2026-09-14':slots,'2026-09-21':[],'2026-09-20':slots,'2026-09-22':slots}},weeklyAvailability:{a:{Tue:[]}}};assert.deepEqual(weeklyAvailability(data),{a:{Mon:[],Tue:[],Sun:slots}});});
