# Delivery handoff — verified 2026-11-01

Frontend only, no platform API calls or location access.

## Findings

- GrabFood VN public home: https://food.grab.com/vn/vi/ . Home/search resources use selected location/latitude/longitude. No stable documented public URL accepting a dish and province was verified. Web retrieval sometimes returned 403; ordinary public HTML was available via a direct request.
- ShopeeFood: https://shopeefood.vn/ . Public frontend bundle `/app/assets/js/app-f182e75cd868fe649223.js` contains `/search`, but search depends on application city/location state. No verified independent deep link encoding both dish and province was found. Internal API route names are not an integration contract and are not used by this project.
- This does NOT establish that all platform flows lack deep links. It records only what could be verified. Recheck before adding direct regional search URLs.

## UI behavior

Platform buttons open a native modal dialog. The user selects a legacy province, may copy the dish name, and opens the official platform home. The UI explicitly asks them to select the actual delivery address there. The chosen region is NOT transmitted to the platform or claimed to set delivery location.

A separate, explicitly labeled web search link uses a Google `site:` query containing platform domain, dish and region. This is ordinary web search, not platform search or proof of restaurant availability. Only opening that link sends the search terms to Google.

The last confirmed province is stored locally under `hnag:legacy-delivery-region`. Blocked storage does not prevent use. No personal street address is collected. The list does not imply either platform serves every province.

## Province geography

The user explicitly requested the old 63-province geography after discussing the 34-province merger. `public/js/regions.js` intentionally retains the pre-merger list, with the older Thừa Thiên Huế label. This is labeled as historical in the UI, not presented as the current administrative list.

Official context and merger reference (23 merged successors plus 11 unchanged units):
https://baochinhphu.vn/quoc-hoi-thong-qua-viec-sap-xep-don-vi-hanh-chinh-cap-tinh-ca-nuoc-co-34-tinh-thanh-102250612100156988.htm

The precursor units named in the merger resolution, together with the 11 unchanged units, account for the old geography; Huế is displayed under the older Thừa Thiên Huế name for this legacy selection.

## Accessibility and fallback

Native dialog provides modal keyboard containment and Escape dismissal. A styled native select opens a one-column province dropdown, supporting standard keyboard navigation and the mobile system picker. Only a recognized province enables submission; comparison ignores accents and case. Focus returns to the platform link on close. Clipboard failure selects the text for manual copying. Without JavaScript, the original platform links still work.
