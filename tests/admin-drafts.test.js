import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const store = vm.runInNewContext(readFileSync(new URL('../public/js/admin-drafts.js',import.meta.url),'utf8') + '; AdminDrafts;', {structuredClone});
const memory = () => { const data = new Map(); return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)}; };
test('drafts survive reads, upsert without duplication and preserve unrelated categories',()=>{
  const storage=memory();
  store.save('dishes',{id:'pho-bo',name:'Phở nháp',cuisine:'viet',meals:['trua']},storage);
  store.save('restaurants',{id:'dn-001',name:'Quán nháp',category:'Món chính'},storage);
  store.save('dishes',{id:'pho-bo',name:'Phở sửa lần hai',cuisine:'viet',meals:['trua']},storage);
  const state=store.read(storage);
  assert.equal(state.error,'');assert.equal(state.drafts.dishes.length,1);assert.equal(state.drafts.dishes[0].name,'Phở sửa lần hai');assert.equal(state.drafts.restaurants.length,1);
});
test('merge leaves baseline unchanged and overlays both edits and new entries',()=>{
 const base=[{id:'a',name:'Gốc'}];const original=JSON.stringify(base);
 const result=store.merge(base,[{id:'a',name:'Sửa',draft:true},{id:'new',name:'Mới',draft:true}]);
 assert.equal(JSON.stringify(base),original);assert.equal(result.length,2);assert.equal(result.find(r=>r.id==='a').name,'Sửa');
});
test('corrupt data and incompatible schema are preserved, not silently overwritten',()=>{
 const storage=memory();for(const raw of ['{bad',JSON.stringify({version:99,drafts:{}})]){
 storage.setItem(store.key,raw);assert.ok(store.read(storage).error);
 assert.ok(store.save('restaurants',{id:'dn-001',name:'Quán',category:'Món'},storage).error);assert.equal(storage.getItem(store.key),raw);
 }
});
test('write failures are reported and clear deletes only the admin draft key',()=>{
 const storage=memory();storage.setItem('hnag:favorites:v1','keep');store.save('restaurants',{id:'dn-001',name:'Quán',category:'Món'},storage);
 assert.equal(store.clear(storage).error,'');assert.equal(storage.getItem('hnag:favorites:v1'),'keep');
 const blocked={getItem:()=>null,setItem:()=>{throw Error('quota')},removeItem:()=>{throw Error('blocked')}};
 assert.ok(store.save('restaurants',{id:'x',name:'Quán',category:'Món'},blocked).error);assert.ok(store.clear(blocked).error);
});


test('admin drafts are scoped by authenticated account ID without moving legacy data', () => {
  const storage = new Map();
  const fake = {getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const scope = vm.runInNewContext(readFileSync(new URL('../public/js/admin-drafts.js',import.meta.url),'utf8') + '; AdminDrafts;', {structuredClone});
  const record={id:'test',name:'Món thử',cuisine:'viet',meals:['sang']};
  scope.save('dishes',record,fake);
  scope.setAccount('1');assert.equal(scope.read(fake).drafts.dishes.length,0);
  scope.save('dishes',record,fake);scope.setAccount('2');assert.equal(scope.read(fake).drafts.dishes.length,0);
  scope.setAccount('1');assert.equal(scope.read(fake).drafts.dishes.length,1);
  assert.ok(storage.has('hnag:admin-drafts:v1'));
  assert.throws(()=>scope.setAccount('../admin'));
});
