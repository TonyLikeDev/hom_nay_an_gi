-- Run once in the Supabase SQL Editor as the project administrator.
-- Creates a private draft only. The owner must replace the test details and consent before submitting.
begin;
do $$
declare
  target_owner uuid;
  fixture_id constant uuid := '71162e3a-c898-44a6-82a6-0328984e3156';
  restaurant_data jsonb := '{
    "name": "[TEST] Bếp Mây — Quán mẫu",
    "address": "Địa chỉ thử nghiệm — không phải quán thật",
    "area": "Đà Nẵng",
    "category": "Cơm và món Việt",
    "phone": "0000000000",
    "hours": "10:00–21:00 (giờ mẫu)",
    "website": "",
    "imageUrl": "",
    "grabFoodUrl": "",
    "shopeeFoodUrl": "",
    "priceLabel": "30.000–45.000đ (giá mẫu)",
    "priceTier": "",
    "contactName": "Chủ quán thử nghiệm",
    "contactEmail": "aividmaking1@gmail.com",
    "sourceUrl": "https://example.com/test-menu",
    "meals": ["trua", "toi"],
    "consent": false
  }';
  sample_menu jsonb := '[
    {"id":"a456cd54-40b7-40be-87ec-07e90a4c3669","name":"[TEST] Cơm gà","desc":"Dữ liệu mẫu để thử chỉnh sửa thực đơn.","cuisine":"viet","meals":["trua","toi"],"price":45000,"imageUrl":""},
    {"id":"49686ed2-f398-4739-a6de-46d05d7e7b05","name":"[TEST] Bún chả","desc":"Dữ liệu mẫu, không phải món đang bán.","cuisine":"viet","meals":["trua","toi"],"price":40000,"imageUrl":""},
    {"id":"65094411-68e8-415d-ae3c-c4841b74c2d3","name":"[TEST] Bánh mì","desc":"Dữ liệu mẫu, không nhận đơn đặt hàng.","cuisine":"viet","meals":["trua","toi"],"price":30000,"imageUrl":""}
  ]';
  item jsonb;
begin
  select id into target_owner from auth.users
  where lower(email) = 'aividmaking1@gmail.com';
  if target_owner is null then
    raise exception 'Account aividmaking1@gmail.com does not exist. Register it first; no test data was created.';
  end if;
  if exists(select 1 from public.restaurant_submissions where id=fixture_id and owner_id<>target_owner) then
    raise exception 'Test draft ID belongs to another account; nothing was changed.';
  end if;
  perform private.assert_restaurant(restaurant_data);
  for item in select value from jsonb_array_elements(sample_menu) loop
    perform private.assert_dish(item);
  end loop;
  insert into public.restaurant_submissions(id,owner_id,data,menu,status,last_request_id)
  values(fixture_id,target_owner,restaurant_data,sample_menu,'draft',gen_random_uuid())
  on conflict(id) do nothing;
end;
$$;
select id, data->>'name' as name, status, jsonb_array_length(menu) as menu_items
from public.restaurant_submissions
where id='71162e3a-c898-44a6-82a6-0328984e3156';
commit;
