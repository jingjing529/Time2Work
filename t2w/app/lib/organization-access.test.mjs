import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID,pbkdf2Sync} from 'node:crypto';
const cwd=process.cwd(),temp=mkdtempSync(join(tmpdir(),'t2w-invite-test-'));process.chdir(temp);
const {manageAccess,redeemInvite}=await import('./organization-access.ts');
after(()=>{process.chdir(cwd);rmSync(temp,{recursive:true,force:true});});
const id=randomUUID(),input={org:{id,name:'Test team',code:'TEST',passwordHash:'a'.repeat(64)},workspace:{members:[]},accessKey:'b'.repeat(64),action:'invite'};
test('invite grants snapshot access without exposing password or admin key, repeat copies reuse link',()=>{
 const first=manageAccess(input),second=manageAccess(input);assert.equal(first.token,second.token);
 const redeemed=redeemInvite(first.token);assert.equal(redeemed.org.name,'Test team');assert.equal(redeemed.org.accessKey,undefined);
 assert.throws(()=>redeemInvite(first.token+'broken'));
});
test('password is retrievable only with admin capability, matches browser hash, revokes old invites',()=>{
 assert.equal(manageAccess({...input,action:'show'}).password,null);
 const old=manageAccess(input).token;
 const changed=manageAccess({...input,action:'password',password:'new-test-password'});
 assert.equal(changed.passwordHash,pbkdf2Sync('new-test-password',id,100000,32,'sha256').toString('hex'));
 assert.equal(manageAccess({...input,action:'show'}).password,'new-test-password');
 assert.throws(()=>manageAccess({...input,action:'show',accessKey:'c'.repeat(64)}));
 assert.throws(()=>redeemInvite(old));
 assert.equal(redeemInvite(manageAccess(input).token).org.passwordHash,changed.passwordHash);
});
