# Next steps

Completed foundations:

1. Parameterize public/API hostnames, OAuth metadata, and MCP service identity away from hard-coded Liftosaur production URLs.
2. Make the Sabertooth Lambda entrypoint subscription-free by default while retaining authenticated API/MCP access controls.
3. Make client feature entitlement subscription-free by default so premium feature gates, API-key access, and account plan UI resolve to full/free access without store receipts.

Remaining work:

1. Rebrand remaining user-facing Liftosaur names, icons, deep-link schemes, and bundle identifiers while retaining AGPL/upstream notices.
2. Stop initializing unused in-app-purchase flows in Sabertooth builds, then remove payment/subscription infrastructure once compatibility is no longer needed.
3. Add a simpler self-host deployment target outside the current AWS-specific stack.
4. Parameterize remaining native/web production hosts and telemetry destinations that still point at Liftosaur infrastructure.
5. Validate import of Liftosaur JSON exports into Sabertooth.
