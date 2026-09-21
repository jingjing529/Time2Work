"use client";
import {useEffect,useRef,useState,useId} from 'react';
import s from './AccountMenu.module.css';
export default function AccountMenu({name,email}:{name?:string;email?:string}){
 const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);const id=useId();
 useEffect(()=>{function outside(e:PointerEvent){if(!root.current?.contains(e.target as Node))setOpen(false);}function escape(e:KeyboardEvent){if(e.key==='Escape'&&open){setOpen(false);trigger.current?.focus();}}document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open]);
 async function logout(){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/auth/logout',{method:'POST'});if(!r.ok)throw new Error('Could not log out. Please try again.');window.location.replace('/');}catch(e){setError(e instanceof Error?e.message:'Could not log out. Please try again.');setBusy(false);}}
 return <div className={s.root} ref={root}><button ref={trigger} className={s.avatar} aria-label="Account menu" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{(name||email||'Y').slice(0,1).toUpperCase()}</button>{open&&<div id={id} className={s.dropdown}><strong>{name||'Local preview'}</strong><p>{email?.startsWith('guest:')?'Guest account':email==='visitor'?'Guest':email==='local-preview'?'Local preview':email||'Local preview'}</p><button disabled={busy} className={s.logout} onClick={logout}>{busy?'Logging out…':'Log out'}<span aria-hidden="true">↗</span></button>{error&&<p role="alert">{error}</p>}</div>}</div>;
}
