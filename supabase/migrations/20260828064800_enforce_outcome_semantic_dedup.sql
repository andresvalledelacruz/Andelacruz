create unique index if not exists recommendation_outcomes_semantic_uidx
on public.recommendation_outcomes (
  decision_id,
  outcome_type,
  coalesce(recommendation_kind, ''),
  coalesce(recommendation_id, '')
);
