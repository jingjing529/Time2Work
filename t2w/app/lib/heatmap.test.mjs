import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchWindow} from './availability-matching.ts';
const members=['full','partial','unknown','none'].map(id=>({id,name:id,email:id,role:'member'}));
const range=[{startHour:9,endHour:11}];
const data={full:{Mon:range,Tue:range},partial:{Mon:range,Tue:[{startHour:9,endHour:10}]},unknown:{Mon:range},none:{Mon:[],Tue:[]}};
test('requires complete coverage on every selected day',()=>{const rows=matchWindow(members,data,['Mon','Tue'],9,11);assert.equal(rows.find(x=>x.member.id==='full').status,'full');assert.equal(rows.find(x=>x.member.id==='partial').coverage,.75);assert.equal(rows.find(x=>x.member.id==='unknown').status,'partial');assert.equal(rows.find(x=>x.member.id==='unknown').missing,1);assert.equal(rows.length,4);});
test('hover slot lists everyone fully covering the cell',()=>{assert.equal(matchWindow(members,data,['Mon'],9,9.25).filter(x=>x.status==='full').length,3);});
test('unsubmitted days are never counted as free',()=>{assert.equal(matchWindow(members,data,['Wed'],9,10).every(x=>x.status==='unknown'),true);});
