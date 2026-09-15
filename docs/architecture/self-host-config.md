# Self-host MCP and OAuth configuration

Sabertooth keeps the upstream protocol implementation but allows the externally visible origin and MCP server identity to be configured independently of liftosaur.com.

## Public URL

Set the public HTTPS origin of the Sabertooth service:

```bash
SABERTOOTH_PUBLIC_URL=https://fitness.example.com
```

This value is used for:

- OAuth protected-resource metadata (`/.well-known/oauth-protected-resource`)
- OAuth authorization-server metadata (`/.well-known/oauth-authorization-server`)
- OAuth authorization/login redirects
- MCP `WWW-Authenticate` resource metadata challenges

Trailing slashes are removed automatically. `PUBLIC_BASE_URL` is accepted as a generic fallback variable.

If neither value is set, the library preserves upstream Liftosaur development/production URL behavior for compatibility.

## MCP identity

The deployed Sabertooth Lambda advertises `sabertooth-mcp` by default. It can be overridden with:

```bash
SABERTOOTH_MCP_SERVER_NAME=my-fitness-mcp
```

`MCP_SERVER_NAME` is accepted as a generic fallback.

## Access

The earlier free-access phase remains separate from service addressing. Sabertooth's deployed Lambda defaults to subscription-free authenticated access; setting `LFT_REQUIRE_SUBSCRIPTION=true` restores the upstream entitlement check.

These settings do not disable authentication. Private MCP/API account tools still require a valid OAuth token or API key.
