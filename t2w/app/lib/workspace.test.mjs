import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visibleTasks} from './workspace.ts';
const tasks=[{id:'a',assignee:'admin@example.com',due:'2026-09-23T10:00'},{id:'b',assignee:'member@example.com',due:'2026-09-21T10:00'}];
test('admin sees all tasks in due order without modifying source',()=>{assert.deepEqual(visibleTasks(tasks,'admin@example.com',true).map(t=>t.id),['b','a']);assert.equal(tasks[0].id,'a');});
test('member sees only own tasks',()=>{assert.deepEqual(visibleTasks(tasks,'member@example.com',false).map(t=>t.id),['b']);});
test('unassigned member has no personal tasks',()=>{assert.deepEqual(visibleTasks(tasks,'other@example.com',false),[]);});
