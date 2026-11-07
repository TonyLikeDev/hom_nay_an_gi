import test from "node:test";
import assert from "node:assert/strict";
import { animatePick } from "../src/lib/animate-pick.js";

test("shuffle slows down, reveals the selected dish and finishes once", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const frames = [];
  const finished = [];
  animatePick(pool, pool[1], {
    onPreview: (dish) => frames.push(dish.id),
    onFinish: (dish) => finished.push(dish.id),
    reducedMotion: false,
  });
  assert.equal(frames.length, 1);
  for (const delay of [65, 80, 105, 140, 190, 255, 335]) {
    const before = frames.length;
    t.mock.timers.tick(delay - 1);
    assert.equal(frames.length, before);
    t.mock.timers.tick(1);
    assert.equal(frames.length, before + 1);
  }
  assert.equal(frames.at(-1), "b");
  assert.deepEqual(finished, []);
  t.mock.timers.tick(260);
  t.mock.timers.tick(5000);
  assert.deepEqual(finished, ["b"]);
  for (let i = 1; i < frames.length - 1; i++)
    assert.notEqual(frames[i], frames[i - 1]);
});

test("reduced motion and singleton pools finish immediately; empty pools do nothing", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const pool = [{ id: "a" }, { id: "b" }];
  let previews = 0;
  const finished = [];
  for (const [choices, result, reducedMotion] of [
    [pool, pool[1], true],
    [[pool[0]], pool[0], false],
    [[], null, false],
  ])
    animatePick(choices, result, {
      onPreview: () => previews++,
      onFinish: (dish) => finished.push(dish.id),
      reducedMotion,
    });
  t.mock.timers.tick(5000);
  assert.equal(previews, 0);
  assert.deepEqual(finished, ["b", "a"]);
});

test("cancelling a shuffle prevents later previews and navigation", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const pool = [{ id: "a" }, { id: "b" }];
  let previews = 0,
    finishes = 0;
  const cancel = animatePick(pool, pool[0], {
    onPreview: () => previews++,
    onFinish: () => finishes++,
    reducedMotion: false,
  });
  cancel();
  t.mock.timers.tick(5000);
  assert.equal(previews, 1);
  assert.equal(finishes, 0);
});
