import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const food = JSON.parse(read('data/food.json'));
const source = read('public/js/recipes.js') + '\n' + read('public/js/nutrition.js') + '\n' + read('public/js/spin-filters.js') + '; SpinFilters;';
const filters = vm.runInNewContext(source,{URLSearchParams,App:{isVegetarian: dish => ['reviewed','source-declared'].includes(dish.vegetarianReview?.status)}});
const options = query => filters.parse(new URLSearchParams(query));
test('surprise counts and repeated-selection pool apply every condition together',()=>{
 assert.equal(filters.apply(food.DISHES,options('')).length,105);
 assert.equal(filters.apply(food.DISHES,options('recipe=1')).length,14);
 assert.equal(filters.apply(food.DISHES,options('recipe=1&diet=vegetarian')).length,2);
 assert.equal(filters.apply(food.DISHES,options('recipe=1&diet=vegetarian&linked=1')).length,0);
 assert.equal(filters.apply(food.DISHES,options('diet=low-carb')).length,0);
 const pool=filters.apply(food.DISHES,options('diet=low-sugar&recipe=1'));
 assert.equal(pool.length,1);assert.equal(pool[0].id,'risotto-nam');
});
test('conditions round trip in the URL and reject unsupported diet/flag values',()=>{
 const value=options('diet=vegetarian&recipe=1&linked=1');
 assert.equal(filters.count(value),3);
 assert.equal(filters.params(value).toString(),'diet=vegetarian&recipe=1&linked=1');
 assert.equal(options('diet=unknown').invalid,true);
 assert.equal(options('recipe=yes').invalid,true);
 assert.equal(options('linked=2').invalid,true);
});
