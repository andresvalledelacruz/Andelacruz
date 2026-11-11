begin;

do $$
begin
  -- Some staging tables predate the repository migration chain. Keep this
  -- migration safe for fresh installations where those tables do not exist.
  if to_regclass('private.safety_incidents') is not null then
    create index if not exists safety_incidents_assigned_to_idx
      on private.safety_incidents (assigned_to);
  end if;

  if to_regclass('public.commercial_conversion_receipts') is not null then
    create index if not exists commercial_conversion_receipts_offer_idx
      on public.commercial_conversion_receipts (offer_id);
  end if;

  if to_regclass('public.partner_verification_events') is not null then
    create index if not exists partner_verification_events_partner_idx
      on public.partner_verification_events (partner_id);
  end if;

  if to_regclass('public.staging_story_update_candidates') is not null then
    create index if not exists staging_story_update_candidates_story_idx
      on public.staging_story_update_candidates (story_id, submitted_at desc);
  end if;

  if to_regclass('public.staging_story_updates') is not null then
    create index if not exists staging_story_updates_story_published_idx
      on public.staging_story_updates (story_id, published_at asc);
  end if;
end
$$;

commit;
