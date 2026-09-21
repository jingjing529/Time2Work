import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateEvent} from './events.ts';
const event={id:'a'.repeat(32),title:'Planning',start:'2026-10-01T16:00:00Z',end:'2026-10-01T17:00:00Z',timeZone:'America/Los_Angeles',description:'Agenda',participantIds:['1'],participantEmails:['test@example.invalid'],sendInvites:false,googleStatus:'local'};
test('local events allow demo participants without sending invitations',()=>assert.doesNotThrow(()=>validateEvent(event)));
test('Google invitations reject demo addresses and accept real address shapes',()=>{assert.throws(()=>validateEvent({...event,sendInvites:true}),/real email/);assert.doesNotThrow(()=>validateEvent({...event,sendInvites:true,participantEmails:['member@example.com']}));});
test('rejects empty participants, reversed times, invalid timezone and invalid ID',()=>{for(const patch of [{participantIds:[]},{end:event.start},{timeZone:'Fake/Timezone'},{id:'bad'},{title:''}])assert.throws(()=>validateEvent({...event,...patch}));});
