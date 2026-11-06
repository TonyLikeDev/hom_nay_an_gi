/* Shared conditions for homepage counts and every repeat spin. */
const SpinFilters = (() => {
  const diets = ['all','vegetarian','low-sugar','low-carb','low-energy'];
  function parse(params) {
    const diet = params.get('diet') || 'all';
    return { diet: diets.includes(diet) ? diet : 'all', recipe: params.get('recipe') === '1', linked: params.get('linked') === '1', invalid: !diets.includes(diet) || ['recipe','linked'].some(key => params.has(key) && !['0','1'].includes(params.get(key))) };
  }
  const apply = (dishes, options) => dishes.filter(dish =>
    (options.diet === 'vegetarian' ? App.isVegetarian(dish) : Nutrition.matches(dish,options.diet)) &&
    (!options.recipe || Object.hasOwn(RECIPES,dish.id)) && (!options.linked || dish.linkedRestaurantCount > 0));
  const count = options => Number(options.diet !== 'all') + Number(options.recipe) + Number(options.linked);
  function params(options) {
    const result = new URLSearchParams();
    if(options.diet !== 'all')result.set('diet',options.diet);
    if(options.recipe)result.set('recipe','1');
    if(options.linked)result.set('linked','1');
    return result;
  }
  const labels = options => [({vegetarian:'Món chay','low-sugar':'Ít đường','low-carb':'Ít tinh bột','low-energy':'Ít năng lượng'})[options.diet], options.recipe && 'Có công thức', options.linked && 'Có quán'].filter(Boolean);
  return {parse,apply,count,params,labels};
})();
