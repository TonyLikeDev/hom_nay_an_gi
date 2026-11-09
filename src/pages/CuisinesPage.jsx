import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useCatalog } from "../providers.jsx";
import {
  CUISINES,
  filterDishes,
  parseFilters,
  photo,
  pickDish,
  queryFor,
} from "../lib/catalog.js";
import { animatePick } from "../lib/animate-pick.js";
import { CuisineLabel, Image } from "../components/ui.jsx";
import SpinOptions from "../components/SpinOptions.jsx";

export default function CuisinesPage() {
  const { catalog } = useCatalog(),
    [params, setParams] = useSearchParams(),
    navigate = useNavigate(),
    dialog = useRef(null),
    opener = useRef(null);
  const [spinning, setSpinning] = useState(false),
    [preview, setPreview] = useState(null),
    cancelPick = useRef(() => {});
  const filters = parseFilters(params),
    pool = filterDishes(catalog, filters);
  const position = Math.max(
    0,
    pool.findIndex((d) => d.id === preview?.id),
  );
  const reelDishes = pool.length
    ? [-1, 0, 1].map(
        (offset) => pool[(position + offset + pool.length) % pool.length],
      )
    : [];
  useEffect(() => () => cancelPick.current(), []);
  const start = () => {
    if (spinning || !pool.length) return;
    let last;
    try {
      last = sessionStorage.getItem("hnag:last-dish");
    } catch {}
    const dish = pickDish(pool, last);
    cancelPick.current();
    setSpinning(true);
    setPreview(dish);
    cancelPick.current = animatePick(pool, dish, {
      onPreview: setPreview,
      onFinish: () => {
        const query = queryFor(parseFilters(params));
        query.set("dish", dish.id);
        query.set("from", "slot");
        navigate("/result?" + query);
      },
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  };
  return (
    <main id="main" className="page wrap">
      <h1>Chọn nền ẩm thực</h1>
      <div className="cuisine-grid">
        {Object.entries(catalog.cuisines).map(([id, c]) => {
          const dish = catalog.dishes.find((d) => d.id === c.cover);
          const query = queryFor(filters);
          query.set("cuisine", id);
          return (
            <Link
              className="cuisine"
              data-cuisine={id}
              key={id}
              to={"/result?" + query}
            >
              <span className="cuisine__photo">
                <Image
                  src={photo(dish)}
                  alt={dish.name}
                  width="640"
                  height="480"
                  loading="lazy"
                />
              </span>
              <span className="cuisine__text">
                <span className="cuisine__name">
                  <CuisineLabel id={id} />
                </span>
                <span className="cuisine__desc">{c.desc}</span>
              </span>
            </Link>
          );
        })}
        <button
          className="surprise"
          type="button"
          ref={opener}
          onClick={() => {
            setPreview(pool[0] || null);
            dialog.current.showModal();
          }}
          aria-haspopup="dialog"
        >
          <span className="surprise__name">Bất ngờ đi!</span>
          <span className="surprise__desc">
            Để máy chọn giúp bạn cả nền ẩm thực lẫn món ăn.
          </span>
        </button>
      </div>
      <dialog
        className={"slot" + (spinning ? " is-spinning" : "")}
        ref={dialog}
        aria-busy={spinning}
        onCancel={(e) => {
          if (spinning) e.preventDefault();
        }}
        onClose={() => opener.current?.focus()}
        aria-labelledby="slot-title"
      >
        <div className="slot__body">
          <button
            className="btn slot__close"
            type="button"
            disabled={spinning}
            onClick={() => dialog.current.close()}
          >
            Đóng
          </button>
          <h2 id="slot-title">Bất ngờ đi!</h2>
          <p className="slot__status" role="status">
            {spinning ? "Đang chọn món…" : `${pool.length} món phù hợp`}
          </p>
          <div className="slot__reels" aria-hidden="true">
            {[
              preview ? CUISINES[preview.cuisine]?.name : "Ẩm thực",
              preview?.name || "Chưa có món phù hợp",
            ].map((name, i) => (
              <div key={i}>
                <div className="slot__window">
                  <ul className="slot__strip" key={preview?.id}>
                    {reelDishes.length ? (
                      reelDishes.map((d, index) => (
                        <li key={index}>
                          {i ? d.name : CUISINES[d.cuisine]?.name}
                        </li>
                      ))
                    ) : (
                      <li>{name}</li>
                    )}
                  </ul>
                </div>
                <span className="slot__label">{i ? "Món ăn" : "Ẩm thực"}</span>
              </div>
            ))}
          </div>
          <button
            className="btn btn--primary slot__spin"
            type="button"
            disabled={spinning || !pool.length}
            onClick={start}
          >
            Quay
          </button>
          <fieldset disabled={spinning}>
            <SpinOptions params={params} setParams={setParams} />
          </fieldset>
        </div>
      </dialog>
    </main>
  );
}
