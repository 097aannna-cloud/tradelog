create table if not exists profiles (
  id              uuid primary key references auth.users,
  created_at      timestamptz default now(),
  display_name    text,
  virtual_balance numeric default 1000000,
  total_trades    integer default 0,
  win_count       integer default 0,
  streak          integer default 0,
  best_streak     integer default 0,
  tier            text default 'Rookie',
  xp              integer default 0
);

create table if not exists paper_trades (
  id              bigserial primary key,
  user_id         uuid references profiles(id),
  created_at      timestamptz default now(),
  symbol          text not null,
  expiry          text,
  instrument      text not null,
  strike          numeric,
  action          text not null,
  lots            integer default 1,
  lot_size        integer default 65,
  qty             integer,
  entry_price     numeric not null,
  entry_time      timestamptz not null,
  entry_spot      numeric,
  entry_iv        numeric,
  entry_dte       integer,
  exit_price      numeric,
  exit_time       timestamptz,
  exit_spot       numeric,
  status          text default 'OPEN',
  pnl             numeric,
  hold_minutes    integer,
  session_id      text,
  screen_secs     integer,
  strikes_viewed  integer,
  mode_used       text,
  market_regime   text
);

create table if not exists journal_entries (
  id           bigserial primary key,
  user_id      uuid references profiles(id),
  date         date not null,
  mood         text,
  market_view  text,
  plan         text,
  review       text,
  pnl_today    numeric,
  trades_today integer,
  unique(user_id, date)
);

alter table profiles       enable row level security;
alter table paper_trades   enable row level security;
alter table journal_entries enable row level security;

create policy "own profile"  on profiles       for all using (auth.uid()=id);
create policy "own trades"   on paper_trades   for all using (auth.uid()=user_id);
create policy "own journal"  on journal_entries for all using (auth.uid()=user_id);