-- PostgreSQL catalog and restaurant-owner workflow. Run on a new Supabase project.
begin;
revoke create on schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create function private.valid_text(v jsonb, maximum integer, required boolean default true)
returns boolean language sql immutable set search_path = '' as $$
  select case when v is null or v = 'null'::jsonb then not required else coalesce(
    jsonb_typeof(v) = 'string' and char_length(btrim(v #>> '{}')) between (case when required then 1 else 0 end) and maximum
    and translate(v #>> '{}', E'\n\r\t', '') !~ '[[:cntrl:]]', false) end;
$$;
create function private.valid_https(v text, hosts text[] default null)
returns boolean language sql immutable set search_path = '' as $$
  select v is null or v = '' or (
    v ~ '^https://([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:[0-9]{1,5})?([/?#][^[:cntrl:]]*)?$'
    and char_length(v) <= 2000 and (hosts is null or lower(substring(v from '^https://([^/:?#]+)')) = any(hosts)));
$$;
create function private.valid_meals(v jsonb) returns boolean language plpgsql immutable set search_path = '' as $$
begin
  if v is null or jsonb_typeof(v) <> 'array' then return false; end if;
  return jsonb_array_length(v) between 1 and 5
    and not exists(select 1 from jsonb_array_elements_text(v) m where m not in ('sang','trua','chieu','toi','khuya'))
    and (select count(*) = count(distinct m) from jsonb_array_elements_text(v) m);
end;
$$;
create function private.valid_day(v jsonb) returns boolean language plpgsql stable set search_path = '' as $$
begin
  if not private.valid_text(v,10) or (v #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
  return to_char((v #>> '{}')::date,'YYYY-MM-DD')=(v #>> '{}') and (v #>> '{}')::date <= (now() at time zone 'Asia/Ho_Chi_Minh')::date;
exception when invalid_datetime_format or datetime_field_overflow then return false;
end;
$$;
create function private.assert_dish(d jsonb) returns void language plpgsql set search_path = '' as $$
declare r jsonb; p jsonb; v numeric; lim numeric; k text;
begin
  if jsonb_typeof(d) is distinct from 'object' or not private.valid_text(d->'name',255)
    or not private.valid_text(d->'desc',5000,false) or not private.valid_meals(d->'meals')
    or coalesce(d->>'cuisine','') not in ('viet','nhat','han','trung','thai','y','quoc-te') then
    raise exception 'Tên món, mô tả, ẩm thực hoặc bữa ăn chưa hợp lệ.' using errcode='22023';
  end if;
  if coalesce(d->>'imageUrl','') <> '' and not private.valid_https(d->>'imageUrl')
    and (d->>'imageUrl') !~ '^/images/[a-zA-Z0-9_./-]+$' then
    raise exception 'Ảnh phải là URL HTTPS hoặc ảnh có sẵn của website.' using errcode='22023';
  end if;
  r := d->'vegetarianReview';
  if r is not null and r <> 'null'::jsonb then
    if coalesce(r->>'status','') not in ('reviewed','source-declared') or not private.valid_text(r->'scope',5000)
      or not private.valid_text(r->'source',2000,false) or not private.valid_https(r->>'source') then
      raise exception 'Nhãn ăn chay cần phạm vi và nguồn HTTPS.' using errcode='22023';
    end if;
    if r->>'status'='reviewed' then
      if not private.valid_text(r->'source',2000) or jsonb_typeof(r->'ingredients') is distinct from 'array' or not private.valid_day(r->'reviewedAt') then
        raise exception 'Xác minh ăn chay cần nguyên liệu và ngày rà soát hợp lệ.' using errcode='22023';
      end if;
      if jsonb_array_length(r->'ingredients') not between 1 and 100 or exists(select 1 from jsonb_array_elements(r->'ingredients') i where not private.valid_text(i,255)) then
        raise exception 'Danh sách nguyên liệu xác minh chưa hợp lệ.' using errcode='22023';
      end if;
    else
      -- Imported declarations retain their workbook/venue evidence, never ingredient verification.
      if not private.valid_text(r->'source',2000) then
        if jsonb_typeof(r->'restaurantIds') is distinct from 'array' then raise exception 'Khai báo ăn chay cần nguồn hoặc quán trong danh mục.' using errcode='22023'; end if;
        if jsonb_array_length(r->'restaurantIds') not between 1 and 100 then raise exception 'Thiếu nguồn khai báo ăn chay.' using errcode='22023'; end if;
      end if;
      if r ? 'reviewedAt' and not private.valid_day(r->'reviewedAt') then raise exception 'Ngày rà soát chưa hợp lệ.' using errcode='22023'; end if;
    end if;
  end if;
  p := d->'nutritionProfile';
  if p is not null and p<>'null'::jsonb then
    if jsonb_typeof(p) is distinct from 'object' or not private.valid_text(p->'scope',5000)
      or not private.valid_text(p->'sourceLabel',500) or not private.valid_text(p->'source',2000) or not private.valid_https(p->>'source')
      or not private.valid_text(p->'serving',500) or not private.valid_text(p->'dataNote',5000) or not private.valid_day(p->'checkedAt') then
      raise exception 'Căn cứ dinh dưỡng cần nguồn, phạm vi, khẩu phần, giới hạn và ngày đối chiếu.' using errcode='22023';
    end if;
    foreach k in array array['energyKcal','sugarsG','carbohydrateG'] loop
      if jsonb_typeof(p->'values'->k) is distinct from 'number' then raise exception 'Thiếu số liệu dinh dưỡng.' using errcode='22023'; end if;
      if (p->'values'->>k)::numeric not between 0 and 100000 then raise exception 'Số liệu dinh dưỡng ngoài giới hạn.' using errcode='22023'; end if;
    end loop;
  end if;
  if coalesce(d->'nutritionReviews','[]'::jsonb) <> '[]'::jsonb then
    if jsonb_typeof(d->'nutritionReviews') is distinct from 'array' or jsonb_typeof(p) is distinct from 'object'
      or coalesce(p->>'foodForm','') not in ('solid','liquid') or not private.valid_text(p->'scope',5000)
      or not private.valid_text(p->'source',2000) or not private.valid_https(p->>'source')
      or jsonb_typeof(p->'servingQuantity') is distinct from 'number' then
      raise exception 'Nhãn dinh dưỡng cần số liệu, khẩu phần và nguồn.' using errcode='22023';
    end if;
    if (p->>'servingQuantity')::numeric <= 0 or coalesce(p->>'servingUnit','') <> (case when p->>'foodForm'='solid' then 'g' else 'ml' end) then
      raise exception 'Khẩu phần dinh dưỡng chưa hợp lệ.' using errcode='22023';
    end if;
    for r in select value from jsonb_array_elements(d->'nutritionReviews') loop
      if coalesce(r->>'key','') not in ('low-sugar','low-energy') or r->>'status' is distinct from 'verified'
        or not private.valid_text(r->'basis',5000) or not private.valid_text(r->'source',2000)
        or not private.valid_https(r->>'source') then raise exception 'Căn cứ nhãn chưa hợp lệ.' using errcode='22023'; end if;
      if jsonb_typeof(p->'values'->(case when r->>'key'='low-sugar' then 'sugarsG' else 'energyKcal' end)) is distinct from 'number' then
        raise exception 'Thiếu số liệu cho nhãn dinh dưỡng.' using errcode='22023';
      end if;
      v := (p->'values'->>(case when r->>'key'='low-sugar' then 'sugarsG' else 'energyKcal' end))::numeric;
      lim := case when r->>'key'='low-sugar' then case when p->>'foodForm'='solid' then 5 else 2.5 end else case when p->>'foodForm'='solid' then 40 else 20 end end;
      if v < 0 or 100*v/(p->>'servingQuantity')::numeric > lim then
        raise exception 'Số liệu không đạt ngưỡng của nhãn dinh dưỡng.' using errcode='22023';
      end if;
    end loop;
  end if;
end;
$$;
create function private.assert_restaurant(d jsonb) returns void language plpgsql set search_path = '' as $$
declare k text;
begin
  if jsonb_typeof(d) is distinct from 'object' or not private.valid_text(d->'name',255)
    or not private.valid_text(d->'address',500) or not private.valid_text(d->'area',120)
    or not private.valid_text(d->'category',120) then
    raise exception 'Cần tên quán, địa chỉ, khu vực và nhóm món.' using errcode='22023';
  end if;
  foreach k in array array['website','imageUrl','grabFoodUrl','shopeeFoodUrl'] loop
    if not private.valid_text(d->k,2000,false) or not private.valid_https(d->>k,
      case k when 'grabFoodUrl' then array['food.grab.com'] when 'shopeeFoodUrl' then array['shopeefood.vn','www.shopeefood.vn'] else null end) then
      raise exception 'Đường dẫn % chưa hợp lệ.', k using errcode='22023';
    end if;
  end loop;
  if not private.valid_text(d->'phone',40,false) or not private.valid_text(d->'hours',500,false) or not private.valid_text(d->'priceLabel',255,false) then
    raise exception 'Thông tin liên hệ, giờ mở cửa hoặc giá quá dài.' using errcode='22023';
  end if;
  if coalesce(d->>'phone','')<>'' and ((d->>'phone') !~ '^[+0-9().[:space:]-]+$' or char_length(regexp_replace(d->>'phone','[^0-9]','','g'))<6) then
    raise exception 'Số điện thoại chưa hợp lệ.' using errcode='22023';
  end if;
end;
$$;
create function private.assert_recipe(d jsonb) returns void language plpgsql set search_path = '' as $$
declare i jsonb; q jsonb; amount numeric;
begin
  if jsonb_typeof(d) is distinct from 'object' or jsonb_typeof(d->'servings') is distinct from 'number'
    or not private.valid_text(d->'prep',255) or not private.valid_text(d->'cook',255)
    or not private.valid_text(d->'tip',5000,false) or not private.valid_text(d->'source'->'label',500)
    or not private.valid_text(d->'source'->'url',2000) or not private.valid_https(d->'source'->>'url')
    or jsonb_typeof(d->'ingredients') is distinct from 'array' or jsonb_typeof(d->'steps') is distinct from 'array' then
    raise exception 'Công thức cần khẩu phần, nguyên liệu, các bước và nguồn HTTPS.' using errcode='22023';
  end if;
  if (d->>'servings')::numeric not between 1 and 12 or (d->>'servings')::numeric <> trunc((d->>'servings')::numeric)
    or jsonb_array_length(d->'ingredients') not between 1 and 100 or jsonb_array_length(d->'steps') not between 1 and 100 then
    raise exception 'Khẩu phần từ 1–12 người; cần 1–100 nguyên liệu và bước nấu.' using errcode='22023';
  end if;
  for i in select value from jsonb_array_elements(d->'ingredients') loop
    if not private.valid_text(i->'name',255) then raise exception 'Tên nguyên liệu chưa hợp lệ.' using errcode='22023'; end if;
    if i ? 'text' then
      if not private.valid_text(i->'text',500) or i ? 'amount' then raise exception 'Định lượng văn bản chưa hợp lệ.' using errcode='22023'; end if;
    else
      if not private.valid_text(i->'unit',80) then raise exception 'Thiếu đơn vị nguyên liệu.' using errcode='22023'; end if;
      q := case when jsonb_typeof(i->'amount')='array' then i->'amount' else jsonb_build_array(i->'amount') end;
      if jsonb_array_length(q) not between 1 and 2 then raise exception 'Khoảng định lượng chưa hợp lệ.' using errcode='22023'; end if;
      if exists(select 1 from jsonb_array_elements(q) n where jsonb_typeof(n) <> 'number' or n = 'null'::jsonb) then raise exception 'Định lượng phải là số.' using errcode='22023'; end if;
      for amount in select value::text::numeric from jsonb_array_elements(q) loop
        if amount <= 0 or amount > 99999999 or amount <> round(amount,4) then raise exception 'Định lượng phải dương, tối đa 4 chữ số thập phân.' using errcode='22023'; end if;
      end loop;
      if jsonb_array_length(q)=2 and (q->>1)::numeric < (q->>0)::numeric then raise exception 'Khoảng định lượng bị đảo ngược.' using errcode='22023'; end if;
    end if;
  end loop;
  for i in select value from jsonb_array_elements(d->'steps') loop
    if jsonb_typeof(i) <> 'array' or jsonb_array_length(i) <> 2 or not private.valid_text(i->0,255) or not private.valid_text(i->1,5000) then
      raise exception 'Mỗi bước cần tiêu đề và hướng dẫn.' using errcode='22023';
    end if;
  end loop;
end;
$$;

create table public.restaurants (
  id text primary key check(id ~ '^[a-z0-9-]{1,100}$'),
  data jsonb not null check(jsonb_typeof(data)='object'),
  owner_id uuid references auth.users(id) on delete set null,
  is_visible boolean not null default true,
  revision integer not null default 1 check(revision>0),
  last_request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.dishes (
  id text primary key check(id ~ '^[a-z0-9-]{1,100}$'),
  data jsonb not null check(jsonb_typeof(data)='object'),
  restaurant_id text references public.restaurants(id),
  is_visible boolean not null default true,
  revision integer not null default 1 check(revision>0),
  last_request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.recipes (
  dish_id text primary key references public.dishes(id),
  data jsonb not null check(jsonb_typeof(data)='object'),
  is_visible boolean not null default true,
  revision integer not null default 1 check(revision>0),
  last_request_id uuid,
  updated_at timestamptz not null default now()
);
create table public.restaurant_dishes (
  id text primary key,
  dish_id text not null references public.dishes(id),
  restaurant_id text not null references public.restaurants(id),
  data jsonb not null check(jsonb_typeof(data)='object'),
  is_visible boolean not null default true,
  revision integer not null default 1 check(revision>0),
  last_request_id uuid,
  updated_at timestamptz not null default now(),
  unique(dish_id,restaurant_id),
  check(id=dish_id||'/'||restaurant_id)
);
create index on public.dishes(restaurant_id);
create index on public.restaurant_dishes(restaurant_id);
create table public.restaurant_submissions (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  menu jsonb not null check(jsonb_typeof(menu)='array'),
  status text not null default 'draft' check(status in ('draft','pending','approved','rejected')),
  revision integer not null default 1 check(revision>0),
  last_request_id uuid not null,
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);
create index on public.restaurant_submissions(owner_id);
create index on public.restaurant_submissions(status,submitted_at);
create table private.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  entity text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create function private.audit_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into private.audit_log(actor_id,entity,entity_id,before_data,after_data)
  values(auth.uid(),tg_table_name,coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'dish_id'),to_jsonb(old),to_jsonb(new));
  return new;
end;
$$;
create trigger audit_restaurants after insert or update on public.restaurants for each row execute function private.audit_change();
create trigger audit_dishes after insert or update on public.dishes for each row execute function private.audit_change();
create trigger audit_recipes after insert or update on public.recipes for each row execute function private.audit_change();
create trigger audit_links after insert or update on public.restaurant_dishes for each row execute function private.audit_change();
create trigger audit_submissions after insert or update on public.restaurant_submissions for each row execute function private.audit_change();

alter table public.restaurants enable row level security;
alter table public.dishes enable row level security;
alter table public.recipes enable row level security;
alter table public.restaurant_dishes enable row level security;
alter table public.restaurant_submissions enable row level security;
create policy restaurants_read on public.restaurants for select to anon, authenticated using(is_visible or (select public.is_admin()));
create policy dishes_read on public.dishes for select to anon, authenticated using((is_visible and (restaurant_id is null or exists(select 1 from public.restaurants r where r.id=restaurant_id and r.is_visible))) or (select public.is_admin()));
create policy recipes_read on public.recipes for select to anon, authenticated using((is_visible and exists(select 1 from public.dishes d where d.id=dish_id and d.is_visible)) or (select public.is_admin()));
create policy links_read on public.restaurant_dishes for select to anon, authenticated using((is_visible and exists(select 1 from public.dishes d where d.id=dish_id and d.is_visible) and exists(select 1 from public.restaurants r where r.id=restaurant_id and r.is_visible)) or (select public.is_admin()));
create policy submissions_read on public.restaurant_submissions for select to authenticated using(owner_id=(select auth.uid()) or (select public.is_admin()));
revoke all on public.restaurants, public.dishes, public.recipes, public.restaurant_dishes, public.restaurant_submissions from anon, authenticated;
grant select on public.restaurants, public.dishes, public.recipes, public.restaurant_dishes to anon, authenticated;
grant select on public.restaurant_submissions to authenticated;
-- Every write below runs validation, ownership checks and a transaction on the server.

create function public.get_catalog() returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'dishes',coalesce((select jsonb_agg((data #- '{source,restaurantIds}')||jsonb_build_object('id',id) order by created_at,id) from public.dishes where is_visible and (restaurant_id is null or exists(select 1 from public.restaurants r where r.id=restaurant_id and r.is_visible))),'[]'::jsonb),
    'restaurants',coalesce((select jsonb_agg(data||jsonb_build_object('id',id) order by created_at,id) from public.restaurants where is_visible),'[]'::jsonb),
    'links',coalesce((select jsonb_agg(l.data||jsonb_build_object('dishId',l.dish_id,'restaurantId',l.restaurant_id) order by l.id) from public.restaurant_dishes l join public.dishes d on d.id=l.dish_id and d.is_visible join public.restaurants r on r.id=l.restaurant_id and r.is_visible where l.is_visible),'[]'::jsonb),
    'recipes',coalesce((select jsonb_object_agg(r.dish_id,r.data) from public.recipes r join public.dishes d on d.id=r.dish_id and d.is_visible where r.is_visible and (d.restaurant_id is null or exists(select 1 from public.restaurants v where v.id=d.restaurant_id and v.is_visible))),'{}'::jsonb)
  );
$$;
revoke all on function public.get_catalog() from public;
grant execute on function public.get_catalog() to anon, authenticated;

create function public.save_submission(p_id uuid,p_revision integer,p_request_id uuid,p_data jsonb,p_menu jsonb,p_submit boolean default false)
returns public.restaurant_submissions language plpgsql security definer set search_path = '' as $$
declare current public.restaurant_submissions; result public.restaurant_submissions; item jsonb; k text;
begin
  if auth.uid() is null then raise exception 'Vui lòng đăng nhập.' using errcode='42501'; end if;
  if p_id is null or p_request_id is null or p_revision is null or p_submit is null or p_data is null or p_menu is null then raise exception 'Thiếu dữ liệu gửi lên.' using errcode='22023'; end if;
  -- Serialize new IDs too, so retried requests cannot create duplicate restaurants.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into current from public.restaurant_submissions where id=p_id for update;
  if found then
    if current.owner_id <> auth.uid() then raise exception 'Bạn không được sửa hồ sơ này.' using errcode='42501'; end if;
    if current.last_request_id=p_request_id then
      if current.data<>p_data or current.menu<>p_menu or (current.submitted_at is not null)<>p_submit then raise exception 'Mã yêu cầu đã được dùng cho nội dung khác.' using errcode='40001'; end if;
      return current;
    end if;
    if current.revision<>p_revision then raise exception 'Hồ sơ đã thay đổi. Hãy tải lại trước khi sửa.' using errcode='40001'; end if;
  elsif p_revision<>0 then raise exception 'Không tìm thấy hồ sơ.' using errcode='22023'; end if;
  if pg_column_size(p_data)+pg_column_size(p_menu)>131072 then raise exception 'Hồ sơ vượt quá dung lượng cho phép.' using errcode='22023'; end if;
  perform private.assert_restaurant(p_data);
  if not private.valid_text(p_data->'contactName',120) or not private.valid_text(p_data->'contactEmail',254)
    or coalesce(p_data->>'contactEmail','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or not private.valid_text(p_data->'phone',40) or p_data->>'consent' is distinct from 'true'
    or not private.valid_text(p_data->'sourceUrl',2000) or not private.valid_https(p_data->>'sourceUrl')
    or not private.valid_meals(p_data->'meals') then
    raise exception 'Cần người đại diện, email, số điện thoại, nguồn thực đơn, bữa phục vụ và đồng ý sử dụng dữ liệu.' using errcode='22023';
  end if;
  if jsonb_typeof(p_menu) <> 'array' or jsonb_array_length(p_menu) not between 1 and 50 then raise exception 'Cần 1–50 món trong thực đơn.' using errcode='22023'; end if;
  if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_menu)) then raise exception 'Mã món không được trùng.' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(p_menu) loop
    if coalesce(item->>'id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then raise exception 'Mã món chưa hợp lệ.' using errcode='22023'; end if;
    perform private.assert_dish(item);
    if item ?| array['vegetarianReview','nutritionReviews','nutritionProfile','source'] then raise exception 'Nhãn và xác minh chỉ được quản trị viên công bố.' using errcode='22023'; end if;
    if jsonb_typeof(item->'price') is distinct from 'number' then raise exception 'Mỗi món cần giá VND.' using errcode='22023'; end if;
    if (item->>'price')::numeric < 0 or (item->>'price')::numeric > 999999999999 or (item->>'price')::numeric <> trunc((item->>'price')::numeric) then raise exception 'Giá phải là số nguyên VND không âm.' using errcode='22023'; end if;
  end loop;
  insert into public.restaurant_submissions(id,owner_id,data,menu,status,last_request_id,submitted_at)
  values(p_id,auth.uid(),p_data,p_menu,case when p_submit then 'pending' else 'draft' end,p_request_id,case when p_submit then now() end)
  on conflict(id) do update set data=excluded.data,menu=excluded.menu,status=excluded.status,revision=restaurant_submissions.revision+1,last_request_id=p_request_id,review_note='',reviewed_at=null,submitted_at=excluded.submitted_at,updated_at=now()
  returning * into result;
  return result;
end;
$$;
revoke all on function public.save_submission(uuid,integer,uuid,jsonb,jsonb,boolean) from public;
grant execute on function public.save_submission(uuid,integer,uuid,jsonb,jsonb,boolean) to authenticated;

create function public.review_submission(p_id uuid,p_revision integer,p_approve boolean,p_note text default '')
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

create function public.save_catalog(p_kind text,p_id text,p_revision integer,p_request_id uuid,p_data jsonb,p_visible boolean default true)
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
  if p_kind='recipes' then
    -- A changed recipe must not retain an ingredient review for its earlier version.
    update public.dishes set data=data-'vegetarianReview',revision=revision+1,updated_at=now()
    where id=p_id and data->'vegetarianReview'->>'status'='reviewed';
  end if;
  execute format('select to_jsonb(t) from public.%I t where %I=$1',sql_table,key_column) into result using p_id;
  return result;
end;
$$;
revoke all on function public.save_catalog(text,text,integer,uuid,jsonb,boolean) from public;
grant execute on function public.save_catalog(text,text,integer,uuid,jsonb,boolean) to authenticated;

create function public.list_accounts(p_page integer default 1) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Chỉ quản trị viên được xem tài khoản.' using errcode='42501'; end if;
  if p_page is null or p_page not between 1 and 100000 then raise exception 'Số trang không hợp lệ.' using errcode='22023'; end if;
  return jsonb_build_object('total',(select count(*) from auth.users),'items',coalesce((select jsonb_agg(u) from (
    select id,email,created_at,exists(select 1 from private.admin_users a where a.user_id=auth.users.id) as is_admin from auth.users order by created_at,id limit 20 offset (p_page-1)*20
  ) u),'[]'::jsonb));
end;
$$;
revoke all on function public.list_accounts(integer) from public;
grant execute on function public.list_accounts(integer) to authenticated;
-- Validators and triggers are internal, not public RPC endpoints.
revoke all on all functions in schema private from public, anon, authenticated;
commit;
