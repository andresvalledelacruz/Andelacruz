# Recovery and server-side publication hold

The deployed `submit-story` v8 and `withdraw-story` v1 sources were retrieved from the existing connected Supabase project on 16 October 2026. They contain environment variable references, not secret values. Previously neither function was versioned here. The public frontend uses these functions, not the separate Render staging API.

The frontend publication pause did not have an equivalent submission guard in deployed v8. `submit-story` now has a reviewed code constant `STORY_SUBMISSIONS_PAUSED = true`. An allowed-origin POST returns 503 `publication_paused` before reading the body, authenticating, creating a database client or calling the recommendation runtime. OPTIONS, origin rejection and unsupported-method responses remain available. Reopening requires a reviewed code change and the existing reopening checks; restoring this source is not permission to reopen.

`withdraw-story` is an unchanged recovery snapshot of deployed v1. Do not redeploy it as part of this submission hold. Withdrawal must remain independent from the submission pause. The existing remote `verify_jwt:false` settings are retained: submission performs its own user validation when enabled, and withdrawal uses a private withdrawal code. No authentication protection is relaxed by this patch.

No schema, policy, role, secret or personal record is changed. Existing package imports are preserved for source recovery; dependency pinning and the legacy service-role/RPC design still need a separate review before reopening. Do not treat these snapshots as a complete approval of the original backend.

Tests run the TypeScript handler in an isolated Node context with database/network access stubbed to throw. They prove that paused requests do not read the body or reach dependencies, reject disallowed origins and retain withdrawal validation. Remote smoke tests must use OPTIONS/GET and an empty POST only; never create or withdraw a real story for QA.
