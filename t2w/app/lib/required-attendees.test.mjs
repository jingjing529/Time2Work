import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergedBestMeetingWindows} from './availability-matching.ts';
const members=[{id:'g',email:'g',role:'guest',name:'Guest'},...['a','b','c'].map(id=>({id,email:id,role:'member',name:id}))];
const availability={g:{Mon:[{startHour:12,endHour:14}]},a:{Mon:[{startHour:9,endHour:11},{startHour:12,endHour:14}]},b:{Mon:[{startHour:9,endHour:11}]},c:{Mon:[{startHour:9,endHour:11}]}};
const best=(required,duration=60)=>mergedBestMeetingWindows(members,availability,duration,['Mon'],['Mon'],8,19,required);
test('required guest excludes larger groups who cannot meet the guest',()=>{
 assert.equal(best([]).maximum,3);
 const result=best(['g']);assert.equal(result.maximum,2);assert.deepEqual(result.windows.map(w=>[w.start,w.end]),[[12,14]]);
});
test('all required people must cover the full duration; missing availability yields no result',()=>{
 assert.equal(best(['g','b']).windows.length,0);assert.equal(best(['g'],180).windows.length,0);assert.equal(best(['missing']).windows.length,0);
});
test('peak mode honors required people and merges continuous ranges',()=>{
 const result=best(['g','a'],0);assert.deepEqual(result.windows.map(w=>[w.start,w.end]),[[12,14]]);
});
