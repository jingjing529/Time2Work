import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const cwd=process.cwd(),dir=mkdtempSync(join(tmpdir(),'t2w-server-storage-'));process.chdir(dir);
const {createOrganization,organizationIndex,regularAccess,joinOrganizationCode}=await import('./organization-access.ts');
after(()=>{process.chdir(cwd);rmSync(dir,{recursive:true,force:true});});
const admin={email:'admin@example.invalid',name:'Admin'},member={email:'member@example.invalid',name:'Member'};
test('server creation, cross-device listing and code joining need no browser snapshots',()=>{
 const result=createOrganization('Storage test','test-password',admin),id=result.org.id;
 assert.equal(organizationIndex(admin)[0].id,id);assert.equal(organizationIndex(member).length,0);
 assert.throws(()=>joinOrganizationCode(result.org.code,'wrong-password',member));
 const joined=joinOrganizationCode(result.org.code,'test-password',member);assert.equal(joined.role,'member');
 assert.equal(organizationIndex(member)[0].id,id);
 regularAccess({id,action:'org-save',patch:{weeklyAvailability:{[member.email]:{Mon:[{startHour:10,endHour:12}]}}}},member);
 assert.equal(regularAccess({id,action:'org-read'},admin).workspace.weeklyAvailability[member.email].Mon[0].endHour,12);
 assert.equal(regularAccess({id,action:'show'},admin).password,'test-password');
 assert.throws(()=>regularAccess({id,action:'show'},member),/Admin/);
});
test('listing and reading leave every saved JSON and encryption key byte unchanged',()=>{
 const folder=join(dir,'.local/organizations');
 const snapshot=()=>Object.fromEntries(readdirSync(folder).map(f=>[f,readFileSync(join(folder,f)).toString('base64')]));
 const before=snapshot();const list=organizationIndex(admin);
 for(const org of list)regularAccess({id:org.id,action:'org-read'},admin);
 assert.deepEqual(snapshot(),before);
});
