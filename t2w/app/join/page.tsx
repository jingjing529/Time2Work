"use client";
import {useEffect,useState} from 'react';
import {readOrganizations,saveOrganizations} from '../lib/organizations';
import {persistWorkspace} from '../lib/workspace';
import {useTheme} from '../lib/theme';
import brand from '../page.module.css';
import s from '../components/OrgCalendar.module.css';
export default function JoinPage(){
 const {dark}=useTheme();const [error,setError]=useState('');const [login,setLogin]=useState('');
 useEffect(()=>{let active=true;(async()=>{try{
  const token=new URLSearchParams(window.location.hash.slice(1)).get('token');if(!token)throw new Error('Invitation link is missing. Ask an admin to copy a new link.');
  const r=await fetch('/api/organization-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'redeem',token})});const result=await r.json();if(!r.ok)throw new Error(result.error);if(!active)return;
  if(result.org.quick){const orgs=readOrganizations();if(!orgs.some(o=>o.id===result.org.id)){persistWorkspace(result.org.id,result.workspace);saveOrganizations([...orgs,{...result.org,inviteToken:token,invited:true,visited:Date.now()}]);}else saveOrganizations(orgs.map(o=>o.id===result.org.id?{...o,inviteToken:token}:o));window.location.replace(`/organizations/${result.org.id}`);return;}
  const userResponse=await fetch('/api/user');if(!userResponse.ok){if(active)setLogin(`/api/auth/google?returnTo=${encodeURIComponent(window.location.pathname+window.location.hash)}`);return;}
  const joinedResponse=await fetch('/api/organization-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'org-join',id:result.org.id,token})});
  const joined=await joinedResponse.json();if(!joinedResponse.ok)throw new Error(joined.error);
  const orgs=readOrganizations(),existing=orgs.find(o=>o.id===result.org.id);
  persistWorkspace(result.org.id,joined.workspace);
  saveOrganizations([...orgs.filter(o=>o.id!==result.org.id),{...existing,...joined.org,invited:true,visited:Date.now()}]);
  window.location.replace(`/organizations/${result.org.id}`);
 }catch(e){if(active)setError(e instanceof Error?e.message:'Unable to join.');}})();return()=>{active=false;};},[]);
 return <main className={brand.page} data-theme={dark?'dark':'light'}><section className={s.panel} style={{maxWidth:560,margin:'80px auto'}}><h2>Join your organization</h2>{error?<p role="alert">{error}</p>:login?<><p>Sign in to identify yourself. No organization password is required.</p><a href={login}>Continue with Google →</a></>:<p>Opening your invitation…</p>}<p>Quick organizations let you browse first. Choose a guest name and password or Google when you’re ready to add availability.</p></section></main>;
}
