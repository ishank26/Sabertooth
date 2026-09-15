# Free-access security boundary

Removing a paid entitlement is not the same as removing authentication.

Sabertooth free mode intentionally leaves these checks in place:

- bearer credential validation;
- OAuth token expiry validation;
- API-key lookup;
- authenticated user lookup;
- existing per-user API data paths;
- distinct device IDs for concurrent writers.

Only the subscription entitlement decision is bypassed when `LFT_REQUIRE_SUBSCRIPTION=false`.
