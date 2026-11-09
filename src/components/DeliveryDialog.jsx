import { useEffect, useRef, useState } from "react";
import { External, Field } from "./ui.jsx";

export default function DeliveryDialog({ dish, platform, onClose }) {
  const dialog = useRef(null),
    [message, setMessage] = useState("");
  const platforms = {
    grab: { name: "GrabFood", url: "https://food.grab.com/vn/vi/" },
    shopee: { name: "ShopeeFood", url: "https://shopeefood.vn/" },
  };
  const target = platforms[platform];
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      className="delivery-dialog"
      ref={dialog}
      onClose={onClose}
      aria-labelledby="delivery-title"
    >
      <div className="delivery-dialog__body">
        <button
          className="btn"
          type="button"
          onClick={() => dialog.current.close()}
        >
          Đóng
        </button>
        <h2 id="delivery-title">
          Tìm {dish.name} qua {target.name}
        </h2>
        <p>Mở nền tảng, đặt địa chỉ giao hàng và tìm món theo tên bên dưới.</p>
        <div className="result__actions">
          <External className="btn btn--primary" href={target.url}>
            Mở {target.name} ↗
          </External>
          <button
            className="btn"
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(dish.name);
                setMessage("Đã sao chép tên món.");
              } catch {
                setMessage("Bạn có thể sao chép tên món trong ô bên dưới.");
              }
            }}
          >
            Sao chép tên món
          </button>
        </div>
        <Field label="Tên món để tìm" readOnly value={dish.name} />
        <p role="status">{message}</p>
      </div>
    </dialog>
  );
}
