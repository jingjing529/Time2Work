"use client";
import {useState} from 'react';
import Link from 'next/link';
import AvailabilityHeatmap from './AvailabilityHeatmap';
import Availability from './Availability';
import GuestIdentity from './GuestIdentity';
import {organizationAccess,type Organization} from '../lib/organizations';
import {WEEKDAYS} from '../lib/weekly-availability';
import type {Workspace} from '../lib/workspace';
import type {TimeSlot} from '../lib/availability';
import {useTheme} from '../lib/theme';
import brand from '../page.module.css';
import s from './QuickMeet.module.css';
export default function QuickMeet({org,data,user,error,message,onSave,onReady}:{org:Organization;data:Workspace;user:{name:string;email:string};error:string;message:string;onSave:(data:Workspace)=>boolean;onReady:(identity:{name:string;email:string},data:Workspace)=>void}){
 const {dark,toggleTheme}=useTheme();const [editing,setEditing]=useState(false);const [notice,setNotice]=useState('');const [copying,setCopying]=useState(false);
 const startHour=org.startHour??8,endHour=org.endHour??19,timeZone=org.timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone;
 const days=org.dates||WEEKDAYS;const availability=data.weeklyAvailability||{};
 const labels=days.map(day=>/^\d{4}-/.test(day)?new Date(`${day}T12:00`).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):day);
 const slots:TimeSlot[]=days.flatMap((day,index)=>(availability[user.email]?.[day]||[]).map(slot=>({...slot,day:index})));
 function update(next:TimeSlot[]){const personal={...availability[user.email]};days.forEach((day,index)=>{personal[day]=next.filter(slot=>slot.day===index).map(({startHour,endHour})=>({startHour,endHour}));});onSave({...data,weeklyAvailability:{...availability,[user.email]:personal}});}
 async function copy(){setCopying(true);try{let token=org.inviteToken;if(org.accessKey)token=(await organizationAccess(org,data,'invite')).result.token;if(!token)throw new Error('Reopen your invitation to copy the link.');await navigator.clipboard.writeText(`${location.origin}/join#token=${encodeURIComponent(token)}`);setNotice('Invite link copied!');}catch(e){setNotice(e instanceof Error?e.message:'Use your invitation link to share this meeting.');}finally{setCopying(false);}}
 return <div className={`${brand.page} ${s.page}`} data-theme={dark?'dark':'light'}><header className={s.top}><Link href="/" className={brand.brand} aria-label="Time2Work home"><span className={brand.waveLogo} aria-hidden="true"><span>Time2Work</span><span>Time2Work</span></span><span className={s.quickLabel}>Quick meet</span></Link><button onClick={toggleTheme} aria-label={dark?'Switch to light mode':'Switch to dark mode'}>{dark?'☀':'☾'}</button></header><main className={s.main}><header className={s.heading}><div><span className={s.eyebrow}>A TIME FOR EVERYONE</span><h1>{org.name}</h1><p>{String(startHour).padStart(2,'0')}:00–{String(endHour).padStart(2,'0')}:00 · {timeZone}<br/>{data.members.length} participant{data.members.length===1?'':'s'} · {org.dates?`${labels[0]}${days.length>1?` – ${labels.at(-1)}`:''}`:'Weekly availability · Mon–Sun'}</p></div><button className={s.copy} disabled={copying} onClick={copy}>{copying?'Copying…':'Copy link ↗'}</button></header>{(notice||message)&&<p className={s.notice} role="status">{notice||message}</p>}{error&&<p role="alert" className={s.error}>{error}</p>}<section className={s.toolbar}><div><h2>{editing?'Your availability':'When can everyone meet?'}</h2><p>{editing?'Paint your available times. Changes save automatically.':'Share the link. Add your times. Find your overlap.'}</p></div><button className={s.primary} onClick={()=>setEditing(!editing)}>{editing?'Done · View group availability':user.email==='visitor'?'＋ Add my availability':`Edit my availability · ${user.name}`}</button></section>{editing?(user.email==='visitor'?<GuestIdentity org={org} onReady={onReady}/>:<section className={s.editor}><Availability startHour={startHour} endHour={endHour} days={labels} slots={slots} onChange={update}/><p>Saved to this meeting · {timeZone}</p></section>):<section className={s.heatmap}><AvailabilityHeatmap key={days.join(',')} quick startHour={startHour} endHour={endHour} timeZone={timeZone} dayKeys={days} members={data.members} availability={availability}/></section>}<footer className={s.footer}>No account needed · All times in {timeZone} · Updates refresh every 5 seconds</footer></main></div>;
}
