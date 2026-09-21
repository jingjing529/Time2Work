"use client";
import {useState,type FormEvent} from 'react';
import type {Organization} from '../lib/organizations';
import type {Workspace} from '../lib/workspace';
import {quickRequest} from '../lib/quick-client';
import s from './OrgCalendar.module.css';
export default function GuestIdentity({org,onReady}:{org:Organization;onReady:(identity:{email:string;name:string},workspace:Workspace)=>void}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function identify(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const form=new FormData(e.currentTarget);try{const result=await quickRequest(org,'quick-identify',{name:form.get('name'),password:form.get('password')});onReady(result.identity,result.workspace);}catch(e){setError(e instanceof Error?e.message:'Could not continue.');}finally{setBusy(false);}}
 return <section className={s.panel}><h2>Add your availability</h2><p>Enter your name to get started. This browser remembers you.</p><form className={s.guestForm} onSubmit={identify}><label>Your name<input name="name" required maxLength={60} autoComplete="nickname" placeholder="Name shown to the group"/></label><label>Password (optional)<input name="password" type="password" minLength={6} maxLength={128} autoComplete="current-password" placeholder="Optional · at least 6 characters"/></label><button className={s.primary} disabled={busy}>{busy?'Please wait…':'Start selecting times'}</button></form><p>Without a password, anyone with the link and your name can edit that response. Add a password to protect it or return from another device.</p>{error&&<p role="alert">{error}</p>}<p>Or <a href={`/api/auth/google?returnTo=${encodeURIComponent(`/organizations/${org.id}?google=1`)}`}>continue with Google ↗</a></p></section>;
}
