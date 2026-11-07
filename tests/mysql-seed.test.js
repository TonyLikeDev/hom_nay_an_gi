import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed, validateSeed, seedCounts, seedHash } from '../scripts/mysql-seed-data.mjs';
import { databaseName, connectionConfig } from '../scripts/import-mysql.mjs';

test('MySQL seed preserves catalog, recipes, scoped reviews and source quantities', async()=>{
 const seed=await loadSeed();const counts=seedCounts(seed);
 assert.deepEqual(counts,{dishes:105,restaurants:105,cuisines:7,meals:5,links:109,directLinks:106,relatedLinks:3,recipes:14,ingredients:158,steps:56,vegetarianReviews:11,nutritionReviews:4,nutritionProfiles:3});
 assert.equal(seedHash(seed),seedHash(structuredClone(seed)));
 assert.ok(Object.values(seed.recipes).some(r=>r.ingredients.some(i=>Array.isArray(i.amount))));
 assert.ok(Object.values(seed.recipes).some(r=>r.ingredients.some(i=>i.text)));
});
test('seed preflight rejects duplicate IDs, orphan edges, stale counts and invalid quantities',async()=>{
 const seed=await loadSeed();
 for(const mutate of [s=>s.food.DISHES.push(s.food.DISHES[0]),s=>s.associations.links[0].restaurantId='missing',s=>s.food.DISHES[0].linkedRestaurantCount=999,s=>s.recipes['xoi-xoai'].ingredients[0].amount=-1,s=>s.recipes['xoi-xoai'].ingredients[0].amount=[5,1],s=>s.associations.links.push(s.associations.links[0]),s=>s.restaurants.restaurants[0].suggestedMeals=['Unknown']]){const bad=structuredClone(seed);mutate(bad);assert.throws(()=>validateSeed(bad));}
});
test('database identifiers and connection inputs are validated without exposing credentials',()=>{
 for(const name of ['a; DROP DATABASE mysql','mysql`','', 'A','a'.repeat(65)])assert.throws(()=>databaseName(name));
 assert.equal(databaseName('hom_nay_an_gi'),'hom_nay_an_gi');
 assert.throws(()=>connectionConfig({}));assert.throws(()=>connectionConfig({DB_USER:'test',DB_PASSWORD:'secret',DB_PORT:'no'}));
 const config=connectionConfig({DB_USER:'test',DB_PASSWORD:'private',DB_NAME:'hnag_test'});
 assert.equal(config.multipleStatements,false);assert.equal(config.port,3306);
});
