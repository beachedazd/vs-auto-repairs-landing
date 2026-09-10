create table public.vsauto_square_events (
 event_id text primary key,
 event_type text not null,
 status text not null check(status in ('processing','done','failed')),
 attempts integer not null default 1,
 lock_until timestamptz,
 last_error text,
 received_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.vsauto_square_events enable row level security;
revoke all on public.vsauto_square_events from anon,authenticated;
grant all on public.vsauto_square_events to service_role;
create or replace function public.vsauto_claim_square_event(p_id text,p_type text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare claimed text; existing text;
begin
 insert into public.vsauto_square_events(event_id,event_type,status,lock_until) values(p_id,p_type,'processing',now()+interval '90 seconds')
 on conflict(event_id) do update set status='processing',attempts=public.vsauto_square_events.attempts+1,lock_until=now()+interval '90 seconds',updated_at=now()
 where public.vsauto_square_events.status<>'done' and (public.vsauto_square_events.lock_until is null or public.vsauto_square_events.lock_until<now()) returning event_id into claimed;
 select status into existing from public.vsauto_square_events where event_id=p_id;
 return jsonb_build_object('claimed',claimed is not null,'status',existing);
end;
$$;
create or replace function public.vsauto_finish_square_event(p_id text,p_success boolean,p_error text) returns void language sql security invoker set search_path='' as $$
 update public.vsauto_square_events set status=case when p_success then 'done' else 'failed' end,lock_until=null,last_error=p_error,updated_at=now() where event_id=p_id;
$$;
revoke all on function public.vsauto_claim_square_event(text,text),public.vsauto_finish_square_event(text,boolean,text) from public,anon,authenticated;
grant execute on function public.vsauto_claim_square_event(text,text),public.vsauto_finish_square_event(text,boolean,text) to service_role;
