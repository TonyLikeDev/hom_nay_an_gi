export function animatePick(
  pool,
  result,
  { onPreview, onFinish, reducedMotion },
) {
  let timer;
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
    clearTimeout(timer);
  };
  if (!result) return cancel;
  if (reducedMotion || pool.length < 2) {
    onFinish(result);
    return cancel;
  }
  const delays = [65, 80, 105, 140, 190, 255, 335];
  let frame = 0;
  let previous = result;
  const tick = () => {
    if (cancelled) return;
    if (frame === delays.length) {
      onPreview(result);
      timer = setTimeout(() => {
        if (!cancelled) onFinish(result);
      }, 260);
      return;
    }
    const choices = pool.filter((dish) => dish.id !== previous.id);
    previous = choices[Math.floor(Math.random() * choices.length)] || result;
    onPreview(previous);
    timer = setTimeout(tick, delays[frame++]);
  };
  tick();
  return cancel;
}
