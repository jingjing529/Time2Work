import type {Organization} from './organizations';
export function guestSession(id:string){try{return JSON.parse(localStorage.getItem(`t2w-guest-${id}`)||'null');}catch{return null;}}
export async function quickRequest(org:Organization,action:string,extra:Record<string,unknown>={}){
 const r=await fetch('/api/organization-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:org.id,accessKey:org.accessKey,token:org.inviteToken,session:guestSession(org.id)?.session,...extra})});const result=await r.json();if(!r.ok)throw new Error(result.error);return result;
}
