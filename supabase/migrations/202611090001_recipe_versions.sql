-- Upgrade an existing project after 202611070001_catalog.sql; preserves stored catalog data.
begin;

create or replace function public.review_submission(p_id uuid,p_revision integer,p_approve boolean,p_note text default '')
returns public.restaurant_submissions language plpgsql security definer set search_path = '' as $$
declare s public.restaurant_submissions; rid text; did text; item jsonb; d jsonb; photo jsonb;
begin
  if not public.is_admin() then raise exception 'Chỉ quản trị viên được duyệt.' using errcode='42501'; end if;
  if p_approve is null or p_revision is null or p_note is null or char_length(p_note)>2000 or (not p_approve and btrim(p_note)='') then raise exception 'Cần ghi lý do khi từ chối, tối đa 2000 ký tự.' using errcode='22023'; end if;
  select * into s from public.restaurant_submissions where id=p_id for update;
  if not found or s.status<>'pending' then raise exception 'Hồ sơ không còn chờ duyệt.' using errcode='40001'; end if;
  if s.revision<>p_revision then raise exception 'Chủ quán đã sửa hồ sơ. Hãy tải lại để đối chiếu.' using errcode='40001'; end if;
  if p_approve then
    rid := 'r-'||s.id;
    perform private.assert_restaurant(s.data);
    photo := case when coalesce(s.data->>'imageUrl','')<>'' then jsonb_build_object('kind','owner-provided','url',s.data->>'imageUrl','sourceUrl',s.data->>'sourceUrl','sourceLabel','Ảnh do quán cung cấp') else jsonb_build_object('kind','illustration','sourceLabel','Chưa có ảnh phù hợp') end;
    d := jsonb_build_object('id',rid,'name',s.data->>'name','address',s.data->>'address','area',s.data->>'area','category',s.data->>'category','originalCategory',s.data->>'category','phone',s.data->>'phone','hours',s.data->>'hours','website',s.data->>'website','priceLabel',s.data->>'priceLabel','priceTier',s.data->>'priceTier','grabFoodUrl',s.data->>'grabFoodUrl','shopeeFoodUrl',s.data->>'shopeeFoodUrl','suggestedMeals',s.data->'meals','photo',photo,'verification','owner-supplied','partner',true,'source',jsonb_build_object('type','owner-submission','url',s.data->>'sourceUrl','reviewedAt',current_date));
    insert into public.restaurants(id,data,owner_id) values(rid,d,s.owner_id)
    on conflict(id) do update set data=excluded.data,is_visible=true,revision=restaurants.revision+1,updated_at=now();
    update public.dishes set is_visible=false,revision=revision+1,updated_at=now() where restaurant_id=rid;
    update public.restaurant_dishes set is_visible=false,revision=revision+1,updated_at=now() where restaurant_id=rid;
    for item in select value from jsonb_array_elements(s.menu) loop
      perform private.assert_dish(item);
      did := 'd-'||s.id||'-'||(item->>'id');
      -- A renamed menu item must not publish the previous food's recipe.
      update public.recipes r set is_visible=false,revision=r.revision+1,updated_at=now()
      where r.dish_id=did and exists (
        select 1 from public.dishes previous where previous.id=did
          and (previous.data->>'name' is distinct from item->>'name'
            or previous.data->>'cuisine' is distinct from item->>'cuisine')
      );
      d := jsonb_build_object('id',did,'name',item->>'name','desc',item->>'desc','cuisine',item->>'cuisine','meals',item->'meals','imageUrl',item->>'imageUrl','imageSource',jsonb_build_object('label','Ảnh do quán cung cấp','url',s.data->>'sourceUrl'),'source',jsonb_build_object('type','owner-submission','url',s.data->>'sourceUrl'));
      insert into public.dishes(id,data,restaurant_id) values(did,d,rid)
      on conflict(id) do update set data=excluded.data,is_visible=true,revision=dishes.revision+1,updated_at=now();
      insert into public.restaurant_dishes(id,dish_id,restaurant_id,data)
      values(did||'/'||rid,did,rid,jsonb_build_object('type','dish','offering',item->>'name','priceVnd',(item->>'price')::bigint,'sourceUrl',s.data->>'sourceUrl','evidence','Thực đơn do quán cung cấp, đã được quản trị viên duyệt'))
      on conflict(id) do update set data=excluded.data,is_visible=true,revision=restaurant_dishes.revision+1,updated_at=now();
    end loop;
  end if;
  update public.restaurant_submissions set status=case when p_approve then 'approved' else 'rejected' end,review_note=p_note,reviewed_at=now(),revision=revision+1,updated_at=now() where id=p_id returning * into s;
  return s;
end;
$$;
revoke all on function public.review_submission(uuid,integer,boolean,text) from public;
grant execute on function public.review_submission(uuid,integer,boolean,text) to authenticated;

create or replace function public.save_catalog(p_kind text,p_id text,p_revision integer,p_request_id uuid,p_data jsonb,p_visible boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare row_data jsonb; result jsonb; sql_table text; key_column text; d jsonb; dish_key text; venue_key text;
begin
  if not public.is_admin() then raise exception 'Chỉ quản trị viên được sửa danh mục.' using errcode='42501'; end if;
  if p_kind not in ('dishes','restaurants','recipes','links') or p_kind is null or p_id is null or p_request_id is null or p_revision is null or p_visible is null or jsonb_typeof(p_data) is distinct from 'object' or pg_column_size(p_data)>131072 then raise exception 'Dữ liệu danh mục chưa hợp lệ.' using errcode='22023'; end if;
  sql_table := case when p_kind='links' then 'restaurant_dishes' else p_kind end;
  key_column := case when p_kind='recipes' then 'dish_id' else 'id' end;
  if p_kind='links' then
    dish_key := split_part(p_id,'/',1); venue_key := split_part(p_id,'/',2);
    if p_id<>dish_key||'/'||venue_key or dish_key !~ '^[a-z0-9-]{1,100}$' or venue_key !~ '^[a-z0-9-]{1,100}$'
      or coalesce(p_data->>'type','') not in ('dish','related') or not private.valid_text(p_data->'offering',500)
      or not private.valid_text(p_data->'sourceUrl',2000,p_visible) or not private.valid_https(p_data->>'sourceUrl') then raise exception 'Liên kết cần món, quán, phiên bản và nguồn thực đơn HTTPS.' using errcode='22023'; end if;
    if p_data->'priceVnd' is not null and p_data->'priceVnd'<>'null'::jsonb then
      if jsonb_typeof(p_data->'priceVnd')<>'number' then raise exception 'Giá VND chưa hợp lệ.' using errcode='22023'; end if;
      if (p_data->>'priceVnd')::numeric not between 0 and 999999999999 or (p_data->>'priceVnd')::numeric<>trunc((p_data->>'priceVnd')::numeric) then raise exception 'Giá VND chưa hợp lệ.' using errcode='22023'; end if;
    end if;
  elsif p_id !~ '^[a-z0-9-]{1,100}$' then raise exception 'Mã danh mục chưa hợp lệ.' using errcode='22023'; end if;
  if p_kind='dishes' then perform private.assert_dish(p_data);
  elsif p_kind='restaurants' then perform private.assert_restaurant(p_data);
  elsif p_kind='recipes' then perform private.assert_recipe(p_data); end if;
  perform pg_advisory_xact_lock(hashtextextended(p_kind||'/'||p_id,0));
  execute format('select to_jsonb(t) from public.%I t where %I=$1 for update',sql_table,key_column) into row_data using p_id;
  if row_data is null then
    if p_revision<>0 then raise exception 'Không tìm thấy mục để sửa.' using errcode='40001'; end if;
    if p_kind='links' then
      insert into public.restaurant_dishes(id,dish_id,restaurant_id,data,is_visible,last_request_id) values(p_id,dish_key,venue_key,p_data,p_visible,p_request_id);
    else
      execute format('insert into public.%I(%I,data,is_visible,last_request_id) values($1,$2,$3,$4)',sql_table,key_column) using p_id,p_data,p_visible,p_request_id;
    end if;
  else
    if row_data->>'last_request_id'=p_request_id::text then
      if row_data->'data'<>p_data or (row_data->>'is_visible')::boolean<>p_visible then raise exception 'Mã yêu cầu đã được dùng cho nội dung khác.' using errcode='40001'; end if;
      return row_data;
    end if;
    if (row_data->>'revision')::integer<>p_revision then raise exception 'Nội dung đã thay đổi. Hãy tải lại trước khi sửa.' using errcode='40001'; end if;
    execute format('update public.%I set data=$2,is_visible=$3,revision=revision+1,last_request_id=$4,updated_at=now() where %I=$1',sql_table,key_column) using p_id,p_data,p_visible,p_request_id;
  end if;
  if p_kind='recipes' and (row_data is null or row_data->'data' is distinct from p_data) then
    -- Verification belongs to the recipe that was reviewed, not its replacement.
    update public.dishes set data=(case when data->'vegetarianReview'->>'status'='reviewed'
      then data-'vegetarianReview' else data end)-'nutritionProfile'-'nutritionReviews',
      revision=revision+1,updated_at=now()
    where id=p_id and (data->'vegetarianReview'->>'status'='reviewed'
      or data ? 'nutritionProfile' or data ? 'nutritionReviews');
  end if;
  execute format('select to_jsonb(t) from public.%I t where %I=$1',sql_table,key_column) into result using p_id;
  return result;
end;
$$;
revoke all on function public.save_catalog(text,text,integer,uuid,jsonb,boolean) from public;
grant execute on function public.save_catalog(text,text,integer,uuid,jsonb,boolean) to authenticated;

commit;
