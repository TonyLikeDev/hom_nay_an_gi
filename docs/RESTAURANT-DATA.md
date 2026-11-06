# Restaurant prototype — 2026-11-02

## Source and scope

Imported all 105 numbered entries from the user-provided workbook `data  hơn 100 món ăn,nước uống , quán bánh ,ăn vặ....xlsx` without modifying it. The workbook is not copied into the public directory. It contains one sheet and seven populated columns: number, name/signature dish, classification, suggested meals, price segment, address, Unsplash image URL.

All 105 rows have values in these fields. They are 105 directory entries, not necessarily 105 distinct verified restaurant branches: some entries name markets, chains, approximate areas or several branches. Possible overlap is preserved, not silently merged (for example the two Kem Bơ Cô Vân entries).

The Da Nang scope is inferred from the names/streets and explicitly recorded in `areaNote`. Addresses, district labels and prices remain as provided; they are not geocoded or updated to administrative boundaries. Suggested meals are not business opening hours. Price ranges are not confirmed menu-item prices.

`data/restaurants.json` is the backend source. Each record retains original category, source row/number and original image URL. Eight display groups are derived for filtering; raw classification remains visible in the detail dialog. No automatic mapping to the site's 30 dishes is claimed.

## Images

All 50 distinct image files downloaded successfully (about 6.4 MB total). The workbook had 49 unique Unsplash links, reused across entries. Three records now use images discovered on official pages instead:

- `dn-012`, Madame Lân: https://madamelan.vn/ — its Open Graph cover image. This is a promotional banner, not a storefront photograph.
- `dn-013`, Pizza 4P's Indochina: https://pizza4ps.com/vn/location/944/?lang=vietnamese — Open Graph image of the branch interior.
- `dn-018`, Bếp Cuốn: https://bepcuon.net/ — Open Graph food image. The original image includes a watermark, retained without alteration.

Remaining 102 records use illustrative images from the workbook; some are broadly related food photography rather than the named dish. Every card and detail dialog identifies the image type; the detail source link points to the original source. Official-page photos are not evidence that all record fields were verified. The prototype makes no endorsement, partner, live inventory, rating or delivery claim.

Downloaded public restaurant images are for reviewing this local prototype. Their availability is not a reusable license: confirm publication rights with the owner before public release, or replace them with authorized assets. Unsplash links supplied in the workbook lack photographer names; those still need to be identified if completing photo credits. No Google Maps content was scraped or stored.

## Import / refresh

```powershell
python scripts/import-restaurants.py 'PATH_TO_WORKBOOK.xlsx'
python scripts/fetch-restaurant-images.py
```

Import uses Python standard-library ZIP/XML to read XLSX only, no workbook authoring. It validates row count and unique source IDs. The image fetcher only downloads the supplied image URLs plus the three explicit official sources above, verifies MIME type, imposes a size limit and records failures. Run both scripts for a full refresh: importing alone resets the photo choices. These commands replace prototype JSON; they do not write a production SQL database.

## MVC and API

- `server/models/restaurant.model.js`: JSON access, accent-insensitive search, filters, pagination.
- `server/controllers/restaurant.controller.js`: parameter validation and JSON responses.
- `server/routes/restaurant.routes.js`: read-only endpoints.
- `public/restaurants.html`, `public/js/restaurants.js`: directory, filter form, pagination, detail dialog and image provenance.

```text
GET /api/restaurants?q=mi%20quang&category=Món%20chính&meal=Trưa&page=1&pageSize=12
GET /api/restaurants/dn-013
```

List returns items, total, totalRecords, page/pageSize/totalPages and global facets. `pageSize` is 1–48, page is a positive integer, search length is capped at 150 characters. Out-of-range pages clamp to the last available page; unmatched filters return an empty result. Empty filters match all. “Cả ngày” matches all meal filters as a suggestion, never as a live opening status.

Maps links search the given name/address and Da Nang; they are not verified place IDs. No automatic location, paid Places API or ordering integration is added. Search/filter links can be bookmarked. Browsers need the Node.js server, not file:// or a static-only preview.

## Verification

`node --test tests/restaurants.test.js` covers import completeness/provenance/assets, pagination across all 105 entries, combined filters, parameter/method rejection, detail 404 and private-file boundaries.

Browser QA used headless Edge at desktop 1440px and mobile 390px: list rendering, accent-free search, empty/reset, light/dark, detail dialog, Escape dismissal, JavaScript errors and horizontal overflow. Original workbook left unchanged.

## Dish-to-restaurant links

`data/dish-restaurants.json` stores curated associations independently of raw import data. Eight direct associations cover bánh mì (4), bánh xèo (3) and phở bò (1), using named offerings. Three broader associations cover pizza/pasta only; they are explicitly marked `related`, never treated as proof of Margherita or Carbonara availability. Bún chả cá is not matched to bún chả; kem xôi dừa is not matched to xôi xoài. Unknown dishes remain unmatched.

`GET /api/dishes/:id/restaurants` returns `matches` and `related` separately. `/api/restaurants?dish=banh-xeo` filters the directory to linked venues, still compatible with other filters. Invalid dish detail returns 404; a known dish without associations returns empty lists. These are editorial links, not live inventory or confirmation by the business.

The result page loads up to three cards only once the spin settles, aborts prior requests on a new spin, and exposes empty/error/retry states. Card actions deep-link to the directory via `?restaurant=dn-006`, opening the correct detail dialog; “all related” uses the dish filter. Shared card UI preserves image attribution, address and price wording across both pages.

Directory UI no longer mentions Excel, row numbers or import mechanics. Original provenance remains in the backend data and this maintenance document; price and image caveats remain user-facing.

## Expanded dish catalog

`scripts/expand-dish-catalog.mjs` curates 75 additional offerings explicitly named in the source, merging repeated dish names across venues. It is idempotent and checks against overwriting original dishes. Total: 105 dish/drink options, 78 with direct restaurant associations, 109 total associations including the three earlier broader variants. Original 30 dish IDs, covers and two recipes remain unchanged.

No menu is invented for venues with only general names. Markets remain labeled as places to locate a specific stall, not as a verified single merchant. Ingredient-level verification remains limited to the two reviewed recipes. At the user’s request, nine explicitly named chay offerings also receive the badge with status `source-declared`; their tooltip and filter note distinguish source declarations from reviewed ingredients. No other dish is inferred vegetarian from appearance or category.

New dish meal tags are the union of supporting venue suggestions. “Cả ngày” maps to morning/lunch/afternoon/evening, not an invented late-night opening. A broad “Quốc tế” group uses a globe rather than an inaccurate national flag. Images are illustrative, including where a source venue has a food photograph; the dish photo-source metadata preserves the actual chosen image attribution.

Server and static frontend data are synchronized by the expansion script. All lists, random picks and cuisine reels use `FOOD.DISHES`, so the catalog is shared by the existing flows. The dish page adds accent-insensitive name search and a “Có quán liên kết” filter; this filter includes direct links, not the broader related-only variants.

Run `node --test tests/dish-catalog.test.js tests/restaurants.test.js` to validate catalog consistency, new IDs, meals/images, association referential integrity, counts, original recipe badges and the restaurant API.


### Nhãn ăn kiêng

Rà soát nguồn ngày 02/11/2026: `data/nutrition-research.json` lưu tiêu chí, nguồn, số liệu, khẩu phần, điều kiện phiên bản và các trường hợp không thể áp dụng. `node scripts/apply-nutrition-reviews.mjs` đối chiếu ngưỡng rồi đồng bộ JSON và JS tĩnh. Script mở rộng món giữ metadata này.

Đang có ba phiên bản tham khảo: cà phê đặc sản pha đen với nước, không phụ gia (ít đường, ít năng lượng); thịt bò vai nạc nướng nguyên vị, không sốt/món kèm (ít đường); risotto nấm đúng công thức Diabetes UK (5,8 g đường/306 g, khoảng 1,90 g/100 g, ít đường). Nhãn có dấu * và điều kiện hiện rõ trên thẻ và kết quả quay. Đây không phải xác nhận món quán bán hoặc xét nghiệm. USDA phân loại giá trị đường 0 của thịt bò là assumed zero, năng lượng là imputed; lưu rõ và trình bày trong nguồn tham khảo.

Tiêu chí tham chiếu European Commission: đường ≤5g/100g rắn, ≤2,5g/100ml lỏng; năng lượng ≤40kcal/100g rắn, ≤20kcal/100ml lỏng. Không tự nhận là chứng nhận tại Việt Nam. Chưa gán ít tinh bột vì không có ngưỡng thống nhất cho món riêng lẻ; không chuyển ngưỡng một chế độ ăn thành ngưỡng món. Bruschetta AHS chỉ tính topping nên không gán cho bánh hiện tại. Không gán cho món khác khi thiếu công thức, khối lượng thành phẩm hoặc biến thể khớp nguồn.

`nutritionReviews` yêu cầu key/status/source/basis; nhãn hiện tại có thêm scopeType `reference-variant`, scope, criterionSource, checkedAt. `nutritionProfile` chứa số liệu nguyên gốc, khẩu phần và dataNote. Không suy nhãn từ tên món hoặc tính chay, không lan truyền metadata từ món sang quán. Trang Giới thiệu có liên kết trực tiếp tới nguồn và cách đối chiếu.


Đợt tìm bổ sung ngày 02/11/2026: thêm risotto nấm theo phiên bản Diabetes UK (gạo risotto, nấm, Parmesan, sữa chua Hy Lạp 0% béo), chưa xác nhận các cách nấu risotto khác. Không gán thêm ít năng lượng vì 282 kcal/306 g > 40 kcal/100 g; không gán ít tinh bột. `followUpReview` trong JSON ghi nguồn và lý do để trống các ứng viên như phở bò, Tom Yum, cà ri xanh, carbonara, lasagna, burger, bruschetta, sushi, cơm chiên Dương Châu và xôi xoài. Đây là lượt tìm có mục tiêu, không tự nhận đã tìm mọi nguồn cho toàn bộ danh mục. Các món khác vẫn để trống khi chưa có căn cứ.
