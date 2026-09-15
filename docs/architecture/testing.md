# Access-policy test scope

The first Sabertooth access-policy tests verify that `LFT_REQUIRE_SUBSCRIPTION=false` permits authenticated REST and MCP account calls for a user with no subscription state, while unauthenticated calls remain rejected.

The upstream subscription-required tests remain useful because the policy defaults to fail-closed compatibility when the environment variable is absent.
