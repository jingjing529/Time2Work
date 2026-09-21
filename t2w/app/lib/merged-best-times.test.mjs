import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergedBestMeetingWindows} from './availability-matching.ts';
const members=['a','b','c'].map(id=>({id,email:id,name:id,role:'member'}));
const slot=(startHour,endHour)=>[{startHour,endHour}];
test('merges repeated one-hour choices and retains all tied weekdays',()=>{
 const availability=Object.fromEntries(members.map(m=>[m.email,{Mon:slot(11,14),Tue:slot(11,15),Fri:slot(10,13)}]));
 const result=mergedBestMeetingWindows(members,availability,60,['Mon','Tue','Wed','Thu','Fri']);
 assert.equal(result.maximum,3);
 assert.deepEqual(result.windows.map(w=>[w.day,w.start,w.end]),[['Mon',11,14],['Tue',11,15],['Fri',10,13]]);
});
test('respects duration, selected days and people',()=>{
 const availability={a:{Mon:slot(9,9.5),Tue:slot(10,12)},b:{Mon:slot(9,9.5)}};
 assert.deepEqual(mergedBestMeetingWindows(members,availability,60,['Mon']).windows,[]);
 assert.equal(mergedBestMeetingWindows(members,availability,60,['Tue']).maximum,1);
 assert.equal(mergedBestMeetingWindows([members[1]],availability,60,['Tue']).maximum,0);
 assert.equal(mergedBestMeetingWindows(members,availability,0,['Mon']).maximum,2);
});
test('equal counts with different people or a gap never become one range',()=>{
 const availability={a:{Mon:[...slot(9,11),...slot(12,13)]},b:{Mon:slot(9,10)},c:{Mon:slot(10,11)}};
 const result=mergedBestMeetingWindows(members,availability,60,['Mon']);
 assert.deepEqual(result.windows.map(w=>[w.start,w.end,w.count]),[[9,10,2],[10,11,2]]);
});
test('weekend windows participate in recommendations and day filtering',()=>{
 const availability=Object.fromEntries(members.map(m=>[m.email,{Sat:slot(10,13),Sun:slot(12,16)}]));
 const result=mergedBestMeetingWindows(members,availability,60,['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
 assert.equal(result.maximum,3);
 assert.deepEqual(result.windows.map(w=>[w.day,w.dayIndex,w.start,w.end]),[['Sat',5,10,13],['Sun',6,12,16]]);
 assert.deepEqual(mergedBestMeetingWindows(members,availability,60,['Sun']).windows.map(w=>w.day),['Sun']);
});
test('candidate dates keep original indices and compare actual dates instead of weekday names',()=>{
 const dates=['2026-10-03','2026-10-10'];
 const availability=Object.fromEntries(members.map(m=>[m.email,{[dates[0]]:slot(9,11),[dates[1]]:slot(14,16)}]));
 const result=mergedBestMeetingWindows(members,availability,60,[dates[1]],dates);
 assert.deepEqual(result.windows.map(w=>[w.day,w.dayIndex,w.start,w.end]),[[dates[1],1,14,16]]);
});
test('best-time calculations honor custom hours including midnight boundary',()=>{
 const dates=['2026-10-03'];const availability=Object.fromEntries(members.map(m=>[m.email,{[dates[0]]:slot(18,24)}]));
 const result=mergedBestMeetingWindows(members,availability,60,dates,dates,20,24);
 assert.deepEqual(result.windows.map(w=>[w.start,w.end]),[[20,24]]);
});
