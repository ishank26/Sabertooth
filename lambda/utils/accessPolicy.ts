import { ILimitedUserDao } from "../dao/userDao";
import { IDI } from "./di";
import { Subscriptions } from "./subscriptions";

/**
 * Access policy for authenticated API/MCP callers.
 *
 * Upstream Liftosaur requires an active subscription for authenticated API
 * and MCP account tools. Sabertooth keeps that behavior available for
 * compatibility, but self-hosted deployments can disable the billing gate by
 * setting LFT_REQUIRE_SUBSCRIPTION=false.
 */
export function AccessPolicy_requiresSubscription(): boolean {
  const value = process.env.LFT_REQUIRE_SUBSCRIPTION;
  if (value == null || value.trim() === "") {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  // Fail closed for a malformed deployment setting.
  return true;
}

export async function AccessPolicy_canUseAccountTools(
  di: IDI,
  userId: string,
  user: ILimitedUserDao
): Promise<boolean> {
  if (!AccessPolicy_requiresSubscription()) {
    return true;
  }

  const subscriptions = new Subscriptions(di.log, di.secrets);
  return subscriptions.hasSubscription(di, userId, user.storage.subscription);
}
