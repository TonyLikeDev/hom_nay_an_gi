import { rows } from '../config/database.js';
import { getDocument, ordered, optional } from './catalog-data.model.js';

export async function getRecipes({admin=false}={}) {
  const [recipes,ingredients,steps,order]=await Promise.all([
    rows('SELECT dish_id,base_servings,prep_time,cook_time,soak_note,tip,source_label,source_url FROM recipes'+(admin?'':' WHERE dish_id IN (SELECT id FROM dishes WHERE is_visible=TRUE)')),
    rows('SELECT dish_id,sort_order,name,amount_min,amount_max,unit,amount_text FROM recipe_ingredients ORDER BY sort_order'),
    rows('SELECT dish_id,sort_order,title,instruction FROM recipe_steps ORDER BY sort_order'),
    getDocument('catalog-order-v1'),
  ]);
  return Object.fromEntries(ordered(recipes,order.recipes,'dish_id').map(r=>{
    const recipe={servings:r.base_servings,prep:r.prep_time,cook:r.cook_time,
      ingredients:ingredients.filter(i=>i.dish_id===r.dish_id).map(i=>i.amount_text!==null?{name:i.name,text:i.amount_text}:{name:i.name,amount:i.amount_max===null?Number(i.amount_min):[Number(i.amount_min),Number(i.amount_max)],unit:i.unit}),
      steps:steps.filter(s=>s.dish_id===r.dish_id).map(s=>[s.title,s.instruction]),tip:r.tip,source:{label:r.source_label,url:r.source_url}};
    optional(recipe,'soak',r.soak_note);return [r.dish_id,recipe];
  }));
}
