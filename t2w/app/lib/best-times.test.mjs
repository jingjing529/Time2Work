import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bestAvailabilityWindows} from './availability-matching.ts';
const members=['a','b','c'].map(id=>({id,email:id,name:id,role:'member'}));
const data={a:{Mon:[{startHour:9,endHour:11}]},b:{Mon:[{startHour:10,endHour:12}]},c:{Mon:[{startHour:10,endHour:10.5}]}};
test('duration changes the maximum and requires full coverage',()=>{const short=bestAvailabilityWindows(members,data,30);assert.equal(short.maximum,3);assert.deepEqual(short.windows.map(x=>[x.day,x.start,x.end]),[['Mon',10,10.5]]);const hour=bestAvailabilityWindows(members,data,60);assert.equal(hour.maximum,2);assert.equal(hour.windows[0].start,10);assert.equal(hour.windows[0].end,11);});
test('no submissions and no sufficiently long intervals have no recommendations',()=>{assert.deepEqual(bestAvailabilityWindows(members,{},60),{maximum:0,windows:[]});assert.equal(bestAvailabilityWindows(members,data,180).windows.length,0);});
test('ties preserve all weekdays and latest allowed end is 19:00',()=>{const r=bestAvailabilityWindows(members,{a:{Mon:[{startHour:18,endHour:19}],Fri:[{startHour:18,endHour:19}]}},60);assert.deepEqual(r.windows.map(x=>[x.day,x.end]),[['Mon',19],['Fri',19]]);});
test('rejects invalid durations',()=>{assert.throws(()=>bestAvailabilityWindows(members,data,0));assert.throws(()=>bestAvailabilityWindows(members,data,20));});

import {peakAvailabilityWindows} from './availability-matching.ts';
test('no-duration mode merges the same attendees into a maximal peak range',()=>{const r=peakAvailabilityWindows(members,data);assert.equal(r.maximum,3);assert.deepEqual(r.windows.map(w=>[w.day,w.start,w.end]),[['Mon',10,10.5]]);});
test('equally busy adjacent times with changing attendees are kept separate',()=>{const r=peakAvailabilityWindows(members,{a:{Mon:[{startHour:9,endHour:10}]},b:{Mon:[{startHour:10,endHour:11}]}});assert.equal(r.maximum,1);assert.deepEqual(r.windows.map(w=>[w.start,w.end]),[[9,10],[10,11]]);});
test('no-duration mode does not recommend empty schedules',()=>assert.equal(peakAvailabilityWindows(members,{}).windows.length,0));
