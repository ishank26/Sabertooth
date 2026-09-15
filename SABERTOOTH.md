# Sabertooth fork notes

Sabertooth is a fork of Liftosaur intended for self-hosted use while preserving the upstream AGPL-3.0 license and attribution.

## Subscription-free API and MCP mode

Upstream Liftosaur requires an active subscription before authenticated REST API and MCP account tools can run. Sabertooth routes both access paths through a shared access policy.

For a Sabertooth self-hosted deployment, set:

```bash
LFT_REQUIRE_SUBSCRIPTION=false
```

With that setting:

- Authentication is still required for private account tools.
- OAuth and API-key identity checks are unchanged.
- REST API calls may access only the authenticated user's data through the existing API layer.
- MCP account tools may access only the authenticated user's data through the existing executor/API layer.
- Public reference MCP tools remain unauthenticated, matching upstream behavior.
- Apple/Google purchase receipts and Liftosaur free-user entitlement keys are not required for API/MCP access.

If `LFT_REQUIRE_SUBSCRIPTION` is absent, malformed, or set to a truthy value (`1`, `true`, `yes`, `on`), the upstream subscription gate remains enabled. This fail-closed default makes it possible to keep upstream-compatible deployments while explicitly opting a Sabertooth deployment into free authenticated access.

## Security boundary

Subscription-free does **not** mean authentication-free. Do not expose account tools without OAuth or a strong API key. The subscription entitlement check is separate from authorization; Sabertooth removes the billing requirement in free mode while retaining the existing credential and user-isolation paths.

## Current implementation

The first implementation phase changes only the access decision:

1. `lambda/utils/accessPolicy.ts` centralizes the subscription policy.
2. `lambda/utils/apiKeyAuth.ts` uses the policy after API-key and user validation.
3. `lambda/mcp/handler.ts` uses the same policy after OAuth/API-key and user validation.
4. `test/freeAccess.test.ts` verifies authenticated REST and MCP calls work without subscription state when free mode is enabled, while unauthenticated calls still fail.

## Next phases

- Parameterize Liftosaur-specific hosts/domains and configure the self-host stack to set `LFT_REQUIRE_SUBSCRIPTION=false` automatically.
- Rebrand user-facing Liftosaur names, icons, bundle IDs, and MCP server metadata to Sabertooth while keeping required upstream notices.
- Remove unused commerce/payment infrastructure from the Sabertooth deployment after parity is established.
- Add a deployment path that is easier to self-host than the current Liftosaur AWS stack.
- Import existing user data through Liftosaur's supported JSON export/import path rather than accessing Liftosaur production storage.
