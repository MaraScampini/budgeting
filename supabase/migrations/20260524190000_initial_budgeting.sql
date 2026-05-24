create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  slug text not null check (slug in ('mara', 'pau')),
  name text not null,
  color text not null default '#576f53',
  created_at timestamptz not null default now(),
  unique (household_id, slug)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking', 'saving', 'cash')),
  owner text not null check (owner in ('mara', 'pau', 'joint')),
  starting_balance numeric(12,2) not null default 0,
  current_balance numeric(12,2) not null default 0,
  last_checked date,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income', 'transfer', 'saving')),
  owner text not null check (owner in ('mara', 'pau', 'joint')),
  default_account_id uuid references public.accounts(id) on delete set null,
  color text not null default '#576f53',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  transaction_date date not null default current_date,
  kind text not null check (kind in ('expense', 'income', 'transfer', 'bill', 'settlement')),
  description text not null default '',
  amount numeric(12,2) not null check (amount >= 0),
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  paid_by text check (paid_by in ('mara', 'pau', 'joint')),
  transfer_account_id uuid references public.accounts(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete restrict,
  due_day integer not null check (due_day between 1 and 31),
  amount_type text not null check (amount_type in ('fixed', 'variable')),
  expected_amount numeric(12,2) not null default 0,
  owner text not null check (owner in ('mara', 'pau', 'joint')),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bill_instances (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  recurring_bill_id uuid not null references public.recurring_bills(id) on delete cascade,
  month date not null,
  due_date date not null,
  amount numeric(12,2) not null default 0,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  paid_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (recurring_bill_id, month)
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  owed_by text not null check (owed_by in ('mara', 'pau')),
  owed_to text not null check (owed_to in ('mara', 'pau')),
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists accounts_household_id_idx on public.accounts(household_id);
create index if not exists categories_household_id_idx on public.categories(household_id);
create index if not exists transactions_household_date_idx on public.transactions(household_id, transaction_date desc);
create index if not exists recurring_bills_household_id_idx on public.recurring_bills(household_id);
create index if not exists bill_instances_household_month_idx on public.bill_instances(household_id, month);
create index if not exists expense_splits_household_status_idx on public.expense_splits(household_id, status);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.people enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.bill_instances enable row level security;
alter table public.expense_splits enable row level security;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = (select auth.uid())
  );
$$;

create policy "members can read households"
on public.households for select
to authenticated
using (public.is_household_member(id));

create policy "members can read memberships"
on public.household_members for select
to authenticated
using (user_id = (select auth.uid()) or public.is_household_member(household_id));

create policy "members can manage people"
on public.people for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "members can manage accounts"
on public.accounts for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "members can manage categories"
on public.categories for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "members can manage transactions"
on public.transactions for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "members can manage recurring bills"
on public.recurring_bills for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "members can manage bill instances"
on public.bill_instances for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "members can manage expense splits"
on public.expense_splits for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
