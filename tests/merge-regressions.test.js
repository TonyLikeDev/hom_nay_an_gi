import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
function page() {
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, {
      dataset: {}, style: {}, events: {}, classList: { add() {}, remove() {} },
      firstElementChild: { offsetHeight: 20 },
      addEventListener(name, callback) { this.events[name] = callback; },
      setAttribute() {}, removeAttribute() {}, append() {}, before() {}, after() {},
      remove() {}, focus() {}, querySelector() { return element('empty-link'); },
    });
    return nodes.get(id);
  };
  return { element, document: { body: element('body'), getElementById: element,
    createElement: () => element(Symbol()), createTextNode: text => text, dispatchEvent() {} } };
}

test('repeat spin updates a direct dish URL while retaining filters and slot origin', async () => {
  const { document, element } = page();
  const dishes = ['first', 'second'].map(id => ({ id, name: id, cuisine: 'viet', meals: ['trua'], linkedRestaurantCount: 1 }));
  const history = [];
  vm.runInNewContext(read('public/js/spin-filters.js') + '\n' + read('public/js/result.js'), {
    document, URLSearchParams, CustomEvent, Event,
    location: { search: '?dish=first&linked=1&from=slot' },
    history: { replaceState: (state, title, url) => history.push(url) },
    FOOD: { DISHES: dishes, MEALS: { trua: { label: 'Trưa' } } }, RECIPES: {},
    Favorites: { button: () => '' }, Nutrition: { matches: () => true, tags: () => [] },
    App: { getMeal: () => 'trua', photo: () => '', cuisineLabel: () => 'Việt', mealIcon: () => '',
      isVegetarian: () => false, vegetarianNote: () => '', mapsUrl: () => '', setLast() {},
      reduceMotion: () => true, pickDish: pool => pool.at(-1) },
  });
  await element('btn-again').events.click();
  const query = new URL(history.at(-1), 'http://localhost').searchParams;
  assert.equal(query.get('dish'), 'second');
  assert.equal(query.get('linked'), '1');
  assert.equal(query.get('from'), 'slot');
  assert.equal(element('result').dataset.dishId, 'second');
});

test('cuisine reel finds the decorated label in both normal and reduced motion', async () => {
  for (const reduced of [false, true]) {
    const { document, element } = page();
    const dish = { id: 'first', name: 'Phở', cuisine: 'viet', meals: ['trua'] };
    const location = { hash: '' };
    const waits = [];
    vm.runInNewContext(read('public/js/cuisines.js'), {
      document, location, addEventListener() {},
      FOOD: { CUISINES: { viet: { name: 'Việt', cover: 'first' } }, DISHES: [dish] },
      App: { photo: () => '', cuisineLabel: () => '<img> Việt', getMeal: () => 'trua',
        randomItem: pool => pool[0], pickDish: pool => pool[0], reduceMotion: () => reduced,
        wait: async ms => { waits.push(ms); } },
      SpinFilters: { params: () => new URLSearchParams('linked=1') },
      SpinOptionsUI: { mount: () => ({ pool: () => [dish], options: {}, setLocked() {} }) },
    });
    await element('slot-spin').events.click();
    assert.equal(element('reel-cuisine').style.transform, 'translateY(-40px)');
    assert.deepEqual(waits, reduced ? [400] : [1500, 1500, 400]);
    assert.equal(location.href, 'result.html?linked=1&dish=first&from=slot');
  }
});
