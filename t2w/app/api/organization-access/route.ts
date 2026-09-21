import {NextRequest,NextResponse} from 'next/server';
import {manageAccess,redeemInvite,quickAccess,regularAccess,inviteOrganization,isQuickOrganization,organizationIndex,createOrganization,joinOrganizationCode} from '../../lib/organization-access';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Invalid origin.'},{status:403});
 try{
  const input=await req.json();let google;
  const orgId=input.id||input.org?.id;
  const quickAdmin=['invite','password','show'].includes(input.action)&&orgId&&isQuickOrganization(orgId);
  const openQuick=input.action==='org-open'&&isQuickOrganization(orgId);
  const quick=String(input.action).startsWith('quick-')||quickAdmin||openQuick;
  const token=req.cookies.get('google_access_token')?.value;
  if(token){const r=await fetch('https://www.googleapis.com/oauth2/v2/userinfo',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});if(r.ok){const user=await r.json();if(user.email&&user.verified_email!==false)google={email:user.email,name:user.name||user.email};}}
  if((!quick&&input.action!=='redeem')||(input.action==='quick-identify'&&input.google))if(!google)throw new Error('Sign in with Google first.');
  if(quick&&orgId){input.accessKey=req.cookies.get(`t2w-owner-${orgId}`)?.value||input.accessKey;input.session=req.cookies.get(`t2w-session-${orgId}`)?.value||(req.cookies.get('t2w-ignore-legacy-session')?undefined:input.session);input.token=req.cookies.get(`t2w-invite-${orgId}`)?.value||input.token;}
  if(openQuick)input.action='quick-read';
  let result;
  if(input.action==='org-list')result={organizations:organizationIndex(google!)};
  else if(input.action==='org-create')result=createOrganization(input.name,input.password,google!);
  else if(input.action==='org-join-code')result=joinOrganizationCode(input.code,input.password,google!);
  else if(String(input.action).startsWith('quick-'))result=quickAccess(input,google);
  else if(input.action==='redeem')result=inviteOrganization(String(input.token))||publicInvite(String(input.token));
  else if(quickAdmin)result=manageAccess(input);
  else {
   // Browser snapshots must never initialize or overwrite server records during reads.
   result=regularAccess({id:orgId,action:input.action==='org-open'?'org-read':input.action,patch:input.patch,password:input.password,token:input.token,role:input.role,name:input.name},google!);
  }
  const res=NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
  const cookie=(name:string,value:string)=>res.cookies.set(name,value,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:30*86400});
  const output=result as {org?:{id:string;quick?:boolean;accessKey?:string};session?:string;token?:string};
  const id=output.org?.id||orgId;
  if(id&&quick){if(output.org?.accessKey||input.accessKey)cookie(`t2w-owner-${id}`,output.org?.accessKey||input.accessKey);if(output.session||input.session)cookie(`t2w-session-${id}`,output.session||input.session);if(output.token||input.token)cookie(`t2w-invite-${id}`,output.token||input.token);}
  if(input.action==='redeem'&&output.org?.quick)cookie(`t2w-invite-${id}`,input.token);
  return res;
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to update organization access.'},{status:400});}
}
function publicInvite(token:string){const result=redeemInvite(token);return result.org.quick?result:{org:{id:result.org.id,name:result.org.name},role:'member'};}
