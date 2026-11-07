import { rows } from '../config/database.js';
import { getDocument, ordered, optional } from './catalog-data.model.js';

export const normalize = value => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
export async function getRestaurantData({admin=false}={}) {
  const [restaurants,mealLinks,meals,metadata,order]=await Promise.all([
    rows('SELECT * FROM restaurants'+(admin?'':' WHERE is_visible=TRUE')),
    rows('SELECT restaurant_id,meal_id FROM restaurant_meals ORDER BY sort_order'),
    rows('SELECT id,label FROM meals'),getDocument('restaurants'),getDocument('catalog-order-v1'),
  ]);
  const labels=new Map(meals.map(m=>[m.id,m.label]));
  return {...metadata,restaurants:ordered(restaurants,order.restaurants).map(r=>{
    const keys=mealLinks.filter(m=>m.restaurant_id===r.id).map(m=>m.meal_id);
    const allDay=r.source_record.suggestedMeals?.includes('Cả ngày')&&keys.length===meals.length&&meals.every(m=>keys.includes(m.id));
    const result={id:r.id,sourceNumber:r.source_record.sourceNumber,name:r.name,category:r.category,originalCategory:r.original_category,suggestedMeals:allDay?['Cả ngày']:keys.map(key=>labels.get(key)),priceLabel:r.price_label,priceTier:r.price_tier,address:r.address,area:r.area,verification:r.verification,photo:r.photo,source:r.provenance};
    optional(result,'website',r.website);
    const details=r.admin_details||{};
    for(const key of ['phone','hours'])if(details[key])result[key]=details[key];
    if(details.imageUrl)result.photo={url:details.imageUrl,kind:'admin-provided',sourceLabel:'Ảnh do quản trị viên cung cấp',sourceUrl:details.imageUrl};
    if(admin)Object.assign(result,{isVisible:!!r.is_visible,revision:r.revision,phone:details.phone||'',hours:details.hours||'',imageUrl:details.imageUrl||'',grabFoodUrl:details.grabFoodUrl||'',shopeeFoodUrl:details.shopeeFoodUrl||'',partnership:details.partnership||'unknown',note:details.note||''});
    return result;
  })};
}
export async function getDishRestaurantLinks() {
  const [links,metadata,order]=await Promise.all([rows('SELECT rd.dish_id,rd.restaurant_id,rd.match_type,rd.offering,rd.source_record FROM restaurant_dishes rd JOIN dishes d ON d.id=rd.dish_id JOIN restaurants r ON r.id=rd.restaurant_id WHERE d.is_visible=TRUE AND r.is_visible=TRUE'),getDocument('associations'),getDocument('catalog-order-v1')]);
  const edits=await rows("SELECT entity_key,last_payload FROM admin_catalog_versions WHERE kind='links'");
  const updated=new Map(edits.map(e=>[e.entity_key,e.last_payload]));
  const prices=await rows('SELECT dish_id,restaurant_id,price_vnd FROM restaurant_dishes');
  const amounts=new Map(prices.map(r=>[r.dish_id+'/'+r.restaurant_id,r.price_vnd]));
  const records=links.map(r=>{const key=r.dish_id+'/'+r.restaurant_id,edit=updated.get(key);const record=optional({id:key,dishId:r.dish_id,restaurantId:r.restaurant_id,type:r.match_type,offering:r.offering},'evidence',edit?.note||r.source_record.evidence);if(edit?.sourceUrl)record.sourceUrl=edit.sourceUrl;if(amounts.get(key)!==null)record.priceVnd=Number(amounts.get(key));return record;});
  return {...metadata,links:ordered(records,order.links).map(({id,...record})=>record)};
}
export async function findRestaurants({ q = '', category = '', meal = '', priceTier = '', dishId = '', nutrition = '', page = 1, pageSize = 12, admin=false } = {}) {
  const { restaurants, importedAt } = await getRestaurantData({admin});
  const associations = dishId ? (await getDishRestaurantLinks()).links.filter(link => link.dishId === dishId) : [];
  const query = normalize(q.trim());
  const filtered = restaurants.filter(r =>
    (!nutrition || r.nutritionReviews?.some(review => review.key === nutrition && review.status === 'verified' && review.source && review.basis)) &&
    (!dishId || associations.some(link => link.restaurantId === r.id)) &&
    (!query || normalize(`${r.name} ${r.address} ${r.area}`).includes(query)) &&
    (!category || r.category === category) &&
    (!meal || r.suggestedMeals.includes(meal) || r.suggestedMeals.includes('Cả ngày')) &&
    (!priceTier || r.priceTier === priceTier));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  return {
    items: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(r => dishId ? { ...r, dishMatch: associations.find(link => link.restaurantId === r.id) } : r),
    total: filtered.length, totalRecords: restaurants.length, page: currentPage, pageSize, totalPages, importedAt,
    facets: {
      categories: [...new Set(restaurants.map(r => r.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
      meals: ['Sáng', 'Trưa', 'Chiều', 'Tối', 'Khuya'],
      priceTiers: [...new Set(restaurants.map(r => r.priceTier).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    },
  };
}
export async function findRestaurantById(id,{admin=false}={}) {
  const { restaurants } = await getRestaurantData({admin});
  return restaurants.find(r => r.id === id);
}
