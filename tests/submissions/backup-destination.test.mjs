import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotRecords} from '../../server/submissions/maintenance.mjs';

function fixture(destination, {privateFolder=true}={}) {
 const checked=[];
 const store={
  async get(id){assert.equal(id,'backup_config');return destination;},
  async transaction(ids,fn){return fn({get(){return {state:'completed',documents:0};}});}
 };
 const drive={
  async info(){return {parents:['original_register_folder']};},
  async privateOnly(id){checked.push(['private',id]);},
  async checkFolder(id){checked.push(['folder',id]);if(!privateFolder)throw new Error('STORAGE_NOT_PRIVATE');}
 };
 return {checked,run:()=>snapshotRecords({store,drive,sheets:{spreadsheetId:'synthetic_register'},now:()=>Date.UTC(2026,10,23)})};
}

test('existing installations retain the register parent until a backup folder is configured',async()=>{
 const f=fixture(null);assert.equal((await f.run()).state,'completed');
 assert.deepEqual(f.checked,[['private','synthetic_register'],['folder','original_register_folder']]);
});
test('configured backup destination remains independent of the register location',async()=>{
 const f=fixture({folderId:'separate_backup_folder'});await f.run();
 assert.deepEqual(f.checked,[['private','synthetic_register'],['folder','separate_backup_folder']]);
});
test('an invalid configured backup folder fails without falling back to the register folder',async()=>{
 for(const value of [{},{folderId:''},{folderId:'../invalid'}, {folderId:123}]){
  const f=fixture(value);await assert.rejects(f.run(),error=>error.code==='BACKUP_DESTINATION_INVALID');
  assert.deepEqual(f.checked,[['private','synthetic_register']]);
 }
});
test('a configured backup folder must still pass the owner-only privacy check',async()=>{
 const f=fixture({folderId:'separate_backup_folder'},{privateFolder:false});
 await assert.rejects(f.run(),/STORAGE_NOT_PRIVATE/);
});
