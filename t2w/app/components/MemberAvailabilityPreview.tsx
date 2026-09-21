"use client";
import {useEffect,useRef} from 'react';
import type {Member,AvailabilityDay} from '../lib/workspace';
import {WEEKDAYS} from '../lib/weekly-availability';
import s from './TeamAvailability.module.css';
const time=(n:number)=>`${String(Math.floor(n)).padStart(2,'0')}:${String(Math.round(n%1*60)).padStart(2,'0')}`;
export default function MemberAvailabilityPreview({member,availability,onClose}:{member:Member;availability:Record<string,Record<string,AvailabilityDay>>;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);useEffect(()=>{dialog.current?.showModal();},[]);
 return <dialog className={s.memberDialog} ref={dialog} aria-label={`${member.name} weekly availability`} onCancel={e=>{e.preventDefault();onClose();}}><header><div><h2>{member.name}</h2><p>Weekly availability · Monday–Sunday</p></div><button aria-label="Close member availability" onClick={onClose}>×</button></header><p>{member.email}</p>{WEEKDAYS.map(day=>{const slots=availability[member.email]?.[day];return <section className={s.previewDay} key={day}><strong>{day}</strong><div><div className={s.previewTrack}>{(slots||[]).map((slot,i)=><div key={i} title={`${time(slot.startHour)}–${time(slot.endHour)}`} style={{left:`${(slot.startHour-8)/11*100}%`,width:`${(slot.endHour-slot.startHour)/11*100}%`}}/>)}</div><small>{slots===undefined?'Not submitted':slots.length?slots.map(slot=>`${time(slot.startHour)}–${time(slot.endHour)}`).join(' · '):'Unavailable'}</small></div></section>;})}<p>Timeline: 08:00–19:00 · {Intl.DateTimeFormat().resolvedOptions().timeZone}</p></dialog>;
}
