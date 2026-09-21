"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import QuickCreate from "../components/QuickCreate";
import AccountMenu from "../components/AccountMenu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../lib/theme";
import { organizationRequest, type Organization } from "../lib/organizations";

import brand from "../page.module.css";
import s from "./page.module.css";

export default function HomePage() {
  const {dark, toggleTheme} = useTheme();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const joinDialog = useRef<HTMLDialogElement>(null);
  const [authPending, setAuthPending] = useState(true);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<{name?: string; email?: string} | null>(null);
  useEffect(() => {
    fetch("/api/user").then(async r => r.ok ? r.json() : null).then(data=>{
      if (!data?.email) return;
      setUser(data);
      organizationRequest("org-list").then(result=>setOrgs(result.organizations)).catch(e=>setError(e.message));
      const action = new URLSearchParams(location.search).get("action");
      if (action === "join") joinDialog.current?.showModal();
      if (action === "create") dialog.current?.showModal();
      if (action === "join" || action === "create") history.replaceState(null, "", location.pathname);
    }).catch(()=>{}).finally(()=>setAuthPending(false));
  }, []);
  function openAction(action: "join" | "create") {
    if (!user) { location.assign(`/api/auth/google?returnTo=${encodeURIComponent(`/?action=${action}`)}`); return; }
    setError(""); setCreateError("");
    (action === "join" ? joinDialog : dialog).current?.showModal();
  }
  function enter(org: Organization) {
    router.push(`/organizations/${org.id}`);
  }
  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) { openAction("join"); return; } setError(""); setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const code = String(data.get("code")).trim().toUpperCase();
      const result=await organizationRequest('org-join-code',{code,password:String(data.get('password'))});
      const org=result.org;
      enter(org);
    } catch { setError("Unable to join. Please try again."); } finally { setBusy(false); }
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) { openAction("create"); return; } setCreateError(""); setBusy(true);
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    if (!name) { setCreateError("Please enter an organization name."); setBusy(false); return; }
    try {
      const result=await organizationRequest('org-create',{name,password:String(data.get('password'))});
      const id=result.org.id;
      dialog.current?.close(); router.push(`/organizations/${id}`);
    } catch { setCreateError("Could not create your organization. Please try again."); } finally { setBusy(false); }
  }
  const filtered = orgs.filter(o=>o.name.toLowerCase().includes(query.toLowerCase()) || o.code.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.visited-a.visited);
  return <div className={`${brand.page} ${s.page}`} data-theme={dark?"dark":"light"}>
    <header className={s.header}>
      <Link href="/" className={brand.brand} aria-label="Time2Work home"><span className={brand.waveLogo} aria-hidden="true"><span>Time2Work</span><span>Time2Work</span></span></Link>
      
      <div className={s.account}><button className={s.theme} onClick={toggleTheme} aria-label={dark?"Switch to light mode":"Switch to dark mode"}>{dark?"☀":"☾"}</button>{user ? <AccountMenu name={user.name} email={user.email}/> : <a className={s.login} href="/api/auth/google">Log in with Google</a>}</div>
    </header>
    <main className={s.main}>
      {error&&!joinDialog.current?.open&&<p className={s.error} role="alert">{error}</p>}<div className={s.welcome}><h1 aria-label="Time2Work"><span className={brand.waveLogo} aria-hidden="true"><span>Time2Work</span><span>Time2Work</span></span></h1></div>
      <div className={s.entryGrid}>
        <button className={`${s.entryButton} ${s.joinEntry}`} disabled={authPending} onClick={()=>openAction("join")}><span><strong>Join organization</strong><small>Have a code?</small></span><span className={s.entryArrow} aria-hidden="true">→</span></button>
        <button className={`${s.entryButton} ${s.createEntry}`} disabled={authPending} onClick={()=>openAction("create")}><span><strong>Create organization</strong><small>For your regular team</small></span><span className={s.entryArrow} aria-hidden="true">→</span></button>
        <QuickCreate buttonClassName={`${s.entryButton} ${s.quickEntry}`} hideCaption><span><strong>Quick meet</strong><small>No account needed</small></span><span className={s.entryArrow} aria-hidden="true">→</span></QuickCreate>
      </div>
      {user && <>
      <section className={s.organizations}><div className={s.sectionHeader}><div><h2>My organizations <span>{orgs.length}</span></h2><p>Your teams, all in one place.</p></div><input type="search" aria-label="Search organizations" placeholder="Search organizations…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
      {filtered.length ? <div className={s.cards}>{filtered.map(org=><button className={s.card} key={org.id} onClick={()=>enter(org)}><span className={s.orgIcon}>{org.name.slice(0,1).toUpperCase()}</span><span className={s.role}>{org.quick?"Quick meet":org.invited?"Member":"Owner"}</span><h3>{org.name}</h3><p>{org.code}</p><div><span>{org.quick?"Shared meeting":"Organization"}</span><strong>Open →</strong></div></button>)}</div> : <div className={s.empty}><span aria-hidden="true">▦</span><h3>{query?"No matching organizations":"Your next team starts here"}</h3><p>{query?"Try a different name or organization code.":"Join an organization above, or create a new space for your team."}</p></div>}
      </section><p className={s.previewNote}>Organizations and schedules are saved on the server.</p></>}
    </main>
    <footer className={s.footer}>Time2Work</footer>
    <dialog ref={joinDialog} className={s.dialog}><div className={s.dialogHeader}><h2>Join an organization</h2><button type="button" aria-label="Close join" onClick={()=>joinDialog.current?.close()}>×</button></div><form onSubmit={join}><label htmlFor="org-code">Organization code</label><input id="org-code" name="code" placeholder="e.g. T2W-A1B2C3D4" required autoComplete="off" maxLength={40}/><label htmlFor="org-password">Organization password</label><div className={s.password}><input id="org-password" name="password" type={showPassword?"text":"password"} placeholder="Enter your organization password" autoComplete="current-password" required/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?"Hide":"Show"}</button></div>{error&&<p className={s.error} role="alert">{error}</p>}<button className={s.primary} disabled={busy}>{busy?"Please wait…":"Join organization"}<span>→</span></button></form></dialog>
    <dialog ref={dialog} className={s.dialog} onClick={e=>{if(e.target===e.currentTarget) dialog.current?.close();}}><form onSubmit={create}><div className={s.dialogHeader}><h2>Create your organization</h2><button type="button" aria-label="Close" onClick={()=>dialog.current?.close()}>×</button></div><p>A new home for your team&apos;s time.</p><label htmlFor="create-name">Organization name</label><input id="create-name" name="name" placeholder="e.g. Product Design Team" required maxLength={60} autoFocus/><label htmlFor="create-password">Organization password</label><input id="create-password" name="password" type="password" placeholder="At least 6 characters" minLength={6} required autoComplete="new-password"/><small>You&apos;ll receive an organization code after creating your space.</small>{createError&&<p className={s.error} role="alert">{createError}</p>}<button className={s.primary} disabled={busy}>{busy?"Creating…":"Create organization →"}</button></form></dialog>
  </div>;
}
