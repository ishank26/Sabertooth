# Next steps

A detailed executable plan for all remaining phases is maintained in [implementation-roadmap.md](./implementation-roadmap.md).

Completed foundations:

1. Parameterize public/API hostnames, OAuth metadata, and MCP service identity away from hard-coded Liftosaur production URLs.
2. Make the Sabertooth Lambda entrypoint subscription-free by default while retaining authenticated API/MCP access controls.
3. Make client feature entitlement subscription-free by default so premium feature gates, API-key access, and account plan UI resolve to full/free access without store receipts.
4. Keep native store/IAP adapters and receipt-verification calls inert in Sabertooth free mode, while retaining an explicit compatibility switch for subscription-gated deployments.

Remaining work:

1. Complete the dependency/infrastructure audit that gates the self-host design.
2. Add a simpler self-host deployment target outside the current AWS-specific stack.
3. Validate MCP + OAuth end-to-end against the self-hosted target.
4. Parameterize or disable remaining native/web production hosts and telemetry destinations that still point at Liftosaur infrastructure.
5. Rebrand remaining user-facing Liftosaur names, icons, deep-link schemes, and bundle identifiers while retaining AGPL/upstream notices.
6. Remove now-unused commerce UI/thunks/payment infrastructure after compatibility requirements are finalized.
7. Validate import of Liftosaur JSON exports into Sabertooth.
8. Build reproducible mobile release pipelines.
9. Install and manage the canonical 4-day fitness program through Sabertooth MCP.
10. Harden backup/restore, security, observability, and upstream synchronization.
