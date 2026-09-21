"use client";
import {useState,useRef,type PointerEvent} from 'react';
import {WEEKDAYS,weeklyAvailability,dragRange} from '../lib/weekly-availability';
import Availability from './Availability';
import AvailabilityHeatmap from './AvailabilityHeatmap';
import EventComposer from './EventComposer';
import MemberAvailabilityPreview from './MemberAvailabilityPreview';
import type {MeetingSelection} from '../lib/events';
import type {Workspace, AvailabilityDay} from '../lib/workspace';
import type {TimeSlot} from '../lib/availability';
import {rankMembers} from '../lib/availability-matching';
import s from './TeamAvailability.module.css';
const time=(n:number)=>`${String(Math.floor(n)).padStart(2,'0')}:${String(Math.round(n%1*60)).padStart(2,'0')}`;
const hour=(value:string)=>{const [h,m]=value.split(':').map(Number);return h+m/60;};
const labels={full:'Available',partial:'Partial overlap',none:'No overlap',unknown:'Not submitted'};
export default function TeamAvailability({data,email,mode,onSave,onCommit,canSchedule=true,shared=false}:{onCommit?:(data:Workspace)=>Promise<boolean>;shared?:boolean;canSchedule?:boolean;data:Workspace;email:string;mode:"team"|"mine";onSave:(next:Workspace)=>boolean}) {
 const [starredIds,setStarredIds]=useState<string[]>([]);
 const [viewMember,setViewMember]=useState<string|null>(null);
 const [selectedPeople,setSelectedPeople]=useState<string[]|null>(null);
 const [meeting,setMeeting]=useState<MeetingSelection|null>(null);
 const [teamView,setTeamView]=useState<'heatmap'|'timeline'>('heatmap');
 const [day,setDay]=useState('Mon');
 const [start,setStart]=useState('09:00');const [end,setEnd]=useState('11:00');
 const [match,setMatch]=useState(true);
 const drag=useRef<{anchor:number;start:string;end:string;match:boolean}|null>(null);
 const availability=weeklyAvailability(data);
 const mySlots:TimeSlot[]=WEEKDAYS.flatMap((day,index)=>(availability[email]?.[day]||[]).map(slot=>({...slot,day:index})));
 function update(slots:TimeSlot[]) {
  const days={...availability[email]};
  WEEKDAYS.forEach((key,index)=>{const before=mySlots.filter(x=>x.day===index).map(({startHour,endHour})=>({startHour,endHour}));const after=slots.filter(x=>x.day===index).map(({startHour,endHour})=>({startHour,endHour}));if(JSON.stringify(before)!==JSON.stringify(after)) days[key]=after;});
  onSave({...data,weeklyAvailability:{...availability,[email]:days}});
 }
 function coordinate(e:PointerEvent<HTMLDivElement>) {const r=e.currentTarget.getBoundingClientRect();return 8+(e.clientX-r.left)/r.width*11;}
 function moveDrag(e:PointerEvent<HTMLDivElement>) {if(!drag.current)return;const [a,b]=dragRange(drag.current.anchor,coordinate(e));setStart(time(a));setEnd(time(b));setMatch(true);}
 function beginDrag(e:PointerEvent<HTMLDivElement>) {if(e.button!==0)return;e.preventDefault();drag.current={anchor:coordinate(e),start,end,match};e.currentTarget.setPointerCapture(e.pointerId);moveDrag(e);}
 function endDrag(e:PointerEvent<HTMLDivElement>) {if(!drag.current)return;moveDrag(e);drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}
 function cancelDrag() {if(drag.current){setStart(drag.current.start);setEnd(drag.current.end);setMatch(drag.current.match);drag.current=null;}}
 const dragProps={onPointerDown:beginDrag,onPointerMove:moveDrag,onPointerUp:endDrag,onPointerCancel:cancelDrag};
 const valid=!!start&&!!end&&hour(start)>=8&&hour(end)<=19&&hour(end)>hour(start);
 const requiredIds=starredIds.filter(id=>data.members.some(m=>m.id===id));
 const rows=rankMembers(data.members,availability,day,valid?hour(start):9,valid?hour(end):11);
 const active=match&&valid;
 const baseOrder=active?rows:[...rows].sort((a,b)=>a.index-b.index);
 const ordered=[...baseOrder].sort((a,b)=>Number(requiredIds.includes(b.member.id))-Number(requiredIds.includes(a.member.id)));
 const requiredAvailable=requiredIds.every(id=>rows.some(r=>r.member.id===id&&r.status==='full'));
 const chosen=[...new Set([...requiredIds,...(selectedPeople===null?rows.filter(r=>r.status==='full').map(r=>r.member.id):selectedPeople.filter(id=>data.members.some(m=>m.id===id)))])];
 function toggleStar(id:string){setStarredIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);}
 const offset=(n:number)=>(n-8)/11*100;
 function duration(n:number){const minutes=Math.round(n*60);return `${Math.floor(minutes/60)?`${Math.floor(minutes/60)}h `:''}${minutes%60?`${minutes%60}m`:''}`.trim()||'0m';}
 return <section className={s.panel}>
 <div className={s.heading}><div><span className={s.eyebrow}>FIND YOUR SHARED WINDOW</span><h2>{mode==='team'?'Team availability':'My availability'}</h2><p>{mode==='team'?'Pick a day, then drag a time range to bring the best matches to the top.':'Your regular Monday–Sunday availability. Click or drag to add and remove time.'}</p></div></div>
 {mode==='team'?<>
 <div className={s.viewTabs}><button aria-pressed={teamView==='heatmap'} onClick={()=>setTeamView('heatmap')}>Weekly heatmap</button><button aria-pressed={teamView==='timeline'} onClick={()=>setTeamView('timeline')}>Member timeline</button></div>
 {teamView==='heatmap'?<AvailabilityHeatmap onSchedule={canSchedule?setMeeting:undefined} requiredIds={starredIds} onRequiredChange={setStarredIds} members={data.members} availability={availability} onTimeline={(day,start,end)=>{setDay(day);setStart(time(start));setEnd(time(end));setMatch(true);setTeamView('timeline');}}/>:<>
 <div className={s.filters}><div className={s.weekdays} aria-label="Weekday">{WEEKDAYS.map(d=><button key={d} aria-pressed={day===d} onClick={()=>setDay(d)}>{d}</button>)}</div><div className={s.times}><label>From<input aria-label="Match start time" type="time" min="08:00" max="19:00" step="900" value={start} onChange={e=>{setStart(e.target.value);setMatch(true);}}/></label><span>—</span><label>To<input aria-label="Match end time" type="time" min="08:00" max="19:00" step="900" value={end} onChange={e=>{setEnd(e.target.value);setMatch(true);}}/></label><button className={s.primary} onClick={()=>setMatch(!match)} disabled={!valid}>{match?'Clear ranking':'Find best matches'}</button></div></div>
 {!valid&&<p role="alert" className={s.error}>Choose an end time after the start, between 08:00 and 19:00.</p>}
 <p className={s.starHint}>★ Star anyone who must attend. Starred people stay at the top.</p>{!requiredAvailable&&<p role="status" className={s.error}>Not all starred people are available for this entire window.</p>}<div className={s.scheduleBar}>{canSchedule&&<><span>{chosen.length} participants selected</span><button onClick={()=>setSelectedPeople(null)}>Select available</button><button onClick={()=>setSelectedPeople([])}>Clear people</button></>}{canSchedule&&valid&&<button disabled={!chosen.length||!requiredAvailable} className={s.primary} onClick={()=>setMeeting({days:[day],start:hour(start),end:hour(end),duration:0,memberIds:chosen,requiredIds})}>Schedule event →</button>}</div><div className={s.summary} aria-live="polite"><strong>{day} · {active?`${start} – ${end}`:'All day'}</strong>{active?<span><b>{rows.filter(r=>r.status==='full').length}</b> available · <b>{rows.filter(r=>r.status==='partial').length}</b> partial · Best matches first</span>:<span>All {rows.length} members · Original order</span>}</div>
 <div className={s.scroll}><div className={s.table}>
 <div className={s.tableHead}><span>TEAM MEMBER <small>{rows.length}</small></span><div className={s.ruler}>{Array.from({length:12},(_,i)=><span key={i} style={{left:`${i/11*100}%`}}>{String(i+8).padStart(2,'0')}</span>)}</div><span>{active?'MATCH':'AVAILABILITY'}</span></div>
 <div className={s.rangeRow}><span>DRAG TO SELECT<small>15-minute increments · drag either direction</small></span><div className={s.rangePicker} aria-label="Drag to select matching time range" {...dragProps}>{active&&<div className={s.rangeFill} style={{left:`${offset(hour(start))}%`,width:`${(hour(end)-hour(start))/11*100}%`}}><span>{start}–{end}</span></div>}</div><span>{active?`${start}–${end}`:'Drag on the bar'}</span></div>
 {ordered.map(row=><div className={s.row} key={row.member.id} data-member={row.member.email}><div className={s.person}>{canSchedule&&<input type="checkbox" aria-label={`Select ${row.member.name} for meeting`} checked={chosen.includes(row.member.id)} disabled={requiredIds.includes(row.member.id)} onChange={()=>setSelectedPeople(chosen.includes(row.member.id)?chosen.filter(id=>id!==row.member.id):[...chosen,row.member.id])}/>}<button type="button" className={s.requiredStar} aria-label={`Must attend: ${row.member.name}`} aria-pressed={requiredIds.includes(row.member.id)} title={requiredIds.includes(row.member.id)?"Required · Click to unstar":"Must attend · Click to star"} onClick={()=>toggleStar(row.member.id)}><span aria-hidden="true">{requiredIds.includes(row.member.id)?"★":"☆"}</span></button><div>{canSchedule?<button className={s.memberLink} aria-label={`View ${row.member.name} availability`} onClick={()=>setViewMember(row.member.id)}>{row.member.name}{row.member.email===email?' (you)':''}</button>:<strong>{row.member.name}{row.member.email===email?' (you)':''}</strong>}{row.member.role==='guest'&&<small className={s.guestLabel}>Guest</small>}</div></div><div className={s.track} aria-label={`${row.member.name}: ${row.slots===undefined?'not submitted':row.slots.length?row.slots.map(x=>`${time(x.startHour)}–${time(x.endHour)}`).join(', '):'no availability'}`}>
 {active&&<div className={s.selection} style={{left:`${offset(hour(start))}%`,width:`${(hour(end)-hour(start))/11*100}%`}}/>}
 {(row.slots||[]).map((slot:AvailabilityDay[number],i)=><div key={i} className={s.block} title={`${time(slot.startHour)} – ${time(slot.endHour)}`} style={{left:`${offset(slot.startHour)}%`,width:`${(slot.endHour-slot.startHour)/11*100}%`}}><span>{time(slot.startHour)}–{time(slot.endHour)}</span></div>)}
 {row.slots===undefined&&<span className={s.noData}>Not submitted yet</span>}
 </div><div className={s.match}><span className={active?s[row.status]:s.neutral}>{active?labels[row.status]:row.slots===undefined?'Not submitted':`${duration(row.slots.reduce((n,x)=>n+x.endHour-x.startHour,0))} available`}</span>{active&&row.overlap>0&&<small>{duration(row.overlap)} / {duration(hour(end)-hour(start))} · {Math.round(row.coverage*100)}%</small>}</div></div>)}
 {!rows.length&&<p className={s.empty}>Add members in the Members tab to see their availability here.</p>}
 </div></div>
 <div className={s.legend}><span><i/> Available time</span><span><i/> Selected range</span><p>Full coverage first, then partial matches by overlap. No-overlap and unsubmitted members stay below. Partial overlap does not confirm availability for the whole meeting.</p></div>
 <p className={s.note}>Times use this device’s local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). {shared?"Member schedules are shared on this server.":"Member schedules currently come from this browser’s local preview."}</p>
 </>}
 </>:<><div className={s.weekHeader}><strong>Monday – Sunday · Weekly schedule</strong><div className={s.unavailable}><label>Mark unavailable <select aria-label="Weekday to mark unavailable" value={day} onChange={e=>setDay(e.target.value)}>{WEEKDAYS.map(d=><option key={d}>{d}</option>)}</select></label><button onClick={()=>onSave({...data,weeklyAvailability:{...availability,[email]:{...availability[email],[day]:[]}}})}>Mark {day} unavailable</button></div></div><div className={s.editor}><Availability slots={mySlots} onChange={update}/></div><p className={s.note}>{shared?"Changes save automatically to the shared organization.":"Changes save automatically in this browser."} Empty days remain “not submitted” until edited or marked unavailable.</p></>}

 {canSchedule&&viewMember&&data.members.find(m=>m.id===viewMember)&&<MemberAvailabilityPreview member={data.members.find(m=>m.id===viewMember)!} availability={availability} onClose={()=>setViewMember(null)}/>}
 {canSchedule&&meeting&&<EventComposer onCommit={onCommit} selection={meeting} data={data} onSave={onSave} onClose={()=>setMeeting(null)}/>}
 </section>;
}
