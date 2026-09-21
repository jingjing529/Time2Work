import type {ScheduledEvent} from "./events";
export type Member = {id:string; name:string; email:string; role:"admin"|"member"|"guest"; tags?:string[]};
export type Task = {id:string; title:string; due:string; assignee:string; kind:"task"|"meeting"; done:boolean};
export type Notice = {id:string; title:string; body:string; date:string};
export type AvailabilityDay = {startHour:number; endHour:number}[];
export type Workspace = {events?:ScheduledEvent[];demoSeedVersion?:number;weeklyAvailability?: Record<string, Record<string, AvailabilityDay>>;availability?: Record<string, Record<string, AvailabilityDay>>; description:string; cover:string; avatar:string; members:Member[]; tasks:Task[]; notices:Notice[]; calendarId:string};
// Transient rendering cache only; authoritative data is read and saved by the server API.
const cache=new Map<string,Workspace>();
export function loadWorkspace(id:string,email:string,name:string):Workspace {
 return cache.get(id)||{description:'',cover:'',avatar:'',members:[{id:crypto.randomUUID(),name,email,role:'admin'}],tasks:[],notices:[],calendarId:''};
}
export function persistWorkspace(id:string,value:Workspace){cache.set(id,value);}
export function visibleTasks(tasks:Task[],email:string,admin:boolean) { return tasks.filter(t=>admin || t.assignee===email).sort((a,b)=>a.due.localeCompare(b.due)); }
