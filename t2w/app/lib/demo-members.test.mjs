import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedRequestedDemo} from './demo-members.ts';
import {rankMembers} from './availability-matching.ts';
const original={members:[{id:'owner',email:'owner@example.com',name:'Owner',role:'admin'}],weeklyAvailability:{'owner@example.com':{Mon:[{startHour:8,endHour:9}]}},tasks:[],notices:[]};
test('adds ten demo members only to requested org, preserves existing records',()=>{assert.equal(seedRequestedDemo('other',original),original);const d=seedRequestedDemo('T2W-4BE413B4',original);assert.equal(d.members.length,11);assert.deepEqual(d.weeklyAvailability['owner@example.com'],original.weeklyAvailability['owner@example.com']);assert.equal(new Set(d.members.map(x=>x.email)).size,11);assert.equal(seedRequestedDemo('T2W-4BE413B4',d),d);});
test('demo provides full partial and no overlap matches plus distinct schedules',()=>{const d=seedRequestedDemo('T2W-4BE413B4',original);const rows=rankMembers(d.members,d.weeklyAvailability,'Mon',9,12);assert.ok(rows.some(x=>x.status==='full'));assert.ok(rows.some(x=>x.status==='partial'));assert.ok(rows.some(x=>x.status==='none'));assert.equal(new Set(d.members.slice(1).map(m=>JSON.stringify(d.weeklyAvailability[m.email]))).size,10);});
test('repairs missing demo records even after one-time seed, preserving edited schedules',()=>{
 const seeded=seedRequestedDemo('T2W-4BE413B4',original);
 const edited={...seeded,members:seeded.members.filter(m=>m.id!=='demo-availability-2'),weeklyAvailability:{...seeded.weeklyAvailability,'demo.1@time2work.invalid':{Mon:[{startHour:15,endHour:16}]}}};
 delete edited.weeklyAvailability['demo.2@time2work.invalid'];
 const restored=seedRequestedDemo('T2W-4BE413B4',edited);
 assert.equal(restored.members.length,11);
 assert.deepEqual(restored.weeklyAvailability['demo.1@time2work.invalid'].Mon,edited.weeklyAvailability['demo.1@time2work.invalid'].Mon);
 assert.ok(restored.weeklyAvailability['demo.2@time2work.invalid']);
 assert.equal(seedRequestedDemo('T2W-4BE413B4',restored),restored);
});
