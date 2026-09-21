"use client";
import {use, useEffect, useRef, useState, type FormEvent} from "react";
import {regularRequest} from "../../lib/regular-client";
import QuickMeet from "../../components/QuickMeet";
import GuestIdentity from "../../components/GuestIdentity";
import {quickRequest} from "../../lib/quick-client";
import AccountMenu from "../../components/AccountMenu";
import Link from "next/link";
import MemberTags from "../../components/MemberTags";
import OrganizationSettings from "../../components/OrganizationSettings";
import OrgCalendar from "../../components/OrgCalendar";
import TeamAvailability from "../../components/TeamAvailability";
import {readOrganizations, saveOrganizations, organizationRequest, type Organization} from "../../lib/organizations";
import {persistWorkspace,type Workspace} from "../../lib/workspace";
import {restoreDemoMembers} from "../../lib/demo-members";
import {useTheme} from "../../lib/theme";
import brand from "../../page.module.css";
import s from "./workspace.module.css";

type Tab="Availability"|"Team Availability"|"Members"|"Calendar"|"Settings";
type Modal="settings"|"notice"|"task"|"calendar";
export default function OrganizationPage({params}:{params:Promise<{id:string}>}) {
 const {id}=use(params); const {dark,toggleTheme}=useTheme();
 const [org,setOrg]=useState<Organization|null>(); const [data,setData]=useState<Workspace|null>(null);
 const [user,setUser]=useState({email:"local-preview",name:"You"}); const [preview,setPreview]=useState(false);
 const [tab,setTab]=useState<Tab>("Availability"); const [modal,setModal]=useState<Modal>("task"); const dialog=useRef<HTMLDialogElement>(null);
 const [error,setError]=useState(""); const [message,setMessage]=useState("");
 const pendingSaves=useRef(0);const saveQueue=useRef(Promise.resolve());
 const [calendarError,setCalendarError]=useState(""); const [loading,setLoading]=useState(false);
 useEffect(()=>{let active=true; (async()=>{try {
   const legacy=readOrganizations().find(o=>o.id===id);
   const opened=await organizationRequest('org-open',{id,accessKey:legacy?.accessKey,token:legacy?.inviteToken,session:(await import('../../lib/quick-client')).guestSession(id)?.session});
   const found={...legacy,...opened.org} as Organization;
   if(found?.quick){
    let result=opened;
    const explicitGoogle = new URLSearchParams(location.search).get('google')==='1';
    const signedIn = !result.identity && await fetch('/api/user').then(r=>r.ok).catch(()=>false);
    if(explicitGoogle || signedIn){
     result=await quickRequest(found,'quick-identify',{google:true});history.replaceState(null,'',location.pathname);
    }
    if(!active)return;setOrg({...found,...result.org});setData(result.workspace);persistWorkspace(id,result.workspace);setUser(result.identity||{email:'visitor',name:'Guest'});
    const notice=new URLSearchParams(location.search).get("created");if(notice){setMessage(notice);history.replaceState(null,"",location.pathname);}return;
   }
   let identity={email:"local-preview",name:"You"};
   try {const r=await fetch("/api/user"); if(r.ok) {const u=await r.json();identity={email:u.email,name:u.name||u.email};}}catch{}
   if(!active)return; setOrg(found);setUser(identity);
   if(found) {persistWorkspace(id,opened.workspace);setData(opened.workspace);}
 }catch(e){if(active){setOrg(null);setError(e instanceof Error?e.message:"Unable to load organization.");}}})();return()=>{active=false;};},[id]);
 useEffect(()=>{if(!org)return;let active=true;const timer=setInterval(async()=>{if(pendingSaves.current)return;try{const result=org.quick?await quickRequest(org,'quick-read'):await regularRequest(org,'org-read');if(active&&!pendingSaves.current){setData(result.workspace);persistWorkspace(id,result.workspace);setUser(result.identity||{email:'visitor',name:'Guest'});}}catch{}},5000);return()=>{active=false;clearInterval(timer);};},[id,org]);
 const actualAdmin=org?.quick?!!org.accessKey:!!data?.members.some(m=>m.email===user.email&&m.role==="admin");
 const admin=actualAdmin&&!preview;
 const guest=data?.members.find(m=>m.email===user.email)?.role==='guest';
 const personalEmail=preview?(data?.members.find(m=>m.role==="member")?.email||"member-preview"):user.email;
 function save(next:Workspace) {try{
  persistWorkspace(id,next);setData(next);
  if(org&&data){
   const patch:Record<string,unknown>={};for(const field of ['description','members','tasks','notices','calendarId','events'] as const)if(JSON.stringify(next[field])!==JSON.stringify(data[field]))patch[field]=next[field];
   if(JSON.stringify(next.weeklyAvailability?.[user.email])!==JSON.stringify(data.weeklyAvailability?.[user.email]))patch.weeklyAvailability={[user.email]:next.weeklyAvailability?.[user.email]||{}};
   pendingSaves.current++;saveQueue.current=saveQueue.current.then(async()=>{try{const result=org.quick?await quickRequest(org,'quick-save',{patch}):await regularRequest(org,'org-save',{patch});if(pendingSaves.current===1){setData(result.workspace);persistWorkspace(id,result.workspace);}}catch(e){setError(e instanceof Error?e.message:'Unable to save shared changes.');}finally{pendingSaves.current--;}});
  }
  return true;
 }catch{setError("Could not save. Please try again.");return false;}}
 async function saveMeeting(next:Workspace){if(!org)return false;try{await saveQueue.current;const result=await regularRequest(org,'org-save',{patch:{events:next.events}});setData(result.workspace);persistWorkspace(id,result.workspace);return true;}catch(e){setError(e instanceof Error?e.message:'Unable to save meeting.');return false;}}
 function open(kind:Modal){setModal(kind);setError("");dialog.current?.showModal();}
 async function connect(calendarId:string) {setLoading(true);setCalendarError("");try{const r=await fetch(`/api/calendar?id=${encodeURIComponent(calendarId)}`);const result=await r.json();if(!r.ok)throw new Error(result.error);setMessage(result.more?"Showing the next 100 Google events. Open Google Calendar for more.":"Google Calendar refreshed. Events are read-only here.");return true;}catch(e){setCalendarError(e instanceof Error?e.message:"Unable to load calendar.");return false;}finally{setLoading(false);}}
 async function submit(e:FormEvent<HTMLFormElement>) {e.preventDefault();if(!data||!org||!admin)return; const f=new FormData(e.currentTarget);setError("");let next={...data};
 if(modal==="settings") {const name=String(f.get("name")).trim();if(!name){setError("Organization name is required.");return;}const updated={...org,name};try{await regularRequest(org,"org-save",{name});saveOrganizations(readOrganizations().map(o=>o.id===id?updated:o));setOrg(updated);}catch{setError("Unable to save organization name.");return;}next={...data,description:String(f.get("description")).trim()};}
 if(modal==="notice"){const title=String(f.get("title")).trim(),body=String(f.get("body")).trim();if(!title||!body){setError("Enter a title and announcement.");return;}next={...data,notices:[{id:crypto.randomUUID(),title,body,date:new Date().toISOString()},...data.notices]};}
 if(modal==="task"){const title=String(f.get("title")).trim();if(!title){setError("Enter a task title.");return;}next={...data,tasks:[...data.tasks,{id:crypto.randomUUID(),title,due:String(f.get("due")),assignee:String(f.get("assignee")),kind:f.get("kind")==="meeting"?"meeting":"task",done:false}]};}
 if(modal==="calendar"){const calendarId=String(f.get("calendarId")).trim();if(!await connect(calendarId))return;next={...data,calendarId};}
 if(save(next))dialog.current?.close();
 }
 if(!org||!data)return <main className="min-h-screen bg-gray-50 text-gray-800 p-10"><Link href="/home">← My organizations</Link><p className="mt-8">{org===undefined?"Loading workspace…":error||"Organization unavailable."}</p></main>;
 if(org.quick)return <QuickMeet org={org} data={data} user={user} error={error} message={message} onSave={save} onReady={(identity,workspace)=>{setUser(identity);setData(workspace);persistWorkspace(id,workspace);}}/>;
 return <div className={`${brand.page} ${s.page}`} data-theme={dark?"dark":"light"}>
 <header className={s.header}><Link href="/home" className={brand.brand} aria-label="Time2Work home"><span className={brand.waveLogo} aria-hidden="true"><span>Time2Work</span><span>Time2Work</span></span></Link><div className={s.account}><button onClick={toggleTheme} aria-label={dark?"Switch to light mode":"Switch to dark mode"}>{dark?"☀":"☾"}</button><AccountMenu name={user.name} email={user.email}/></div></header>
 <main className={s.main}>
 <section className={s.identity}><div className={s.simpleIdentity}><div><h1>{org.name} <small>{admin?"Admin":guest?"Guest":"Member"}</small></h1>{data.description&&<p>{data.description}</p>}</div>{admin&&<div>{(['member','guest'] as const).map(role=><button key={role} className={s.outline} onClick={async()=>{try{const result=await regularRequest(org,'org-invite',{role});await navigator.clipboard.writeText(`${location.origin}/join#token=${encodeURIComponent(result.token)}`);setMessage(`${role==='guest'?'Guest':'Member'} invite link copied · Valid for 7 days · Google login required.`);}catch(e){setError(e instanceof Error?e.message:'Could not copy invitation.');}}}>Invite {role} ↗</button>)}</div>}</div>
 <nav className={s.tabs} aria-label="Organization sections">{((guest?["Availability","Calendar"]:["Availability","Team Availability","Members","Calendar",...(admin?["Settings"]:[])]) as Tab[]).map(t=><button key={t} aria-current={tab===t?"page":undefined} onClick={()=>{setTab(t);setMessage("");}}>{t==="Calendar"&&!admin?"My Calendar":t==="Availability"?"My Availability":t}</button>)}</nav></section>
 <div className={s.previewBar}><span>{org.quick?"Quick organization · Shared on this server · Updates refresh every 5 seconds":"Shared organization · Updates refresh every 5 seconds"}</span>{actualAdmin&&!org.quick&&<label><input type="checkbox" checked={preview} onChange={e=>setPreview(e.target.checked)}/> Preview as member{preview&&` · ${data.members.find(m=>m.email===personalEmail)?.name||"Unassigned member"}`}</label>}</div>
 {message&&<p className={s.message} role="status">{message}</p>}{error&&!dialog.current?.open&&<p className={s.error} role="alert">{error}</p>}
 {tab==="Settings"&&admin&&<OrganizationSettings data={data} onSave={save} onEdit={()=>open("settings")} org={org} onOrgChange={setOrg}/>}
 {tab==="Calendar"&&<OrgCalendar shared data={data} email={personalEmail} personal={!admin}/>}
 {!guest&&tab==="Members"&&<section className={s.panel}><div className={s.panelTitle}><div><h2>Members</h2><p>{data.members.length} members in {org.name}</p></div>{admin&&!org.quick&&<div><button className={s.primary} onClick={()=>{if(save(restoreDemoMembers(data)))setMessage("10 demo members and their different weekly schedules are ready. Existing edits were preserved. In Weekly heatmap, use People → Select all to see everyone.");}}>＋ Restore 10 demo members</button></div>}</div><p className={s.muted}>Use Invite member or Invite guest above to share an invitation.</p><div className={s.members}>{(['member','guest'] as const).map(group=><section key={group} className={s.memberGroup}><header className={s.groupHeading}><h3>{group==='guest'?'Guests':'Lab members'} <span>{data.members.filter(m=>group==='guest'?m.role==='guest':m.role!=='guest').length}</span></h3><p>{group==='guest'?'External participants · Personal availability and meetings only':'Your lab team'}</p></header>{!data.members.some(m=>group==='guest'?m.role==='guest':m.role!=='guest')&&<p className={s.groupEmpty}>No {group==='guest'?'guests':'lab members'} yet.</p>}{data.members.filter(m=>group==='guest'?m.role==='guest':m.role!=='guest').map(m=><div key={m.id} className={s.memberRow}><div className={s.memberPerson}><i>{m.name[0]}</i><div><strong>{m.name}{m.email===user.email?" (you)":""}</strong><span className={s.memberEmail}>{m.email}</span></div></div><div className={s.memberTagCell}><MemberTags options={[...new Set(data.members.flatMap(member=>member.tags||[]))].sort()} tags={m.tags||[]} name={m.name} editable={admin} onChange={tags=>save({...data,members:data.members.map(x=>x.id===m.id?{...x,tags}:x)})}/></div><div className={s.memberActions}>{admin&&m.email!==user.email?<><select aria-label={`Role for ${m.name}`} value={m.role} onChange={e=>save({...data,members:data.members.map(x=>x.id===m.id?{...x,role:e.target.value as "admin"|"member"|"guest"}:x)})}><option value="admin">Admin</option><option value="member">Member</option><option value="guest">Guest</option></select><button aria-label={`Remove ${m.name}`} onClick={()=>{if(data.tasks.some(t=>t.assignee===m.email)){setMessage("This member has assigned tasks. Keep them in the roster until those tasks are reassigned.");return;}save({...data,members:data.members.filter(x=>x.id!==m.id)});}}>×</button></>:<small className={s.roleBadge}>{m.role}</small>}</div></div>)}</section>)}</div></section>}
 <div hidden={tab!=="Availability"}>{org.quick&&user.email==='visitor'?<GuestIdentity org={org} onReady={(identity,workspace)=>{setUser(identity);setData(workspace);persistWorkspace(id,workspace);}}/>:<TeamAvailability shared={true} key={`${id}-${personalEmail}`} data={data} email={personalEmail} mode="mine" onSave={save}/>}</div>{!guest&&<div hidden={tab!=="Team Availability"}><TeamAvailability shared={true} data={data} email={personalEmail} mode="team" canSchedule={admin} onCommit={saveMeeting} onSave={save}/></div>}
 </main><footer className={s.footer}>Time2Work <span>A little less back-and-forth. A lot more together.</span></footer>
 <dialog ref={dialog} className={s.dialog}><form onSubmit={submit}><div className={s.panelTitle}><h2>{{settings:"Edit organization",notice:"Post an announcement",task:"Add a task or meeting",calendar:"Connect Google Calendar"}[modal]}</h2><button type="button" aria-label="Close dialog" onClick={()=>dialog.current?.close()}>×</button></div>
 {modal==="settings"&&<><label>Organization name<input name="name" defaultValue={org.name} required maxLength={80}/></label><label>Description<textarea name="description" defaultValue={data.description} maxLength={200}/></label></>}
 {modal==="notice"&&<><label>Title<input name="title" required maxLength={100}/></label><label>Announcement<textarea name="body" required rows={5} maxLength={3000}/></label></>}
 {modal==="task"&&<><label>Title<input name="title" required maxLength={100}/></label><label>Type<select name="kind"><option value="task">Task</option><option value="meeting">Meeting</option></select></label><label>Due date / meeting time<input type="datetime-local" name="due" required/></label><label>Assigned to<select name="assignee">{data.members.map(m=><option key={m.id} value={m.email}>{m.name}</option>)}</select></label></>}
 {modal==="calendar"&&<><ol className={s.instructions}><li>Open Google Calendar on desktop. Create a separate calendar for your organization, or choose an existing shared calendar.</li><li>Open its Settings and sharing. Under “Share with specific people or groups”, add the Google accounts that need access. Reading events only requires “See all event details”.</li><li>Under “Integrate calendar”, copy the Calendar ID and paste it below. Keep the calendar private; no public sharing is required.</li><li>Sign in to Time2Work with a Google account that has access. Enable Google Calendar API in the OAuth client&apos;s Cloud project if needed.</li></ol><a className={s.helpLink} href="https://support.google.com/calendar/answer/37082?hl=en" target="_blank" rel="noreferrer">Google sharing instructions ↗</a><label>Calendar ID<input name="calendarId" defaultValue={data.calendarId} required placeholder="…@group.calendar.google.com"/></label><p className={s.muted}>Connect checks access and reads events. It does not change Google sharing permissions or sync local tasks to Google.</p>{calendarError&&<p className={s.error} role="alert">{calendarError}</p>}</>}
 {error&&<p className={s.error} role="alert">{error}</p>}<button className={s.primary} disabled={loading||!admin}>{loading?"Checking access…":modal==="calendar"?"Check access & connect":"Save changes"}</button></form></dialog>
 </div>;
}
