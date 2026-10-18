-- Tasnim reklama sayti → CRM: saytdagi ariza to'g'ridan-to'g'ri CRM'ning "Reklama" bo'limiga tushadi.
-- Supabase → SQL Editor → shu faylni to'liq joylab, "Run" bosing. Qayta ishga tushirish xavfsiz.
--
-- Sayt (kirmagan foydalanuvchi, anon) faqat shu funksiyani chaqira oladi:
--   arizani crm_records jadvaliga, 'adMessages' to'plamiga yozadi (CRM yozuvi shaklida).
-- Jadvalning o'zini o'qish/yozish huquqi berilmaydi — CRM ma'lumotlari himoyalangan qoladi.
-- Bir sahifadan qayta yuborilsa (mijoz ma'lumotini tuzatsa) — yangi ariza emas, o'sha ariza yangilanadi;
-- CRM'dagi "Javob" va "Izoh" saqlanib qoladi.

create or replace function public.reklama_submit_lead(
  p_form_id text, p_name text, p_phone text, p_course text, p_source text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_name text := left(btrim(coalesce(p_name, '')), 80);
  v_phone text := left(btrim(coalesce(p_phone, '')), 25);
  v_course text := left(btrim(coalesce(p_course, '')), 200);
  v_source text := left(btrim(coalesce(p_source, '')), 80);
  v_ext text;
  v_row public.crm_records;
  v_id bigint;
  v_now text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  if coalesce(p_form_id, '') !~ '^[A-Za-z0-9-]{8,64}$' then raise exception 'Noto''g''ri ariza raqami'; end if;
  if length(v_name) < 2 then raise exception 'Ism noto''g''ri'; end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) < 9 then raise exception 'Telefon noto''g''ri'; end if;
  v_ext := 'sayt:' || p_form_id;

  -- Spamdan himoya: bir daqiqada 30 tadan ortiq yangi ariza qabul qilinmaydi
  if (select count(*) from public.crm_records
      where collection = 'adMessages' and updated_at > now() - interval '1 minute' and data->>'externalId' like 'sayt:%') > 30 then
    raise exception 'Juda ko''p so''rov, birozdan keyin urinib ko''ring';
  end if;

  select * into v_row from public.crm_records
  where collection = 'adMessages' and data->>'externalId' = v_ext and not deleted
  limit 1;

  if found then
    update public.crm_records
    set data = data || jsonb_build_object('name', v_name, 'phone', v_phone, 'course', v_course)
    where collection = v_row.collection and id = v_row.id;
    return;
  end if;

  -- CRM'dagi newId() bilan bir xil shakldagi raqam: millisekund * 1000 + tasodifiy son
  v_id := (extract(epoch from clock_timestamp()) * 1000)::bigint * 1000 + floor(random() * 1000)::int;
  insert into public.crm_records (collection, id, data)
  values ('adMessages', v_id::text, jsonb_build_object(
    'id', v_id,
    'sourceId', null,
    'externalId', v_ext,
    'name', v_name,
    'phone', v_phone,
    'message', '',
    'course', v_course,
    'utm', v_source,
    'origin', 'Sayt',
    'receivedAt', v_now,
    'fetchedAt', v_now,
    'answered', false,
    'note', ''
  ));
end $$;

revoke all on function public.reklama_submit_lead(text, text, text, text, text) from public;
grant execute on function public.reklama_submit_lead(text, text, text, text, text) to anon, authenticated;
