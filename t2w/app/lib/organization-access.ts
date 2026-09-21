import type {Workspace,Member} from "./workspace";
import {randomUUID,randomBytes,createCipheriv,createDecipheriv,createHash,pbkdf2Sync,timingSafeEqual} from 'node:crypto';
import {readdirSync,mkdirSync,readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs';
import path from 'node:path';
const root=path.join(process.cwd(),'.local','organizations');
function directory(){mkdirSync(root,{recursive:true,mode:0o700});}
function key(){directory();const file=path.join(root,'encryption.key');if(!existsSync(file))writeFileSync(file,randomBytes(32),{mode:0o600,flag:'wx'});return readFileSync(file);}
function encrypt(value:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);return Buffer.concat([iv,cipher.update(value,'utf8'),cipher.final(),cipher.getAuthTag()]).toString('base64url');}
function decrypt(value:string){const bytes=Buffer.from(value,'base64url'),decipher=createDecipheriv('aes-256-gcm',key(),bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(-16));return Buffer.concat([decipher.update(bytes.subarray(12,-16)),decipher.final()]).toString('utf8');}
type RecordData={roleInvites?:Record<string,{role:"member"|"guest";expires:number}>;accessHash:string;org:{id:string;name:string;code:string;passwordHash:string;quick?:boolean;dates?:string[];timeZone?:string;startHour?:number;endHour?:number};guests?:Record<string,{member:Member;passwordHash:string}>;sessions?:Record<string,{email:string;expires:number}>;workspace:Record<string,unknown>;password?:string;inviteHash?:string;inviteSecret?:string;expires?:number};
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
function file(id:string){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid organization.');directory();return path.join(root,`${id}.json`);}
function save(id:string,data:RecordData){const target=file(id),tmp=`${target}.${randomBytes(6).toString('hex')}.tmp`;writeFileSync(tmp,JSON.stringify(data),{mode:0o600});renameSync(tmp,target);}
function load(id:string):RecordData|null{const target=file(id);return existsSync(target)?JSON.parse(readFileSync(target,'utf8')):null;}
export function manageAccess(input:{org:RecordData['org'];workspace:Record<string,unknown>;accessKey:string;action:string;password?:string}){
 if(!/^[a-f0-9]{64}$/.test(input.accessKey||''))throw new Error('Invalid admin access key.');
 const id=input.org?.id;let data=load(id);
 if(data&&!timingSafeEqual(Buffer.from(data.accessHash),Buffer.from(hash(input.accessKey))))throw new Error('This browser does not have the organization admin key.');
 if(!data){if(!input.org.name||!input.org.code||!/^[a-f0-9]{64}$/.test(input.org.passwordHash))throw new Error('Invalid organization details.');data={accessHash:hash(input.accessKey),org:input.org,workspace:input.workspace};}
 if(input.action==='password'){
  if(typeof input.password!=='string'||input.password.length<6||input.password.length>128)throw new Error('Use a password between 6 and 128 characters.');
  data.password=encrypt(input.password);data.org.passwordHash=pbkdf2Sync(input.password,id,100000,32,'sha256').toString('hex');
  delete data.roleInvites;delete data.inviteHash;delete data.inviteSecret;delete data.expires;save(id,data);return {passwordHash:data.org.passwordHash};
 }
 if(input.action==='show'){save(id,data);return {password:data.password?decrypt(data.password):null};}
 if(input.action!=='invite')throw new Error('Invalid action.');
 data.org.name=input.org.name;if(!data.org.quick)data.workspace=input.workspace;
 const token=data.inviteSecret&&data.expires&&data.expires>Date.now()?decrypt(data.inviteSecret):randomBytes(32).toString('base64url');data.inviteSecret=encrypt(token);data.inviteHash=hash(token);data.expires=Date.now()+7*86400000;save(id,data);
 return {token:`${id}.${token}`,expires:data.expires};
}
export function redeemInvite(token:string){
 const [id,secret]=token.split('.');if(!secret||secret.length>100)throw new Error('Invalid invitation.');const data=load(id);
 if(!data?.inviteHash||!data.expires||data.expires<Date.now()||!timingSafeEqual(Buffer.from(data.inviteHash),Buffer.from(hash(secret))))throw new Error('This invitation expired or was replaced. Ask an admin for a new link.');
 return {org:data.org,workspace:data.workspace};
}

type QuickInput={action:string;timeZone?:string;startHour?:number;endHour?:number;dates?:string[];id?:string;name?:string;password?:string;token?:string;accessKey?:string;session?:string;patch?:Partial<Workspace>};
const attempts=new Map<string,{count:number;until:number}>();
export function quickAccess(input:QuickInput,google?:{email:string;name:string}){
 if(input.action==='quick-create'){
  const name=input.name?.trim();if(!name||name.length>80)throw new Error('Enter an organization name (up to 80 characters).');
  if(input.dates&&(!Array.isArray(input.dates)||!input.dates.length||input.dates.length>14||input.dates.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)))throw new Error('Choose 1–14 valid candidate dates.');
  const startHour=input.startHour??9,endHour=input.endHour??18,timeZone=input.timeZone||'UTC';
  if(!Number.isInteger(startHour)||!Number.isInteger(endHour)||startHour<0||endHour>24||endHour<=startHour)throw new Error('Choose an end time after the start time, within one day.');
  try{new Intl.DateTimeFormat('en',{timeZone});}catch{throw new Error('Choose a valid timezone.');}
  const id=randomUUID(),accessKey=randomBytes(32).toString('hex');const org={id,name,code:`T2W-${id.slice(0,8).toUpperCase()}`,passwordHash:hash(randomBytes(32).toString('hex')),quick:true,timeZone,startHour,endHour,...(input.dates?{dates:[...new Set(input.dates)].sort()}: {})};
  const workspace:Workspace={description:'Find a time together. No account required.',cover:'',avatar:'',members:[],tasks:[],notices:[],calendarId:'',weeklyAvailability:{}};
  const invite=manageAccess({org,workspace:workspace as unknown as Record<string,unknown>,accessKey,action:'invite'});
  return {org:{...org,accessKey},workspace,...invite};
 }
 const id=input.id||'',data=load(id);if(!data?.org.quick)throw new Error('Quick organization not found.');
 const admin=!!input.accessKey&&hash(input.accessKey)===data.accessHash;
 const session=input.session?data.sessions?.[hash(input.session)]:undefined;
 const email=session&&session.expires>Date.now()?session.email:google&&(data.workspace as unknown as Workspace).members.some(m=>m.email===google.email)?google.email:undefined;
 let invited=false;if(input.token){try{invited=redeemInvite(input.token).org.id===id;}catch{}}
 if(!admin&&!email&&!invited)throw new Error('Open a valid invite link to access this organization.');
 const workspace=data.workspace as unknown as Workspace;
 if(input.action==='quick-identify'){
  let member:Member;
  if(google){member=workspace.members.find(m=>m.email===google.email)||{id:randomUUID(),name:google.name,email:google.email,role:admin?'admin':'member'};}
  else{
   const name=input.name?.trim().replace(/\s+/g,' ');if(!name||name.length>60)throw new Error('Enter your name (up to 60 characters).');
   if(input.password&&(input.password.length<6||input.password.length>128))throw new Error('Use a personal password between 6 and 128 characters.');
   const nameKey=hash(name.toLowerCase()),attemptKey=`${id}:${nameKey}`,limit=attempts.get(attemptKey);
   if(limit&&limit.until>Date.now()&&limit.count>=8)throw new Error('Too many attempts. Try again in 15 minutes.');
   const passwordHash=pbkdf2Sync(input.password||'',`${id}:${nameKey}`,100000,32,'sha256').toString('hex');
   data.guests??={};const guest=data.guests[nameKey];
   if(guest&&guest.passwordHash!==passwordHash){attempts.set(attemptKey,{count:(limit&&limit.until>Date.now()?limit.count:0)+1,until:Date.now()+15*60000});throw new Error('That name is already in use. Enter its password, or choose a different name.');}
   if(!guest&&workspace.members.some(m=>m.name.toLowerCase()===name.toLowerCase()))throw new Error('That name is already in use. Choose another name or continue with Google.');
   member=guest?.member||{id:randomUUID(),name,email:`guest:${randomUUID()}`,role:admin?'admin':'member'};
   data.guests[nameKey]={member,passwordHash};attempts.delete(attemptKey);
  }
  if(!workspace.members.some(m=>m.email===member.email))workspace.members.push(member);
  const secret=randomBytes(32).toString('base64url');data.sessions??={};for(const [key,value] of Object.entries(data.sessions))if(value.expires<Date.now())delete data.sessions[key];data.sessions[hash(secret)]={email:member.email,expires:Date.now()+30*86400000};save(id,data);
  return {org:data.org,workspace,identity:{name:member.name,email:member.email},session:secret};
 }
 if(input.action==='quick-save'){
  const patch=input.patch||{};
  if(input.name!==undefined){if(!admin||!input.name.trim()||input.name.length>80)throw new Error('Invalid organization name.');data.org.name=input.name.trim();}
  if(patch.weeklyAvailability){
   if(!email)throw new Error('Choose a name and password or Google before editing availability.');
   if(Object.keys(patch.weeklyAvailability).some(key=>key!==email))throw new Error('You can only edit your own availability.');
   for(const days of Object.values(patch.weeklyAvailability))for(const [day,slots] of Object.entries(days)){
    if(!(data.org.dates||['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).includes(day)||!Array.isArray(slots)||slots.length>100||slots.some(slot=>!Number.isFinite(slot.startHour)||!Number.isFinite(slot.endHour)||slot.startHour<(data.org.startHour??8)||slot.endHour>(data.org.endHour??19)||slot.startHour>=slot.endHour))throw new Error('Invalid availability.');
   }
   workspace.weeklyAvailability={...workspace.weeklyAvailability,...patch.weeklyAvailability};
  }
  const fields=['description','members','tasks','notices','calendarId','events'] as const;
  for(const field of fields)if(patch[field]!==undefined){if(!admin)throw new Error('Only the creator can change organization settings.');Object.assign(workspace,{[field]:patch[field]});}
  save(id,data);
 }else if(input.action!=='quick-read')throw new Error('Unknown quick action.');
 return {org:data.org,workspace,identity:email?workspace.members.find(m=>m.email===email):null};
}

/** Authenticated, shared organization access. Guest responses never include team data. */
export function regularAccess(input:{id?:string;org?:RecordData['org'];workspace?:Workspace;accessKey?:string;action:string;token?:string;role?:string;patch?:Partial<Workspace>;password?:string;name?:string}, user:{email:string;name:string}) {
 const id=input.id||input.org?.id||'';let record=load(id);
 if(!record){
  if(!input.org||!input.workspace||!input.accessKey)throw new Error('Organization not found.');
  const owner=input.workspace.members?.find((m:Member)=>m.email===user.email&&m.role==='admin');
  if(!owner)throw new Error('Only the creator can initialize an organization.');
  manageAccess({org:input.org,workspace:input.workspace as unknown as Record<string,unknown>,accessKey:input.accessKey,action:'show'});record=load(id)!;
 }
 if(record.org.quick)throw new Error('Use Quick meet access.');
 const w=record.workspace as unknown as Workspace;
 let member=w.members.find(m=>m.email===user.email);
 if(input.action==='org-join'){
  const links=record.roleInvites||{};
  let invite=links[hash(String(input.token))];
  if(!invite&&input.token){try{if(redeemInvite(input.token).org.id===id)invite={role:'member',expires:Date.now()+1000};}catch{}}
  if(!invite||invite.expires<Date.now())throw new Error('Invitation expired. Ask for a new link.');
  if(!member){member={id:randomUUID(),name:user.name,email:user.email,role:invite.role};w.members.push(member!);save(id,record);}
 }
 if(!member)throw new Error('You are not a member of this organization.');
 const admin=member.role==='admin';
 if(input.action==='org-invite'){
  if(!admin)throw new Error('Admin access required.');
  const role=input.role==='guest'?'guest':'member',token=`${id}.${randomBytes(32).toString('base64url')}`;
  record.roleInvites??={};record.roleInvites[hash(token)]={role,expires:Date.now()+7*86400000};save(id,record);return {token};
 }
 if(['password','show','invite'].includes(input.action)){
  if(!admin)throw new Error('Admin access required.');
  if(input.action==='show')return {password:record.password?decrypt(record.password):null};
  if(input.action==='password'){
   if(typeof input.password!=='string'||input.password.length<6||input.password.length>128)throw new Error('Use a password between 6 and 128 characters.');
   record.password=encrypt(input.password);record.org.passwordHash=pbkdf2Sync(input.password,id,100000,32,'sha256').toString('hex');delete record.roleInvites;delete record.inviteHash;delete record.inviteSecret;delete record.expires;save(id,record);return {passwordHash:record.org.passwordHash};
  }
  return regularAccess({id,action:'org-invite',role:'member'},user);
 }
 if(input.action==='org-save'){
  const patch=input.patch||{};
  if(input.name!==undefined){if(!admin||!input.name.trim()||input.name.length>80)throw new Error('Invalid organization name.');record.org.name=input.name.trim();}
  if(patch.weeklyAvailability){
   if(Object.keys(patch.weeklyAvailability).some(e=>e!==user.email))throw new Error('Only your own availability can be edited.');
   for(const [day,slots] of Object.entries(patch.weeklyAvailability[user.email]||{})){
    if(!['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].includes(day)||!Array.isArray(slots)||slots.some((s:{startHour:number;endHour:number})=>!Number.isFinite(s.startHour)||!Number.isFinite(s.endHour)||s.startHour<8||s.endHour>19||s.startHour>=s.endHour))throw new Error('Invalid availability.');
   }
   w.weeklyAvailability={...w.weeklyAvailability,...patch.weeklyAvailability};
  }
  for(const field of ['members','events','description','calendarId','tasks','notices'] as const)if(patch[field]!==undefined){
   if(!admin)throw new Error('Admin access required.');
   if(field==='members'&&(!patch.members!.some((m:Member)=>m.email===user.email&&m.role==='admin')||patch.members!.some((m:Member)=>!['admin','member','guest'].includes(m.role))))throw new Error('Invalid member roles.');
   if(field==='events')for(const event of patch.events||[]){
    if(!event.title?.trim()||!Array.isArray(event.participantIds)||!event.participantIds.length||event.participantIds.some(id=>!w.members.some(m=>m.id===id))||!Number.isFinite(Date.parse(event.start))||Date.parse(event.end)<=Date.parse(event.start))throw new Error('Invalid meeting.');
    if(!(w.events||[]).some(e=>e.id===event.id)&&(w.events||[]).some(e=>e.participantIds.some(id=>event.participantIds.includes(id))&&Date.parse(e.start)<Date.parse(event.end)&&Date.parse(e.end)>Date.parse(event.start)))throw new Error('A participant already has a meeting during this time.');
   }
   Object.assign(w,{[field]:patch[field]});
  }
  save(id,record);
 }
 const ownEvents=(w.events||[]).filter(e=>e.participantIds.includes(member!.id)).map(e=>({...e,participantNames:e.participantIds.map(id=>w.members.find(m=>m.id===id)?.name||'Former member')}));
 const visible=admin?w:member.role==='guest'?{...w,members:w.members.filter(m=>m.id===member!.id),weeklyAvailability:{[user.email]:w.weeklyAvailability?.[user.email]||{}},availability:{},events:ownEvents,tasks:[],notices:[],calendarId:''}:{...w,events:ownEvents,calendarId:''};
 return {org:{id:record.org.id,name:record.org.name,code:record.org.code},workspace:visible,identity:user,role:member.role};
}
export function inviteOrganization(token:string){
 const id=token.split('.')[0],record=load(id);const invite=record?.roleInvites?.[hash(token)];
 if(invite&&invite.expires>Date.now())return {org:{id,name:record!.org.name},role:invite.role};
 return null;
}

export function isQuickOrganization(id:string){return !!load(id)?.org.quick;}

export function organizationIndex(user:{email:string;name:string}){
 if(!existsSync(root))return [];
 return readdirSync(root).filter(name=>/^[a-f0-9-]{36}\.json$/.test(name)).flatMap(name=>{
  const record=load(name.slice(0,-5))!;const member=(record.workspace as unknown as Workspace).members.find(m=>m.email===user.email);
  return member?[{id:record.org.id,name:record.org.name,code:record.org.code,quick:record.org.quick,role:member.role,invited:member.role!=='admin',visited:0}]:[];
 });
}
export function createOrganization(name:string,password:string,user:{email:string;name:string}){
 if(typeof name!=='string'||!name.trim()||name.length>80)throw new Error('Enter an organization name.');
 if(typeof password!=='string'||password.length<6||password.length>128)throw new Error('Use a password between 6 and 128 characters.');
 const id=randomUUID(),org={id,name:name.trim(),code:`T2W-${id.slice(0,8).toUpperCase()}`,passwordHash:pbkdf2Sync(password,id,100000,32,'sha256').toString('hex')};
 const workspace:Workspace={description:'',cover:'',avatar:'',members:[{id:randomUUID(),name:user.name,email:user.email,role:'admin'}],weeklyAvailability:{},events:[],tasks:[],notices:[],calendarId:''};
 save(id,{org,workspace:workspace as unknown as Record<string,unknown>,accessHash:hash(randomBytes(32).toString('hex')),password:encrypt(password)});
 return regularAccess({id,action:'org-read'},user);
}
export function joinOrganizationCode(code:string,password:string,user:{email:string;name:string}){
 if(typeof code!=='string'||typeof password!=='string'||password.length>128)throw new Error('Invalid code or password.');
 const record=existsSync(root)?readdirSync(root).filter(n=>/^[a-f0-9-]{36}\.json$/.test(n)).map(n=>load(n.slice(0,-5))!).find(r=>!r.org.quick&&r.org.code===code.trim().toUpperCase()):undefined;
 if(!record||pbkdf2Sync(password,record.org.id,100000,32,'sha256').toString('hex')!==record.org.passwordHash)throw new Error('Invalid code or password.');
 const workspace=record.workspace as unknown as Workspace;
 if(!workspace.members.some(m=>m.email===user.email)){workspace.members.push({id:randomUUID(),name:user.name,email:user.email,role:'member'});save(record.org.id,record);}
 return regularAccess({id:record.org.id,action:'org-read'},user);
}
