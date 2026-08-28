# Recommendation System Security Baseline

## Purpose

This document records security decisions that are intentional and must not be weakened merely to silence automated advisories.

## Data minimisation

Recommendation telemetry must not persist the user's story, free text, name, email, phone, DNI, postal address, IP address, account/card details or direct user identifiers. Decision and outcome tables remain RLS-enabled with no direct anon/authenticated policies; writes are mediated by Edge Functions using validated structured payloads.

## Safety hierarchy

Safety override takes precedence over recommendations, learning and monetisation. Partner recommendations and partner outcome telemetry are forbidden during a safety override. Emergency telephone links must never be delayed by analytics.

## Staff SECURITY DEFINER functions

The following authenticated functions intentionally use SECURITY DEFINER because they need access to protected moderation/safety data, but they call `require_staff_capability_aal2(...)` before reading or mutating privileged data:

- `get_active_safety_protocol`
- `list_safety_queue`
- `moderate_story`
- `update_safety_incident`

`require_staff_capability_aal2` requires a permanent non-anonymous account, JWT AAL2, an active staff membership and the requested capability. Its EXECUTE privilege is not granted to anon/authenticated directly.

`has_staff_capability` is an authenticated helper that only returns whether the current authenticated user has an active capability.

## Public story read function

`list_public_stories` intentionally remains SECURITY DEFINER and executable by anon/authenticated. It returns an explicit public column list and filters to `status='published'` and `deleted_at is null`, with bounded pagination.

Do not convert it to SECURITY INVOKER by simply broadening the authenticated `stories` RLS policy. The authenticated role currently has SELECT privileges on internal story columns including `author_user_id` and `publication_consent`; broadening the base-table RLS would expose more data than the narrow RPC currently returns.

## User reporting

`report_story` intentionally remains available to authenticated sessions, including anonymous Supabase sessions. It requires `auth.uid()`, checks that the story is published, rate-limits reports, prevents duplicate open reports and records moderation/audit events.

## Learning integrity

Outcome events require a real recent decision, are semantically deduplicated and capped per decision. An `opportunity_id` is accepted only if it was eligible in the original decision. Learning snapshots only aggregate events with a non-null verified opportunity ID. Fewer than 10 samples remain early; 10–49 are partial; 50+ are measured.

## Runtime release policy

Production recommendation runtime must import its contract from an immutable Git commit, persist that same `brain_commit` on every decision and expose the commit in its structured response. A release is only eligible after repository quality/SEO checks pass.

## Outstanding platform hardening

Supabase Auth leaked-password protection should be reviewed/enabled through the Auth configuration when available. This is independent of the anonymous-first story flow and should not be conflated with database RPC permissions.
