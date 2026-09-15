# Free authenticated access

Sabertooth keeps authentication and per-user authorization while making paid subscription entitlement optional for self-hosted deployments.

## Decision

Both authenticated REST API requests and authenticated MCP account tools pass through `AccessPolicy_canUseAccountTools`.

- `LFT_REQUIRE_SUBSCRIPTION=false` allows any correctly authenticated user to use their own account tools without Apple/Google/free-user entitlement state.
- Any other value, including an unset or malformed value, preserves the upstream subscription requirement.
- Public MCP reference tools are unchanged.

## Why this design

The billing decision is kept separate from authentication. API keys, OAuth tokens, user lookup, vector-clock device IDs, and the existing API/MCP executor remain intact. This avoids replacing a billing check with an authorization bypass.

## Deployment expectation

A Sabertooth self-host deployment should set `LFT_REQUIRE_SUBSCRIPTION=false` at the server/Lambda environment level. A later infrastructure phase should make that setting automatic for Sabertooth stacks and remove unused payment infrastructure.
