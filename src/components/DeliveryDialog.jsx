import { useEffect, useRef, useState } from "react";
import { REGIONS } from "../lib/regions.js";
import { External, Field } from "./ui.jsx";

export default function DeliveryDialog({ dish, platform, onClose }) {
  const dialog = useRef(null),
    [region, setRegion] = useState(() => {
      try {
        return localStorage.getItem("hnag:legacy-delivery-region") || "";
      } catch {
        return "";
      }
    }),
    [message, setMessage] = useState("");
  const platforms = {
    grab: { name: "GrabFood", url: "https://food.grab.com/vn/vi/" },
    shopee: { name: "ShopeeFood", url: "https://shopeefood.vn/" },
  };
  const target = platforms[platform],
    valid = REGIONS.includes(region);
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
        <p>
          Chọn khu vực tham khảo, rồi đặt địa chỉ giao hàng và tìm món trên nền
          tảng.
        </p>
        <Field
          label="Tỉnh/thành theo danh sách 63 đơn vị cũ"
          as="select"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          options={[["", "Chọn khu vực"], ...REGIONS.map((r) => [r, r])]}
        />
        <p>
          Khu vực này được lưu trên thiết bị; website không gửi địa chỉ hoặc đặt
          vị trí giao hàng cho {target.name}.
        </p>
        {valid && (
          <div className="result__actions">
            <External
              className="btn btn--primary"
              href={target.url}
              onClick={() => {
                try {
                  localStorage.setItem("hnag:legacy-delivery-region", region);
                } catch {}
              }}
            >
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
        )}
        <Field label="Tên món để tìm" readOnly value={dish.name} />
        <p role="status">{message}</p>
      </div>
    </dialog>
  );
}
