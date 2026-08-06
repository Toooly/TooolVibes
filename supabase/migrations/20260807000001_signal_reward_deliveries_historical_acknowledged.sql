-- Historical pending deliveries predate the event-driven celebration contract.
-- Treating them as already acknowledged prevents a celebration avalanche for
-- existing users; only grants created AFTER this migration can surface as new celebrations.
update public.signal_reward_deliveries
set
  status = 'acknowledged',
  acknowledged_at = coalesce(acknowledged_at, timezone('utc', now())),
  updated_at = timezone('utc', now())
where status = 'pending';
