import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchAvailability,rankMembers} from './availability-matching.ts';
test('full coverage merges touching ranges without double counting overlaps',()=>{assert.equal(matchAvailability([{startHour:9,endHour:10},{startHour:9.5,endHour:11}],9,11).coverage,1);});
test('partial coverage preserves gaps and supports quarter hours',()=>{const r=matchAvailability([{startHour:9,endHour:10},{startHour:10.5,endHour:11}],9.25,11);assert.equal(r.status,'partial');assert.equal(r.overlap,1.25);});
test('touching boundaries are not overlap; empty and missing are distinct',()=>{assert.equal(matchAvailability([{startHour:8,endHour:9}],9,11).status,'none');assert.equal(matchAvailability([],9,11).status,'none');assert.equal(matchAvailability(undefined,9,11).status,'unknown');});
test('bumps matches up, keeps every member, sorts partials by coverage, preserves ties',()=>{const members=['none','half','full','unknown','most','tie'].map(id=>({id,email:id,name:id,role:'member'}));const date='2026-09-21';const input={none:{[date]:[]},half:{[date]:[{startHour:9,endHour:10}]},full:{[date]:[{startHour:8,endHour:12}]},most:{[date]:[{startHour:9,endHour:10.5}]},tie:{[date]:[{startHour:9,endHour:10}]}};assert.deepEqual(rankMembers(members,input,date,9,11).map(x=>x.member.id),['full','most','half','tie','none','unknown']);assert.equal(rankMembers(members,input,'2026-09-22',9,11).every(x=>x.status==='unknown'),true);});
test('invalid range rejected',()=>assert.throws(()=>matchAvailability([],11,9)));
