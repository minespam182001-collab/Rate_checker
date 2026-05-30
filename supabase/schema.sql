-- Run this in the Supabase SQL editor to create the schema.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- providers — static metadata, updated daily
-- ---------------------------------------------------------------
create table if not exists providers (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null unique,
  logo_url             text,
  affiliate_url        text not null,
  trustpilot_score     numeric(3,1),
  trustpilot_reviews   integer,
  trustpilot_updated_at timestamptz,
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- rates — time-series, written every 15 min by the scraper
-- ---------------------------------------------------------------
create table if not exists rates (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references providers(id) on delete cascade,
  usd_inr_rate numeric(10,4) not null,
  fee_usd      numeric(8,2) not null default 0,
  scraped_at   timestamptz not null default now(),
  is_stale     boolean not null default false
);

-- Index used by the "latest rate per provider" query
create index if not exists rates_provider_scraped
  on rates (provider_id, scraped_at desc);

-- ---------------------------------------------------------------
-- Seed data — 5 providers
-- ---------------------------------------------------------------
insert into providers (name, logo_url, affiliate_url) values
  ('Remitly',         'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Remitly_logo.svg/320px-Remitly_logo.svg.png',  'https://www.remitly.com/us/en/india'),
  ('Wise',            'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Wise_logo.svg/320px-Wise_logo.svg.png',         'https://wise.com/us/send-money/usd-to-inr'),
  ('Western Union',   'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Western_Union_logo.svg/320px-Western_Union_logo.svg.png', 'https://www.westernunion.com/us/en/send-money/app/start'),
  ('Xoom',            'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Xoom_Logo.svg/320px-Xoom_Logo.svg.png',         'https://www.xoom.com/india/sendmoney'),
  ('ICICI Money2India','https://www.money2india.com/m2i/images/m2i-logo.png',                                                    'https://www.money2india.com'),
  ('Taptap Send',     'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Taptap_Send_logo.svg/320px-Taptap_Send_logo.svg.png', 'https://www.taptapsend.com/?lang=en-us')
on conflict (name) do nothing;
