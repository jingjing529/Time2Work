import type {Organization} from './organizations';
export async function regularRequest(org:Organization,action:string,extra:Record<string,unknown>={}){
 const r=await fetch('/api/organization-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:org.id,...extra})});const result=await r.json();if(!r.ok)throw new Error(result.error);return result;
}
