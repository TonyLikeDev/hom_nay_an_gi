import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import mysql from 'mysql2/promise';
import {migrateAuth} from './lib/auth-migration.mjs';
import {migrateRestaurants} from './lib/restaurant-migration.mjs';
import {migrateDishes} from './lib/dish-migration.mjs';
import {migrateCatalog} from './lib/catalog-migration.mjs';
import {migrateVisibility} from './lib/visibility-migration.mjs';
import { loadSeed, seedCounts, seedHash } from './mysql-seed-data.mjs';

export const TABLES = ['schema_versions','seed_imports','dataset_documents','meals','cuisines','dishes','dish_meals','restaurants','restaurant_meals','restaurant_dishes','recipes','recipe_ingredients','recipe_steps','dish_reviews','dish_nutrition_profiles','users','favorite_dishes','favorite_restaurants','auth_sessions','auth_accounts','auth_verifications','auth_rate_limits','restaurant_audit','dish_audit','admin_catalog_versions','admin_catalog_audit'];
const SCHEMA_VERSION = '001-initial';
const SEED_KEY = 'initial-catalog-v1';
const json = value => value == null ? null : JSON.stringify(value);
export { databaseName, connectionConfig } from '../server/config/database.js';
import { connectionConfig } from '../server/config/database.js';
export async function applySchema(connection) {
  const [existing] = await connection.query('SHOW TABLES');
  const names = existing.map(row => Object.values(row)[0]);
  if (names.some(name => !TABLES.includes(name))) throw new Error('Database contains unrelated tables; choose a dedicated DB_NAME.');
  const sql = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  // This authored schema has no procedures or semicolons inside string literals.
  const statements = sql.replace(/^\s*--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
  for (const statement of statements) {
    if (statement.startsWith('ALTER TABLE cuisines')) {
      const [constraints] = await connection.execute("SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='cuisines' AND CONSTRAINT_NAME='fk_cuisine_cover'");
      if (constraints.length) continue;
    }
    await connection.query(statement);
  }
  await connection.execute('INSERT IGNORE INTO schema_versions (version) VALUES (?)', [SCHEMA_VERSION]);
  await migrateAuth(connection);
  await migrateRestaurants(connection);
  await migrateDishes(connection);
  await migrateCatalog(connection);
  await migrateVisibility(connection);
}
async function insert(connection, table, columns, values) {
  if (!TABLES.includes(table) || columns.some(c => !/^[a-z_]+$/.test(c))) throw new Error('Invalid SQL identifier');
  await connection.execute(`INSERT INTO \`${table}\` (${columns.map(c=>'`'+c+'`').join(',')}) VALUES (${columns.map(()=>'?').join(',')})`, values.map(value => value === undefined ? null : value));
}
async function ensureCatalogOrder(connection,seed) {
  const order={meals:Object.keys(seed.food.MEALS),cuisines:Object.keys(seed.food.CUISINES),dishes:seed.food.DISHES.map(d=>d.id),restaurants:seed.restaurants.restaurants.map(r=>r.id),links:seed.associations.links.map(l=>l.dishId+'/'+l.restaurantId),recipes:Object.keys(seed.recipes),reviews:Object.fromEntries(seed.food.DISHES.map(d=>[d.id,(d.nutritionReviews||[]).map(r=>r.key)]))};
  // A one-time additive metadata migration for catalogs imported before MySQL reads.
  const [existing]=await connection.execute('SELECT id FROM dataset_documents WHERE id=?',['catalog-order-v1']);
  if(!existing.length)await insert(connection,'dataset_documents',['id','document'],['catalog-order-v1',json(order)]);
}
export async function importSeed(connection, seed, { beforeCommit } = {}) {
  // Validation must finish before starting writes, even for programmatic callers.
  const { validateSeed } = await import('./mysql-seed-data.mjs'); validateSeed(seed);
  const hash = seedHash(seed), counts = seedCounts(seed);
  const [lock] = await connection.execute('SELECT GET_LOCK(CONCAT(DATABASE(), ?), 10) AS acquired', [':catalog-seed']);
  if (Number(lock[0].acquired) !== 1) throw new Error('Another catalog import is running.');
  try {
    const [versions] = await connection.execute('SELECT version FROM schema_versions WHERE version=?', [SCHEMA_VERSION]);
    if (!versions.length) throw new Error('Apply schema version 001-initial before importing.');
    await connection.beginTransaction();
    try {
      const [previous] = await connection.execute('SELECT content_hash FROM seed_imports WHERE seed_key=?', [SEED_KEY]);
      if (previous.length) {
        if (previous[0].content_hash !== hash) throw new Error('Source has changed since the initial import. Use a reviewed migration; existing data was not overwritten.');
        await ensureCatalogOrder(connection,seed);
        await connection.commit(); return { status:'already-imported', counts, hash };
      }
      // An initial seed must not merge into an existing hand-edited catalog.
      for (const table of TABLES.filter(t => t !== 'schema_versions')) {
        const [rows] = await connection.query(`SELECT 1 FROM \`${table}\` LIMIT 1`);
        if (rows.length) throw new Error(`Table ${table} is not empty; initial import refused.`);
      }
      const { food, restaurants, associations, recipes, nutritionResearch } = seed;
      for (const [id, record] of Object.entries(food.MEALS)) await insert(connection,'meals',['id','label','source_record'],[id,record.label,json(record)]);
      for (const [id, record] of Object.entries(food.CUISINES)) await insert(connection,'cuisines',['id','name','description','cover_dish_id','icon','source_record'],[id,record.name,record.desc,null,record.icon,json(record)]);
      for (const dish of food.DISHES) {
        await insert(connection,'dishes',['id','cuisine_id','name','description','image_url','photo_id','photo_author','photo_crop','image_source','provenance','source_record'],[dish.id,dish.cuisine,dish.name,dish.desc,dish.imageUrl,dish.photo,dish.by,dish.crop,json(dish.imageSource),json(dish.source),json(dish)]);
        for (const [index, meal] of dish.meals.entries()) await insert(connection,'dish_meals',['dish_id','meal_id','sort_order'],[dish.id,meal,index+1]);
        if (dish.vegetarianReview) await insert(connection,'dish_reviews',['dish_id','review_key','status','evidence'],[dish.id,'vegetarian',dish.vegetarianReview.status,json(dish.vegetarianReview)]);
        for (const review of dish.nutritionReviews || []) await insert(connection,'dish_reviews',['dish_id','review_key','status','evidence'],[dish.id,review.key,review.status,json(review)]);
        if (dish.nutritionProfile) await insert(connection,'dish_nutrition_profiles',['dish_id','profile'],[dish.id,json(dish.nutritionProfile)]);
      }
      for (const [id, record] of Object.entries(food.CUISINES)) await connection.execute('UPDATE cuisines SET cover_dish_id=? WHERE id=?',[record.cover,id]);
      const mealByLabel = new Map(Object.entries(food.MEALS).map(([id,meal])=>[meal.label,id]));
      for (const record of restaurants.restaurants) {
        await insert(connection,'restaurants',['id','name','category','original_category','address','area','price_label','price_tier','website','verification','photo','provenance','source_record'],[record.id,record.name,record.category,record.originalCategory,record.address,record.area,record.priceLabel,record.priceTier,record.website,record.verification,json(record.photo),json(record.source),json(record)]);
        // Preserve 'Cả ngày' in source_record, expand to the five actual meal relations.
        const meals = record.suggestedMeals.includes('Cả ngày') ? Object.keys(food.MEALS) : record.suggestedMeals.map(label=>mealByLabel.get(label));
        for (const [index,meal] of [...new Set(meals)].entries()) await insert(connection,'restaurant_meals',['restaurant_id','meal_id','sort_order'],[record.id,meal,index+1]);
      }
      for (const link of associations.links) await insert(connection,'restaurant_dishes',['dish_id','restaurant_id','match_type','offering','price_vnd','source_record'],[link.dishId,link.restaurantId,link.type,link.offering,null,json(link)]);
      for (const [id, recipe] of Object.entries(recipes)) {
        await insert(connection,'recipes',['dish_id','base_servings','prep_time','cook_time','soak_note','tip','source_label','source_url','source_record'],[id,recipe.servings,recipe.prep,recipe.cook,recipe.soak,recipe.tip,recipe.source.label,recipe.source.url,json(recipe)]);
        for (const [index,ingredient] of recipe.ingredients.entries()) {
          const amount = Array.isArray(ingredient.amount) ? ingredient.amount : [ingredient.amount,null];
          await insert(connection,'recipe_ingredients',['dish_id','sort_order','name','amount_min','amount_max','unit','amount_text'],[id,index+1,ingredient.name,amount[0],amount[1],ingredient.unit,ingredient.text]);
        }
        for (const [index,step] of recipe.steps.entries()) await insert(connection,'recipe_steps',['dish_id','sort_order','title','instruction'],[id,index+1,...step]);
      }
      for (const [id, document] of Object.entries({ restaurants: Object.fromEntries(Object.entries(restaurants).filter(([key])=>key!=='restaurants')), associations: Object.fromEntries(Object.entries(associations).filter(([key])=>key!=='links')), nutritionResearch })) await insert(connection,'dataset_documents',['id','document'],[id,json(document)]);
      await ensureCatalogOrder(connection,seed);
      await insert(connection,'seed_imports',['seed_key','content_hash','counts'],[SEED_KEY,hash,json(counts)]);
      if (beforeCommit) await beforeCommit(connection);
      await connection.commit(); return {status:'imported',counts,hash};
    } catch(error) { await connection.rollback(); throw error; }
  } finally { await connection.execute('SELECT RELEASE_LOCK(CONCAT(DATABASE(), ?))', [':catalog-seed']); }
}
export async function main(args = process.argv.slice(2)) {
  if (args.some(arg=>!['--dry-run','--apply-schema','--help'].includes(arg)) || (args.includes('--dry-run') && args.includes('--apply-schema'))) throw new Error('Usage: node --env-file-if-exists=.env scripts/import-mysql.mjs [--dry-run | --apply-schema]');
  if (args.includes('--help')) { console.log('Use --dry-run to validate without a database; --apply-schema to create schema and import into DB_NAME; no flags imports into an existing schema.');return; }
  const seed = await loadSeed();
  if (args.includes('--dry-run')) {console.log(JSON.stringify({status:'validated',counts:seedCounts(seed),hash:seedHash(seed)},null,2));return;}
  const config = connectionConfig();
  let connection;
  try {
    if (args.includes('--apply-schema')) {
      const {database,...serverConfig}=config;
      connection=await mysql.createConnection(serverConfig);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
      await connection.changeUser({database});
      await applySchema(connection);
    } else connection=await mysql.createConnection(config);
    console.log(JSON.stringify(await importSeed(connection,seed),null,2));
  } finally { if(connection)await connection.end(); }
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(error=>{
  // mysql2 errors may include SQL/values: never print the entire error or credentials.
  console.error(error.code ? `MySQL operation failed (${error.code}). Check connection, permissions and database/schema; no credentials logged.` : error.message);
  process.exitCode=1;
});
