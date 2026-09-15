import { Utils_getEnv, Utils_isLocal } from "../utils";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Public origin used in OAuth metadata, login redirects, and MCP auth challenges.
 *
 * Self-hosted Sabertooth deployments should set SABERTOOTH_PUBLIC_URL to the
 * externally reachable HTTPS origin, e.g. https://fitness.example.com.
 */
export function ServiceConfig_publicBaseUrl(): string {
  const configured = process.env.SABERTOOTH_PUBLIC_URL || process.env.PUBLIC_BASE_URL;
  if (configured?.trim()) {
    return trimTrailingSlash(configured.trim());
  }

  if (Utils_isLocal()) {
    return "https://local.liftosaur.com:8080";
  }

  return Utils_getEnv() === "dev" ? "https://stage.liftosaur.com" : "https://www.liftosaur.com";
}

/** MCP server metadata name advertised during initialize. */
export function ServiceConfig_mcpServerName(): string {
  return process.env.SABERTOOTH_MCP_SERVER_NAME?.trim() || process.env.MCP_SERVER_NAME?.trim() || "liftosaur-mcp";
}
