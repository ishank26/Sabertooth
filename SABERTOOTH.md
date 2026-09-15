# Sabertooth fork notes

Sabertooth is a fork of Liftosaur intended for self-hosted use while preserving the upstream AGPL-3.0 license and attribution.

## Subscription-free API and MCP mode

Upstream Liftosaur requires an active subscription before authenticated REST API and MCP account tools can run. Sabertooth routes both access paths through a shared access policy.

The Sabertooth Lambda entrypoint defaults to subscription-free access. For other entrypoints (for example a custom local server), set:

```bash
LFT_REQUIRE_SUBSCRIPTION=false
```

With free access enabled:

- Authentication is still required for private account tools.
- OAuth and API-key identity checks are unchanged.
- REST API calls may access only the authenticated user's data through the existing API layer.
- MCP account tools may access only the authenticated user's data through the existing executor/API layer.
- Public reference MCP tools remain unauthenticated, matching upstream behavior.
- Apple/Google purchase receipts and Liftosaur free-user entitlement keys are not required for API/MCP access.

`AccessPolicy_requiresSubscription()` remains fail-closed when used directly: if `LFT_REQUIRE_SUBSCRIPTION` is absent, malformed, or set to a truthy value (`1`, `true`, `yes`, `on`), the upstream subscription gate is enabled. `lambda/run.ts` explicitly supplies Sabertooth's default by setting the variable to `false` when it is absent. Set `LFT_REQUIRE_SUBSCRIPTION=true` to intentionally restore upstream entitlement behavior.

## Security boundary

Subscription-free does **not** mean authentication-free. Do not expose account tools without OAuth or a strong API key. The subscription entitlement check is separate from authorization; Sabertooth removes the billing requirement in free mode while retaining the existing credential and user-isolation paths.

## Current implementation

The first implementation phase changes only the access decision:

1. `lambda/utils/accessPolicy.ts` centralizes the subscription policy.
2. `lambda/utils/apiKeyAuth.ts` uses the policy after API-key and user validation.
3. `lambda/mcp/handler.ts` uses the same policy after OAuth/API-key and user validation.
4. `lambda/run.ts` defaults Sabertooth's deployed Lambda to subscription-free mode.
5. `test/freeAccess.test.ts` verifies authenticated REST and MCP calls work without subscription state when free mode is enabled, while unauthenticated calls still fail.

## Next phases

- Parameterize Liftosaur-specific hosts/domains and configuration for self-hosting.
- Rebrand user-facing Liftosaur names, icons, bundle IDs, and MCP server metadata to Sabertooth while keeping required upstream notices.
- Remove unused commerce/payment infrastructure from the Sabertooth deployment after parity is established.
- Add a deployment path that is easier to self-host than the current Liftosaur AWS stack.
- Import existing user data through Liftosaur's supported JSON export/import path rather than accessing Liftosaur production storage.
