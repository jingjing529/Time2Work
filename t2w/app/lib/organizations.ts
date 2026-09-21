export interface Organization { id: string; name: string; code: string; passwordHash: string; visited: number; accessKey?:string; invited?:boolean; quick?:boolean; dates?:string[]; timeZone?:string; startHour?:number; endHour?:number; inviteToken?:string; }
// Legacy browser data is read only, solely to retain access to old anonymous links.
const key = "time2work-local-organizations-v1";
let memory:Organization[]=[];
export function readOrganizations(): Organization[] {
 try{return [...memory,...JSON.parse(localStorage.getItem(key)||"[]").filter((o:Organization)=>!memory.some(m=>m.id===o.id))];}catch{return memory;}
}
export function saveOrganizations(orgs:Organization[]) { memory=orgs; }
export async function organizationRequest(action:string,extra:Record<string,unknown>={}){
 const r=await fetch('/api/organization-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...extra})});const result=await r.json();if(!r.ok)throw new Error(result.error);return result;
}
export async function passwordHash(password: string, salt: string) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2", salt: new TextEncoder().encode(salt), iterations:100000, hash:"SHA-256"}, material, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2,"0")).join("");
}

export async function organizationAccess(org:Organization,workspace:unknown,action:string,password?:string) {
 const result=await organizationRequest(action,{id:org.id,org,accessKey:org.accessKey,password});return {updated:org,result};
}
