import assert from 'node:assert/strict';
import pg from 'pg';
import {withOrganizationStorage} from '../app/lib/postgres-storage.ts';
import {createOrganization,joinOrganizationCode,regularAccess} from '../app/lib/organization-access.ts';
if(!process.env.DATABASE_URL)throw Error('Use the isolated staging database.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:{ca:process.env.DATABASE_SSL_CA,rejectUnauthorized:true}});
await client.connect();
const before=(await client.query('SELECT id, document FROM time2work_private.organizations ORDER BY id')).rows;
const admin={email:'db-check-admin@example.invalid',name:'Database check'};
const people=[{email:'db-check-a@example.invalid',name:'A'},{email:'db-check-b@example.invalid',name:'B'}];
let id;
try{
 const created=await withOrganizationStorage({action:'org-create'},async()=>createOrganization('Temporary database verification','test-only-password',admin));id=created.org.id;
 for(const p of people)await withOrganizationStorage({action:'org-join-code',code:created.org.code},async()=>joinOrganizationCode(created.org.code,'test-only-password',p));
 await Promise.all(people.map(p=>withOrganizationStorage({id},async()=>regularAccess({id,action:'org-save',patch:{weeklyAvailability:{[p.email]:{Mon:[{startHour:10,endHour:12}]}}}},p))));
 const read=()=>withOrganizationStorage({id},async()=>regularAccess({id,action:'org-read'},admin));
 assert.equal(Object.keys((await read()).workspace.weeklyAvailability).length,2);
 await assert.rejects(withOrganizationStorage({id},async()=>{regularAccess({id,action:'org-save',name:'Must rollback'},admin);throw Error('abort');}),/abort/);
 assert.equal((await read()).org.name,'Temporary database verification');
 await assert.rejects(withOrganizationStorage({id},async()=>regularAccess({id,action:'org-save',name:'Forbidden'},people[0])),/Invalid organization name/);
 const invite=await withOrganizationStorage({id},async()=>regularAccess({id,action:'org-invite',role:'guest'},admin));
 const guest={email:'db-check-guest@example.invalid',name:'Guest'};
 const view=await withOrganizationStorage({id},async()=>regularAccess({id,action:'org-join',token:invite.token},guest));
 assert.equal(view.workspace.members.length,1);assert.equal(view.role,'guest');assert.deepEqual(Object.keys(view.workspace.weeklyAvailability),[guest.email]);
 console.log('PASS: concurrent member saves, transaction rollback, member write restriction, guest isolation.');
}finally{
 if(id)await client.query('DELETE FROM time2work_private.organizations WHERE id=$1',[id]);
 const after=(await client.query('SELECT id, document FROM time2work_private.organizations ORDER BY id')).rows;
 assert.deepEqual(after,before);console.log(`PASS: all ${before.length} imported records unchanged; temporary fixture removed.`);
 await client.end();
}
