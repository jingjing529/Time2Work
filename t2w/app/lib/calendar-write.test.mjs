import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {validateEvent} from './events.ts';
const source=readFileSync(new URL('../api/calendar/route.ts',import.meta.url),'utf8');
function route(fetch,token='test-token'){
 const exports={};
 const require=id=>id==='next/headers'?{cookies:async()=>({get:()=>token?{value:token}:undefined})}:id==='next/server'?{NextResponse:{json:(body,init)=>({body,status:init?.status||200})}}:{validateEvent};
 new Function('exports','require','fetch',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports,require,fetch);
 return exports;
}
const event={id:'b'.repeat(32),title:'Planning',start:'2026-10-01T16:00:00Z',end:'2026-10-01T17:00:00Z',timeZone:'America/Los_Angeles',description:'Agenda',participantIds:['1'],participantEmails:['member@example.com'],calendarId:'shared@example.com',sendInvites:false};
const request=(value=event)=>({headers:new Headers({origin:'http://localhost:3002'}),nextUrl:{origin:'http://localhost:3002'},json:async()=>value});
test('Google writes always include guests and sendUpdates=all even if client opts out',async()=>{
 let call;const api=route(async(url,options)=>{call={url,body:JSON.parse(options.body)};return {ok:true,json:async()=>({id:event.id,htmlLink:'https://calendar.google.com/'})};});
 assert.equal((await api.POST(request())).status,200);
 assert.ok(call.url.endsWith('?sendUpdates=all'));
 assert.deepEqual(call.body.attendees,[{email:'member@example.com'}]);
});
test('rejects demo participants before any Google request',async()=>{
 let calls=0;const api=route(async()=>{calls++;});
 assert.equal((await api.POST(request({...event,participantEmails:['demo@time2work.invalid']}))).status,400);assert.equal(calls,0);
});
test('retry uses stable event ID and reads existing event on conflict',async()=>{
 const urls=[];const api=route(async(url)=>{urls.push(url);return urls.length===1?{ok:false,status:409}:{ok:true,json:async()=>({id:event.id})};});
 assert.equal((await api.POST(request())).status,200);assert.ok(urls[1].endsWith(`/events/${event.id}`));
});
